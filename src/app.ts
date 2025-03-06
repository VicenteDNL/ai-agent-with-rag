import "dotenv/config";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ModelManager } from "./modelManager";
import { EmbeddingsManager } from "./embeddingsManager";
import { VectorStoreManager } from "./vectorStoreManager";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";

class App {
  protected modelManager: ModelManager;
  protected vectorStore: Promise<PGVectorStore>;

  constructor() {
    this.modelManager = new ModelManager();

    const embeddings = new EmbeddingsManager().instance();

    this.vectorStore = new VectorStoreManager(embeddings).instance();
  }
  async docs() {
    // Load and chunk contents of blog
    const pTagSelector = "p";
    const cheerioLoader = new CheerioWebBaseLoader(
      "https://lilianweng.github.io/posts/2023-06-23-agent/",
      {
        selector: pTagSelector,
      }
    );
    return cheerioLoader.load();
  }

  spliter() {
    return new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  async execute() {
    const vector = await this.vectorStore;
    const filter = { source: "https://example.com" };

    const similaritySearchResults = await vector.similaritySearch(
      "biology",
      2,
      filter
    );

    for (const doc of similaritySearchResults) {
      console.log(
        `* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`
      );
    }
    return;
    const splitter = this.spliter();

    const docs = await this.docs();

    const allSplits = await splitter.splitDocuments(docs);

    // Index chunks
    vector.addDocuments(allSplits);

    // Define prompt for question-answering
    const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

    // Define state for application
    const InputStateAnnotation = Annotation.Root({
      question: Annotation<string>,
    });

    const StateAnnotation = Annotation.Root({
      question: Annotation<string>,
      context: Annotation<Document[]>,
      answer: Annotation<string>,
    });

    // Define application steps
    const retrieve = async (state: typeof InputStateAnnotation.State) => {
      const retrievedDocs = await vector.similaritySearch(state.question);
      return { context: retrievedDocs };
    };

    const generate = async (state: typeof StateAnnotation.State) => {
      const docsContent = state.context
        .map((doc) => doc.pageContent)
        .join("\n");
      const messages = await promptTemplate.invoke({
        question: state.question,
        context: docsContent,
      });
      const response = await this.modelManager.invoke(messages);
      return { answer: response.content };
    };

    // Compile application and test
    return new StateGraph(StateAnnotation)
      .addNode("retrieve", retrieve)
      .addNode("generate", generate)
      .addEdge("__start__", "retrieve")
      .addEdge("retrieve", "generate")
      .addEdge("generate", "__end__")
      .compile();
  }
}

var pipeline = new App();

const graph = pipeline.execute();
// let inputs = { question: "What is Task Decomposition?" };

// graph.then((graph) => {
//   graph.invoke(inputs).then((result) => {
//     console.log(result.answer);
//   });
// });
