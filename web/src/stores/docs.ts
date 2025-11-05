import { defineStore } from 'pinia';
import { apiClient } from '../lib/api';

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 150;

export interface DocumentChunk {
  index: number;
  text: string;
}

export interface IngestedDocument {
  id: string;
  chunks: DocumentChunk[];
  meta?: Record<string, unknown>;
  createdAt: string;
}

interface DocsState {
  documents: IngestedDocument[];
  isIngesting: boolean;
  lastInserted?: { docId: string; chunks: number };
}

const normalizeWhitespace = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .trim();

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

export const useDocsStore = defineStore('docs', {
  state: (): DocsState => ({
    documents: [],
    isIngesting: false,
    lastInserted: undefined
  }),
  actions: {
    async ingestDocument(payload: { text: string; id?: string; meta?: Record<string, unknown> }) {
      const trimmed = payload.text.trim();
      if (!trimmed) {
        throw new Error('Текст для загрузки не должен быть пустым');
      }

      const docId = payload.id?.trim() || crypto.randomUUID();
      const chunks = splitIntoChunks(trimmed);

      if (chunks.length === 0) {
        throw new Error('Не удалось разбить документ на блоки. Проверьте содержимое.');
      }

      this.isIngesting = true;
      try {
        await apiClient.ingestDocuments([
          {
            id: docId,
            text: trimmed,
            meta: payload.meta
          }
        ]);

        const chunkEntries: DocumentChunk[] = chunks.map((text, index) => ({ index, text }));

        this.documents = this.documents.filter((doc) => doc.id !== docId);
        this.documents.push({
          id: docId,
          chunks: chunkEntries,
          meta: payload.meta,
          createdAt: new Date().toISOString()
        });
        this.lastInserted = { docId, chunks: chunkEntries.length };
      } finally {
        this.isIngesting = false;
      }
    },
    getChunkText(docId: string, chunkIdx: number) {
      const doc = this.documents.find((item) => item.id === docId);
      if (!doc) return undefined;
      return doc.chunks.find((chunk) => chunk.index === chunkIdx)?.text;
    }
  }
});
