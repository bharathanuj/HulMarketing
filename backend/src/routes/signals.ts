import { Router } from 'express';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { Brand, Signal } from '../types';
import { pool } from '../db/db';
import { getBrandKnowledge } from '../db/brandKnowledge';
import { logAgentActivity } from '../db/activityLog';

const router = Router();

/**
 * POST /api/signals
 * Ingests a raw signal for a brand and runs SENSE -> UNDERSTAND -> DECIDE,
 * persisting both the signal and the resulting opportunity so they show up
 * in the Live Pulse / Opportunities tabs.
 * Body: { brandId: string, signal: Omit<Signal, 'signalId' | 'detectedAt'> }
 */
router.post('/', async (req, res) => {
  try {
    const { brandId, signal } = req.body as {
      brandId: string;
      signal: Omit<Signal, 'signalId' | 'detectedAt'>;
    };

    const brandRow = await pool.query<Brand>(
      `SELECT brand_id AS "brandId", name, category, market FROM brands WHERE brand_id = $1`,
      [brandId]
    );
    const brand = brandRow.rows[0];
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    const signalInsert = await pool.query(
      `INSERT INTO signals (source, raw_payload, entities, geography, language, velocity_score, confidence)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING signal_id AS "signalId", detected_at AS "detectedAt"`,
      [
        signal.source,
        JSON.stringify(signal.rawPayload ?? {}),
        JSON.stringify(signal.entities ?? []),
        signal.geography,
        signal.language,
        signal.velocityScore,
        signal.confidence,
      ]
    );
    const fullSignal: Signal = { ...signal, ...signalInsert.rows[0] };

    const { brandKnowledge, forbiddenClaims } = await getBrandKnowledge(brandId);
    const orchestrator = new AgentOrchestrator({ brandKnowledge, forbiddenClaims, targetMarkets: [] });
    const context = await orchestrator.senseUnderstandDecide(brand, fullSignal);

    const opp = context.opportunity!;
    const oppInsert = await pool.query(
      `INSERT INTO opportunities (signal_id, brand_id, title, brand_fit_score, momentum_score, audience_score, risk_score, opportunity_score, autonomy_level, opportunity_window_minutes, evidence, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING opportunity_id AS "opportunityId", created_at AS "createdAt"`,
      [
        fullSignal.signalId,
        brandId,
        opp.title,
        opp.evidence.brandFit.score,
        opp.evidence.momentum.score,
        opp.evidence.audience.score,
        opp.evidence.risk.score,
        opp.opportunityScore,
        opp.autonomyLevel,
        opp.opportunityWindowMinutes,
        JSON.stringify(opp.evidence),
        opp.status,
      ]
    );
    Object.assign(opp, oppInsert.rows[0]);

    await logAgentActivity(context.log, opp.opportunityId);

    res.json({ opportunity: opp, evidencePack: context.evidencePack, log: context.log });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

export default router;
