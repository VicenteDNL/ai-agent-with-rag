import {
  PGVectorStore,
  DistanceStrategy,
} from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PoolConfig } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { Document } from "@langchain/core/documents";
import { EmbeddingsInterface } from "@langchain/core/embeddings";

export class VectorStoreManager {
  private vectorStore?: PGVectorStore;
  private embeddings: EmbeddingsInterface;
  private config = {
    postgresConnectionOptions: {
      type: "postgres",
      host: "vector-db",
      port: 5432,
      user: "myuse",
      password: "root",
      database: "api",
    } as PoolConfig,
    tableName: "testlangchainjs",
    columns: {
      idColumnName: "id",
      vectorColumnName: "vector",
      contentColumnName: "content",
      metadataColumnName: "metadata",
    },
    // supported distance strategies: cosine (default), innerProduct, or euclidean
    distanceStrategy: "cosine" as DistanceStrategy,
  };

  constructor(embeddings: EmbeddingsInterface) {
    this.embeddings = embeddings;
  }
  async instance() {
    if (this.vectorStore == undefined) {
      return (this.vectorStore = await PGVectorStore.initialize(
        this.embeddings,
        this.config
      ));
    }
    return this.vectorStore;
  }

  public async addDocuments() {
    const document1: Document = {
      pageContent: "The powerhouse of the cell is the mitochondria",
      metadata: { source: "https://example.com" },
    };

    const document2: Document = {
      pageContent: "Buildings are made out of brick",
      metadata: { source: "https://example.com" },
    };

    const document3: Document = {
      pageContent: "Mitochondria are made out of lipids",
      metadata: { source: "https://example.com" },
    };

    const document4: Document = {
      pageContent: "The 2024 Olympics are in Paris",
      metadata: { source: "https://example.com" },
    };

    const documents = [document1, document2, document3, document4];

    const ids = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];

    await this.vectorStore!.addDocuments(documents, { ids: ids });
  }
}
