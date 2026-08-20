import { Router } from 'express';
import { pool } from '../db/db';

const router = Router();

/** GET /api/opportunities — powers the Live Pulse / Opportunity Control Tower view. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT opportunity_id AS "opportunityId", title,
            opportunity_score AS "opportunityScore",
            autonomy_level AS "autonomyLevel",
            opportunity_window_minutes AS "opportunityWindowMinutes",
            evidence, status, created_at AS "createdAt"
     FROM opportunities ORDER BY opportunity_score DESC, created_at DESC LIMIT 100`
  );
  res.json(result.rows);
});

/** GET /api/opportunities/:id — powers the Opportunity Card detail screen. */
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT opportunity_id AS "opportunityId", brand_id AS "brandId", title,
            opportunity_score AS "opportunityScore",
            autonomy_level AS "autonomyLevel",
            opportunity_window_minutes AS "opportunityWindowMinutes",
            evidence, status, created_at AS "createdAt"
     FROM opportunities WHERE opportunity_id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(result.rows[0]);
});

export default router;
