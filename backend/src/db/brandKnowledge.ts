import { pool } from './db';

/** Pulls a brand's knowledge (positioning, tone, uploaded PDFs, etc.) for RAG, splitting out forbidden-claims rows. */
export async function getBrandKnowledge(brandId: string): Promise<{ brandKnowledge: string[]; forbiddenClaims: string[] }> {
  const rows = await pool.query<{ doc_type: string; content: string }>(
    'SELECT doc_type, content FROM brand_knowledge WHERE brand_id = $1',
    [brandId]
  );

  const brandKnowledge: string[] = [];
  const forbiddenClaims: string[] = [];
  for (const row of rows.rows) {
    if (row.doc_type === 'forbidden_claims') forbiddenClaims.push(row.content);
    else brandKnowledge.push(row.content);
  }
  return { brandKnowledge, forbiddenClaims };
}
