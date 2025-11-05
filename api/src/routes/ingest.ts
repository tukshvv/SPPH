import { Router } from 'express';
import { z } from 'zod';
import { normalizeDocuments } from '../rag/ingest.js';
import { getEmbeddingsClient } from '../rag/embeddings.js';
import { vectorStore } from '../rag/vectorStore.js';
import { HttpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const ingestSchema = z.object({
  docs: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        text: z.string().min(1),
        meta: z.record(z.unknown()).optional()
      })
    )
    .min(1)
});

export const ingestRouter = Router();

ingestRouter.post('/ingest', async (req, res, next) => {
  try {
    const parsed = ingestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'INVALID_INGEST_PAYLOAD', 'docs array is required');
    }

    const { docs } = parsed.data;
    const normalized = normalizeDocuments(docs);

    if (normalized.length === 0) {
      throw new HttpError(400, 'NO_CHUNKS', 'Не удалось извлечь текстовые фрагменты из документов');
    }

    const embeddings = getEmbeddingsClient();
    const vectors = await embeddings.embedDocuments(normalized.map((chunk) => chunk.text));

    vectorStore.addDocs(
      normalized.map((chunk, index) => ({
        id: chunk.id,
        text: chunk.text,
        meta: chunk.meta,
        embedding: vectors[index]
      }))
    );

    logger.info(
      {
        requestId: req.requestId,
        insertedDocs: docs.length,
        chunks: normalized.length
      },
      'Ingested documents into vector store'
    );

    res.json({ inserted: docs.length, chunks: normalized.length });
  } catch (error) {
    next(error);
  }
});
