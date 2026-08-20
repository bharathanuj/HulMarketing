import { Router } from 'express';
import { pool } from '../db/db';
import { AgentOrchestrator } from '../orchestrator/AgentOrchestrator';
import { Brand, Campaign, Opportunity, PipelineContext } from '../types';

const router = Router();

/** GET /api/learning — post-activation performance outcomes, powers the Learning tab. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT l.outcome_id AS "outcomeId", l.opportunity_id AS "opportunityId",
            o.title AS "opportunityTitle", l.engagement_rate AS "engagementRate",
            l.sentiment_delta AS "sentimentDelta",
            l.recommendation_accepted AS "recommendationAccepted",
            l.notes, l.recorded_at AS "recordedAt"
     FROM learning_outcomes l JOIN opportunities o ON o.opportunity_id = l.opportunity_id
     ORDER BY l.recorded_at DESC LIMIT 200`
  );
  res.json(result.rows);
});

/**
 * POST /api/learning
 * Records post-activation performance for an opportunity, closing the loop
 * described in the blueprint's Learning Agent. If a campaign exists, also runs
 * LearningAgent for a qualitative "what worked" summary folded into notes.
 * Body: { opportunityId, engagementRate?, sentimentDelta?, recommendationAccepted?, notes? }
 */
router.post('/', async (req, res) => {
  const { opportunityId, engagementRate, sentimentDelta, recommendationAccepted, notes } = req.body as {
    opportunityId: string;
    engagementRate?: number;
    sentimentDelta?: number;
    recommendationAccepted?: boolean;
    notes?: string;
  };

  let finalNotes = notes ?? '';
  try {
    const oppRow = (
      await pool.query(
        `SELECT title, opportunity_score AS "opportunityScore", autonomy_level AS "autonomyLevel"
         FROM opportunities WHERE opportunity_id = $1`,
        [opportunityId]
      )
    ).rows[0];
    const campaignRow = (
      await pool.query(
        `SELECT campaign_id AS "campaignId", big_idea AS "bigIdea", headline
         FROM campaigns WHERE opportunity_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [opportunityId]
      )
    ).rows[0];

    if (oppRow && campaignRow) {
      const context: PipelineContext = {
        brand: {} as Brand,
        opportunity: { ...oppRow, opportunityId } as Opportunity,
        campaign: { ...campaignRow, assets: [] } as Campaign,
        log: [],
      };
      const orchestrator = new AgentOrchestrator({ brandKnowledge: [], forbiddenClaims: [], targetMarkets: [] });
      const result = await orchestrator.learn(context);
      const summary = `${result.data.whatWorked} ${result.data.recommendationForNextTime}`.trim();
      finalNotes = notes ? `${summary} | ${notes}` : summary;
    }
  } catch {
    // Fall back to whatever notes the human provided — the qualitative summary is a bonus, not a blocker.
  }

  const insert = await pool.query(
    `INSERT INTO learning_outcomes (opportunity_id, engagement_rate, sentiment_delta, recommendation_accepted, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING outcome_id AS "outcomeId", recorded_at AS "recordedAt"`,
    [opportunityId, engagementRate ?? null, sentimentDelta ?? null, recommendationAccepted ?? null, finalNotes]
  );

  await pool.query(`UPDATE opportunities SET status = 'LOGGED' WHERE opportunity_id = $1`, [opportunityId]);

  res.status(201).json({ ...insert.rows[0], notes: finalNotes });
});

export default router;
