import { pool } from './db';
import { AgentResult } from '../types';

/** Writes every agent's run to agent_activity_log — the audit trail the Governance tab and schema comment promise. */
export async function logAgentActivity(log: AgentResult<unknown>[], opportunityId: string | null): Promise<void> {
  for (const entry of log) {
    await pool.query(
      `INSERT INTO agent_activity_log (agent_name, opportunity_id, action, output_summary, model_used, duration_ms)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.agentName,
        opportunityId,
        entry.success ? 'run' : 'error',
        JSON.stringify(entry.success ? entry.data : { error: entry.notes }),
        entry.modelUsed ?? null,
        entry.durationMs,
      ]
    );
  }
}
