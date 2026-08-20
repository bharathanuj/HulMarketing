import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { pool } from '../db/db';
import { OllamaService } from '../services/OllamaService';
import { modelConfig } from '../config/modelConfig';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
const ollama = new OllamaService();

/** GET /api/documents — library listing, powers the Documents tab. Includes the saved summary so learnings show up every time, not just right after upload. */
router.get('/', async (_req, res) => {
  const result = await pool.query(
    `SELECT d.document_id AS "documentId", d.title, d.filename,
            d.doc_type AS "docType", d.file_size AS "fileSize", d.summary,
            d.uploaded_at AS "uploadedAt", d.brand_id AS "brandId", b.name AS "brandName"
     FROM documents d JOIN brands b ON b.brand_id = d.brand_id
     ORDER BY d.uploaded_at DESC LIMIT 200`
  );
  res.json(result.rows);
});

/** GET /api/documents/:id — full detail including the raw extracted text, for an on-demand "view full extract" panel. */
router.get('/:id', async (req, res) => {
  const result = await pool.query(
    `SELECT d.document_id AS "documentId", d.title, d.filename, d.doc_type AS "docType",
            d.file_size AS "fileSize", d.summary, d.extracted_text AS "extractedText",
            d.uploaded_at AS "uploadedAt", d.brand_id AS "brandId", b.name AS "brandName"
     FROM documents d
     JOIN brands b ON b.brand_id = d.brand_id
     WHERE d.document_id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Document not found' });
  res.json(result.rows[0]);
});

/**
 * POST /api/documents — upload a PDF. Text is extracted and a short "key
 * learnings" summary is generated once and saved, so it's there immediately
 * AND every time the Documents tab is reopened — not regenerated per visit.
 * The SUMMARY (not the raw multi-page text) is what's stored as a
 * brand_knowledge row, so it's what the RAG-grounded agents (Brand Fit, Brand
 * Guardian) actually receive on every pipeline run — concise and on-topic
 * rather than dumping raw PDF text into every prompt. The full raw text is
 * kept on the document itself for the "view full extract" panel.
 */
router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { title, brandId, docType } = req.body as { title?: string; brandId?: string; docType?: string };

  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  if (!brandId) return res.status(400).json({ error: 'brandId is required' });
  if (file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are supported' });

  let extractedText = '';
  try {
    extractedText = (await pdfParse(file.buffer)).text.trim();
  } catch {
    return res.status(400).json({ error: 'Could not parse this PDF' });
  }

  let summary = '';
  if (extractedText) {
    try {
      summary = (
        await ollama.generate({
          model: modelConfig.reasoning,
          system: 'You are summarizing a company document for a brand knowledge library. In 3-5 bullet points (plain text, one per line, no markdown bullets), state the key learnings, facts, or guidance in this document.',
          prompt: extractedText.slice(0, 12000),
        })
      ).trim();
    } catch {
      summary = '';
    }
  }

  const knowledgeContent = summary || extractedText || '(no extractable text)';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const knowledge = await client.query(
      `INSERT INTO brand_knowledge (brand_id, doc_type, content, source_ref)
       VALUES ($1, $2, $3, $4) RETURNING knowledge_id`,
      [brandId, docType || 'company_doc', knowledgeContent, file.originalname]
    );

    const document = await client.query(
      `INSERT INTO documents (brand_id, knowledge_id, title, filename, doc_type, file_size, file_data, extracted_text, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING document_id AS "documentId", title, filename, doc_type AS "docType",
                 file_size AS "fileSize", summary, uploaded_at AS "uploadedAt", brand_id AS "brandId"`,
      [brandId, knowledge.rows[0].knowledge_id, title || file.originalname, file.originalname, docType || 'company_doc', file.size, file.buffer, extractedText || null, summary || null]
    );

    await client.query('COMMIT');
    res.status(201).json(document.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err instanceof Error ? err.message : 'Upload failed' });
  } finally {
    client.release();
  }
});

/** GET /api/documents/:id/file — streams the raw PDF for viewing/download. */
router.get('/:id/file', async (req, res) => {
  const result = await pool.query('SELECT filename, file_data FROM documents WHERE document_id = $1', [req.params.id]);
  const doc = result.rows[0];
  if (!doc) return res.status(404).end();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.filename}"`);
  res.send(doc.file_data);
});

/** DELETE /api/documents/:id — removes the file and its associated knowledge row. */
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT knowledge_id FROM documents WHERE document_id = $1', [req.params.id]);
    await client.query('DELETE FROM documents WHERE document_id = $1', [req.params.id]);
    if (rows[0]?.knowledge_id) {
      await client.query('DELETE FROM brand_knowledge WHERE knowledge_id = $1', [rows[0].knowledge_id]);
    }
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err instanceof Error ? err.message : 'Delete failed' });
  } finally {
    client.release();
  }
});

export default router;
