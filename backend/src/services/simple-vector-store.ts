/**
 * Simple In-Memory Vector Store
 * 
 * A lightweight alternative to LangChain's MemoryVectorStore that works
 * with the latest LangChain versions. This implements basic vector similarity
 * search using cosine similarity.
 */

import { Embeddings } from '@langchain/core/embeddings';
import { Document } from '@langchain/core/documents';

interface VectorStoreDocument {
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Simple in-memory vector store for semantic search
 */
export class SimpleVectorStore {
  private documents: VectorStoreDocument[] = [];
  private embeddings: any; // Use any to avoid type conflicts

  constructor(embeddings: any) {
    this.embeddings = embeddings;
  }

  /**
   * Create a vector store from texts
   */
  static async fromTexts(
    texts: string[],
    metadatas: Record<string, any>[] | Record<string, any>,
    embeddings: any
  ): Promise<SimpleVectorStore> {
    const store = new SimpleVectorStore(embeddings);
    await store.addTexts(texts, metadatas);
    return store;
  }

  /**
   * Create a vector store from documents
   */
  static async fromDocuments(
    docs: Document[],
    embeddings: any
  ): Promise<SimpleVectorStore> {
    const store = new SimpleVectorStore(embeddings);
    await store.addDocuments(docs);
    return store;
  }

  /**
   * Add texts to the vector store
   */
  async addTexts(
    texts: string[],
    metadatas: Record<string, any>[] | Record<string, any>
  ): Promise<void> {
    // Generate embeddings for all texts
    const vectors = await this.embeddings.embedDocuments(texts);

    // Store documents with embeddings
    for (let i = 0; i < texts.length; i++) {
      const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
      this.documents.push({
        content: texts[i],
        embedding: vectors[i],
        metadata: metadata || {},
      });
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(docs: Document[]): Promise<void> {
    const texts = docs.map((doc) => doc.pageContent);
    const metadatas = docs.map((doc) => doc.metadata);
    await this.addTexts(texts, metadatas);
  }

  /**
   * Perform similarity search
   */
  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Calculate similarities
    const similarities = this.documents.map((doc, index) => ({
      index,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      doc,
    }));

    // Sort by similarity (descending) and take top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topK = similarities.slice(0, k);

    // Convert to Document format
    return topK.map(
      (item) =>
        new Document({
          pageContent: item.doc.content,
          metadata: item.doc.metadata,
        })
    );
  }

  /**
   * Perform similarity search with scores
   */
  async similaritySearchWithScore(
    query: string,
    k: number = 4
  ): Promise<[Document, number][]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Calculate similarities
    const similarities = this.documents.map((doc, index) => ({
      index,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
      doc,
    }));

    // Sort by similarity (descending) and take top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topK = similarities.slice(0, k);

    // Convert to [Document, score] format
    return topK.map((item) => [
      new Document({
        pageContent: item.doc.content,
        metadata: item.doc.metadata,
      }),
      item.similarity,
    ]);
  }
}
