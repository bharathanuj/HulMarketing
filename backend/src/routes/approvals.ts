import { Router } from 'express';
import { pool } from '../db/db';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { Asset, Brand, Campaign, Opportunity, PipelineContext } from '../types';

const router = Router();

/**
 * POST /api/approvals
 * Records a human decision (APPROVE / EDIT / REJECT). Only on APPROVE does this
 * call ActivationAgent — publishing NEVER happens without this endpoint being hit
 * by an authenticated human reviewer. This is the one hard governance gate.
 * Body: { opportunityId: string, reviewerName: string, decision: 'APPROVED'|'EDITED'|'REJECTED', notes?: string }
 */
router.post('/', async (req, res) => {
  const { opportunityId, reviewerName, decision, notes } = req.body as {
    opportunityId: string;
    reviewerName: string;
    decision: 'APPROVED' | 'EDITED' | 'REJECTED';
    notes?: string;
  };

  await pool.query(
    'INSERT INTO approvals (opportunity_id, reviewer_name, decision, notes) VALUES ($1, $2, $3, $4)',
    [opportunityId, reviewerName, decision, notes ?? null]
  );

  if (decision === 'APPROVED') {
    const campaignRow = (
      await pool.query(
        `SELECT campaign_id AS "campaignId", opportunity_id AS "opportunityId", big_idea AS "bigIdea", headline
         FROM campaigns WHERE opportunity_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [opportunityId]
      )
    ).rows[0];

    const assets: Asset[] = campaignRow
      ? (
          await pool.query(
            `SELECT asset_id AS "assetId", campaign_id AS "campaignId", platform, asset_type AS "assetType",
                    content, governance_status AS "governanceStatus", governance_notes AS "governanceNotes"
             FROM assets WHERE campaign_id = $1`,
            [campaignRow.campaignId]
          )
        ).rows
      : [];

    const context: PipelineContext = {
      brand: {} as Brand,
      opportunity: { opportunityId } as Opportunity,
      campaign: campaignRow ? ({ ...campaignRow, assets } as Campaign) : undefined,
      log: [],
    };

    const orchestrator = new AgentOrchestrator({ brandKnowledge: [], forbiddenClaims: [], targetMarkets: [] });
    const activation = await orchestrator.activate(context);

    await pool.query(`UPDATE opportunities SET status = 'ACTIONED' WHERE opportunity_id = $1`, [opportunityId]);

    return res.json({ status: 'recorded', activation: activation.data });
  }

  res.json({ status: 'recorded' });
});

export default router;
