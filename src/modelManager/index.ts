import { ChatVertexAI } from "@langchain/google-vertexai";
import { ChatOpenAI } from "@langchain/openai";

export class ModelManager {
  private llm?: ChatOpenAI | ChatVertexAI;

  constructor() {
    this.validate();
    this.init();
  }

  private validate() {
    if (process.env.MODEL_LLM == undefined) {
      throw new Error("MODEL_LLM  has not beeb defined");
    }
    if (process.env.TEMPERATURE == undefined) {
      throw new Error("TEMPERATURE  has not beeb defined");
    }
    if (!/^(100|[1-9]?[0-9])$/.test(process.env.TEMPERATURE)) {
      throw new Error("TEMPERATURE  is not a value between 0 and 100");
    }
  }

  private init() {
    switch (process.env.CLIENT_AI) {
      case "OPENAI":
        return (this.llm = new ChatOpenAI({
          model: process.env.MODEL_LLM,
          temperature: parseInt(process.env.TEMPERATURE!),
        }));
      case "GOOGLE_VERTEXAI":
        return (this.llm = new ChatVertexAI({
          model: process.env.MODEL_LLM,
          temperature: parseInt(process.env.TEMPERATURE!),
        }));
      default:
        throw new Error("CLIENT_AI not configured");
    }
  }

  invoke(params: any) {
    if (this.llm instanceof ChatOpenAI) {
      return this.llm.invoke(params);
    }
    if (this.llm instanceof ChatVertexAI) {
      return this.llm.invoke(params);
    }

    throw new Error("llm not initialized");
  }
}
