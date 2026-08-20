import { pool } from '../db/db';

export type ModelRole = 'reasoning' | 'copy' | 'vision';

/**
 * In-memory, agent-facing view of "which model is active per role". Agents read
 * these fields synchronously (as class field initializers), so this stays a
 * plain mutable object refreshed from `ai_models` rather than queried per-call.
 * The AI Models tab writes through `setActiveModel`, so a change takes effect
 * on the next pipeline run with no server restart.
 */
export const modelConfig: Record<ModelRole, string> = {
  reasoning: process.env.OLLAMA_REASONING_MODEL || 'llama3.1',
  copy: process.env.OLLAMA_COPY_MODEL || 'llama3.1',
  vision: process.env.OLLAMA_VISION_MODEL || 'llama3.1',
};

/** Called once at server startup — loads whatever's marked active in ai_models over the .env defaults. */
export async function loadModelConfig(): Promise<void> {
  const rows = await pool.query<{ role: ModelRole; model_ref: string }>(
    'SELECT role, model_ref FROM ai_models WHERE is_active = true'
  );
  for (const row of rows.rows) {
    modelConfig[row.role] = row.model_ref;
  }
}

/** Marks one model active for its role (deactivating any other active row for that role) and refreshes the live config. */
export async function setActiveModel(modelId: string): Promise<void> {
  const { rows } = await pool.query<{ role: ModelRole; model_ref: string }>(
    'SELECT role, model_ref FROM ai_models WHERE model_id = $1',
    [modelId]
  );
  const model = rows[0];
  if (!model) throw new Error('Model not found');

  await pool.query('UPDATE ai_models SET is_active = false WHERE role = $1', [model.role]);
  await pool.query('UPDATE ai_models SET is_active = true WHERE model_id = $1', [modelId]);
  modelConfig[model.role] = model.model_ref;
}
