import { randomUUID } from 'node:crypto';

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

export interface RawIngestDocument {
  id?: string;
  text: string;
  meta?: Record<string, unknown>;
}

export interface NormalizedChunk {
  id: string;
  docId: string;
  chunkIndex: number;
  text: string;
  meta: Record<string, unknown>;
}

const normalizeWhitespace = (text: string) => {
  return text.replace(/\r\n/g, '\n').replace(/[\t ]+/g, ' ').trim();
};

const splitIntoChunks = (text: string): string[] => {
  const normalized = normalizeWhitespace(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const candidateNewline = normalized.lastIndexOf('\n', end);
      const candidateSpace = normalized.lastIndexOf(' ', end);
      const candidate = Math.max(candidateNewline, candidateSpace);

      if (candidate > start + 200) {
        end = candidate;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    let nextStart = end - CHUNK_OVERLAP;
    if (nextStart <= start) {
      nextStart = end;
    }
    start = nextStart;
  }

  return chunks;
};

export const normalizeDocuments = (docs: RawIngestDocument[]): NormalizedChunk[] => {
  const chunks: NormalizedChunk[] = [];

  docs.forEach((doc) => {
    const docId = doc.id ?? randomUUID();
    const meta = doc.meta ?? {};
    const split = splitIntoChunks(doc.text);

    split.forEach((text, index) => {
      const chunkMeta: Record<string, unknown> = {
        ...meta,
        docId,
        chunkIndex: index
      };

      chunks.push({
        id: `${docId}:chunk-${index}`,
        docId,
        chunkIndex: index,
        text,
        meta: chunkMeta
      });
    });
  });

  return chunks;
};
