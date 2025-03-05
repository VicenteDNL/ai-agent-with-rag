import { VertexAIEmbeddings } from "@langchain/google-vertexai";
import { OpenAIEmbeddings } from "@langchain/openai";

export class EmbeddingsManager {
  private embeddings?: OpenAIEmbeddings | VertexAIEmbeddings;
  constructor() {
    this.validate();
    this.init();
  }

  private validate() {
    if (process.env.EMBEDDINGS == undefined) {
      throw new Error("EMBEDDINGS  has not beeb defined");
    }
  }

  private init() {
    switch (process.env.CLIENT_AI) {
      case "OPENAI":
        return (this.embeddings = new OpenAIEmbeddings({
          model: process.env.EMBEDDINGS!,
        }));
      case "GOOGLE_VERTEXAI":
        return (this.embeddings = new VertexAIEmbeddings({
          model: process.env.EMBEDDINGS!,
        }));
      default:
        throw new Error("CLIENT_AI not configured (embeddings)");
    }
  }

  instance() {
    if (this.embeddings == null) {
      throw new Error("Embeddings is not initialized");
    }
    return this.embeddings!;
  }
}
