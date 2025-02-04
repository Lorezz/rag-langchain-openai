import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import getDocsFromFolder from "./scripts/getDocsFromFolder";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { QdrantVectorStore } from "@langchain/qdrant";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
let vectorStore;
let promptTemplate: ChatPromptTemplate;

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export async function generateSplits() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await getDocsFromFolder("./data");
  console.log(docs.length, "documents loaded.");
  const docIndex = getRandomInt(docs.length);
  console.log(docs[docIndex].pageContent.slice(1500, 2500));

  const allSplits = await splitter.splitDocuments(docs);
  console.log(`Split blog post into ${allSplits.length} sub-documents.`);

  const index = getRandomInt(allSplits.length);
  console.log(allSplits[index].pageContent);

  return allSplits;
}

function getVectorStore() {
  return QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: "test",
    apiKey: process.env.QDRANT_API_KEY,
  });
  // return new MemoryVectorStore(embeddings);
}

async function generateEmbeddings() {
  const allSplits = await generateSplits();
  await vectorStore!.addDocuments(allSplits);
}

async function getPromptTemplate() {
  const t = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  return t;
}

(async () => {
  const start = Date.now();
  console.log("Starting...");
  vectorStore = await getVectorStore();
  // await generateEmbeddings();
  promptTemplate = await getPromptTemplate();

  let question = "Riesce Arturo ad uccidere Clementina? e come?";
  // let question = "Chi è che vuole usare il veleno e quale è il suo scopo?";

  //query vector store
  const retrievedDocs = await vectorStore!.similaritySearch(question);
  const docsContent = retrievedDocs
    .map((doc: any) => doc.pageContent)
    .join("\n");

  console.log("Retrieved documents: ", docsContent);
  // ask the question to the model with the retrieved documents as context
  const messages = await promptTemplate.invoke({
    question: question,
    context: docsContent,
  });
  const result = await llm.invoke(messages);
  console.log(`\nAnswer: ${result?.content}`);

  const elapsed = Date.now() - start;
  console.log("Finish after ...", elapsed / 1000, "seconds");
})();
