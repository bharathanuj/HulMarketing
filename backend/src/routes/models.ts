import { Router } from 'express';
import { pool } from '../db/db';
import { setActiveModel } from '../config/modelConfig';

const router = Router();

/** GET /api/models — full registry (LLMs + plugins/wrappers/tools), powers the AI Models tab. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT model_id AS "modelId", name, provider, model_ref AS "modelRef", role, category,
            description, link, is_active AS "isActive", notes, created_at AS "createdAt"
     FROM ai_models ORDER BY category, role NULLS LAST, is_active DESC, created_at DESC`
  );
  res.json(result.rows);
});

/**
 * POST /api/models — register a new entry.
 * category='llm' entries need a role (reasoning|copy|vision) and aren't active
 * until explicitly activated. Other categories (plugin|wrapper|tool) are just a
 * reference registry of AI tools used across the company — description/link
 * capture what it is and where to find it; isActive here just means "in use".
 */
router.post('/', async (req, res) => {
  const { name, provider, modelRef, role, category, description, link, notes } = req.body as {
    name: string;
    provider?: string;
    modelRef: string;
    role?: 'reasoning' | 'copy' | 'vision';
    category?: 'llm' | 'plugin' | 'wrapper' | 'tool';
    description?: string;
    link?: string;
    notes?: string;
  };

  if (!name || !modelRef) return res.status(400).json({ error: 'name and modelRef are required' });
  const cat = category || 'llm';
  if (cat === 'llm' && !role) return res.status(400).json({ error: 'role is required for category=llm' });

  const result = await pool.query(
    `INSERT INTO ai_models (name, provider, model_ref, role, category, description, link, notes, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING model_id AS "modelId", name, provider, model_ref AS "modelRef", role, category,
               description, link, is_active AS "isActive", notes, created_at AS "createdAt"`,
    [name, provider || (cat === 'llm' ? 'ollama' : 'internal'), modelRef, cat === 'llm' ? role : null, cat, description ?? null, link ?? null, notes ?? null, cat !== 'llm']
  );
  res.status(201).json(result.rows[0]);
});

/** POST /api/models/:id/activate — LLMs: becomes the live model for its role, every agent picks it up on the next run. Others: marks it "in use". */
router.post('/:id/activate', async (req, res) => {
  const { rows } = await pool.query('SELECT category FROM ai_models WHERE model_id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });

  try {
    if (rows[0].category === 'llm') {
      await setActiveModel(req.params.id);
    } else {
      await pool.query('UPDATE ai_models SET is_active = true WHERE model_id = $1', [req.params.id]);
    }
    res.json({ status: 'activated' });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Activation failed' });
  }
});

/** POST /api/models/:id/deactivate — plugins/wrappers/tools only (LLMs are deactivated by activating a sibling). */
router.post('/:id/deactivate', async (req, res) => {
  await pool.query(`UPDATE ai_models SET is_active = false WHERE model_id = $1 AND category != 'llm'`, [req.params.id]);
  res.json({ status: 'deactivated' });
});

/** DELETE /api/models/:id — remove an entry (an active LLM must be deactivated by activating another model in its role first). */
router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query('SELECT is_active, category FROM ai_models WHERE model_id = $1', [req.params.id]);
  if (rows[0]?.is_active && rows[0]?.category === 'llm') {
    return res.status(400).json({ error: 'Cannot delete the active model for a role — activate another model first.' });
  }
  await pool.query('DELETE FROM ai_models WHERE model_id = $1', [req.params.id]);
  res.status(204).send();
});

export default router;
