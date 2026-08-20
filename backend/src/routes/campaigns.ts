import { Router } from 'express';
import { pool } from '../db/db';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { Brand, Opportunity, PipelineContext, Signal } from '../types';
import { getBrandKnowledge } from '../db/brandKnowledge';
import { logAgentActivity } from '../db/activityLog';

const router = Router();

/** GET /api/campaigns — powers the Campaigns tab. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT c.campaign_id AS "campaignId", c.opportunity_id AS "opportunityId",
            o.title AS "opportunityTitle", c.big_idea AS "bigIdea", c.headline,
            c.created_at AS "createdAt"
     FROM campaigns c JOIN opportunities o ON o.opportunity_id = c.opportunity_id
     ORDER BY c.created_at DESC LIMIT 100`
  );
  res.json(result.rows);
});

/** GET /api/campaigns/by-opportunity/:opportunityId — powers the Campaign Builder / Brand Guardian screens. */
router.get('/by-opportunity/:opportunityId', async (req, res) => {
  const campaignRow = await pool.query(
    `SELECT campaign_id AS "campaignId", opportunity_id AS "opportunityId",
            big_idea AS "bigIdea", headline, created_at AS "createdAt"
     FROM campaigns WHERE opportunity_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [req.params.opportunityId]
  );
  const campaign = campaignRow.rows[0];
  if (!campaign) return res.status(404).json({ error: 'No campaign yet for this opportunity' });

  const assets = await pool.query(
    `SELECT asset_id AS "assetId", campaign_id AS "campaignId", platform, asset_type AS "assetType",
            content, governance_status AS "governanceStatus", governance_notes AS "governanceNotes"
     FROM assets WHERE campaign_id = $1 ORDER BY platform`,
    [campaign.campaignId]
  );

  res.json({ ...campaign, assets: assets.rows });
});

/**
 * POST /api/campaigns/generate
 * Runs CREATE -> GOVERN for an existing opportunity (looked up server-side, along
 * with its originating brand/signal and the brand's knowledge base), then persists
 * the resulting campaign and assets. Kept as a separate step from /api/signals so
 * the UI can show the opportunity score first and let a human decide whether to
 * even trigger generation.
 * Body: { opportunityId: string, targetMarkets?: string[] }
 */
router.post('/generate', async (req, res) => {
  try {
    const { opportunityId, targetMarkets = [] } = req.body as { opportunityId: string; targetMarkets?: string[] };

    const row = (
      await pool.query(
        `SELECT o.opportunity_id AS "opportunityId", o.brand_id AS "brandId", o.title,
                o.opportunity_score AS "opportunityScore", o.autonomy_level AS "autonomyLevel",
                o.opportunity_window_minutes AS "opportunityWindowMinutes", o.evidence, o.status,
                o.created_at AS "createdAt",
                b.name AS "brandName", b.category AS "brandCategory", b.market AS "brandMarket",
                s.signal_id AS "signalId", s.source, s.raw_payload AS "rawPayload", s.entities,
                s.geography, s.language, s.velocity_score AS "velocityScore", s.confidence,
                s.detected_at AS "detectedAt"
         FROM opportunities o
         JOIN brands b ON b.brand_id = o.brand_id
         LEFT JOIN signals s ON s.signal_id = o.signal_id
         WHERE o.opportunity_id = $1`,
        [opportunityId]
      )
    ).rows[0];

    if (!row) return res.status(404).json({ error: 'Opportunity not found' });

    const brand: Brand = { brandId: row.brandId, name: row.brandName, category: row.brandCategory, market: row.brandMarket };
    const signal: Signal | undefined = row.signalId
      ? {
          signalId: row.signalId,
          source: row.source,
          rawPayload: row.rawPayload,
          entities: row.entities,
          geography: row.geography,
          language: row.language,
          velocityScore: Number(row.velocityScore),
          confidence: Number(row.confidence),
          detectedAt: row.detectedAt,
        }
      : undefined;
    const opportunity: Opportunity = {
      opportunityId: row.opportunityId,
      signalId: row.signalId,
      brandId: row.brandId,
      title: row.title,
      opportunityScore: Number(row.opportunityScore),
      autonomyLevel: row.autonomyLevel,
      opportunityWindowMinutes: row.opportunityWindowMinutes,
      evidence: row.evidence,
      status: row.status,
      createdAt: row.createdAt,
    };

    const context: PipelineContext = { brand, signal, opportunity, log: [] };

    const { brandKnowledge, forbiddenClaims } = await getBrandKnowledge(brand.brandId);
    const orchestrator = new AgentOrchestrator({ brandKnowledge, forbiddenClaims, targetMarkets });
    const updated = await orchestrator.createAndGovern(context);
    const approvalPacket = await orchestrator.prepareApproval(updated);

    const campaignInsert = await pool.query(
      `INSERT INTO campaigns (opportunity_id, big_idea, headline, creative_brief)
       VALUES ($1, $2, $3, $4) RETURNING campaign_id AS "campaignId", created_at AS "createdAt"`,
      [opportunityId, updated.campaign!.bigIdea, updated.campaign!.headline, JSON.stringify(updated.creativeBrief)]
    );
    Object.assign(updated.campaign!, campaignInsert.rows[0]);

    for (const asset of updated.campaign!.assets) {
      const assetInsert = await pool.query(
        `INSERT INTO assets (campaign_id, platform, asset_type, content, governance_status, governance_notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING asset_id AS "assetId"`,
        [updated.campaign!.campaignId, asset.platform, asset.assetType, asset.content, asset.governanceStatus, asset.governanceNotes ?? null]
      );
      asset.assetId = assetInsert.rows[0].assetId;
      asset.campaignId = updated.campaign!.campaignId;
    }

    await pool.query(`UPDATE opportunities SET status = 'REVIEW' WHERE opportunity_id = $1`, [opportunityId]);
    await logAgentActivity(updated.log, opportunityId);

    res.json({ campaign: updated.campaign, approvalPacket: approvalPacket.data, log: updated.log });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
