import { Router } from 'express';
import { pool } from '../db/db';

const router = Router();

/** GET /api/governance — per-asset clearance status from the Brand Guardian agent, powers the Governance tab. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT a.asset_id AS "assetId", a.campaign_id AS "campaignId",
            c.opportunity_id AS "opportunityId", c.headline,
            a.platform, a.asset_type AS "assetType",
            a.governance_status AS "governanceStatus", a.governance_notes AS "governanceNotes",
            a.created_at AS "createdAt"
     FROM assets a JOIN campaigns c ON c.campaign_id = a.campaign_id
     ORDER BY a.created_at DESC LIMIT 200`
  );
  res.json(result.rows);
});

export default router;
