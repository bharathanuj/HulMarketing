import { Router } from 'express';
import { pool } from '../db/db';

const router = Router();

/** GET /api/brands — powers brand pickers (e.g. document upload). */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT brand_id AS "brandId", name, category, market, created_at AS "createdAt"
     FROM brands ORDER BY name`
  );
  res.json(result.rows);
});

export default router;
