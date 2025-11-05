export interface VectorStoreDocument {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
  embedding: number[];
}

export interface SimilaritySearchResult {
  id: string;
  text: string;
  meta?: Record<string, unknown>;
  score: number;
}

const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions do not match');
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

class InMemoryVectorStore {
  private documents: VectorStoreDocument[] = [];

  addDocs(docs: VectorStoreDocument[]) {
    if (docs.length === 0) return;
    this.documents.push(...docs);
  }

  similaritySearch(queryEmbedding: number[], k = 4): SimilaritySearchResult[] {
    if (this.documents.length === 0) {
      return [];
    }

    const scored = this.documents.map((doc) => ({
      id: doc.id,
      text: doc.text,
      meta: doc.meta,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .filter((item) => Number.isFinite(item.score));
  }
}

export const vectorStore = new InMemoryVectorStore();
