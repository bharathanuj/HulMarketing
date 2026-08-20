import { Pool } from 'pg';

// Single shared connection pool. Every route/repository imports this instead
// of creating its own client, so pooling and shutdown are handled in one place.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/project_next',
});

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
