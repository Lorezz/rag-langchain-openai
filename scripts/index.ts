import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import getDocsFromFolder from "./scripts/getDocsFromFolder";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";

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
  console.log(docs.length, "DOCUMENTS LOADED.");
  const docIndex = getRandomInt(docs.length);
  console.log(docs[docIndex].pageContent.slice(1500, 2500));

  const allSplits = await splitter.splitDocuments(docs);
  console.log(`SPLIT BLOG POST INTO ${allSplits.length} SUB-DOCUMENTS.`);

  const index = getRandomInt(allSplits.length);
  console.log(allSplits[index].pageContent);

  return allSplits;
}

function getVectorStore() {
  return new MemoryVectorStore(embeddings);
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
  vectorStore = getVectorStore();
  await generateEmbeddings();
  promptTemplate = await getPromptTemplate();

  let question = "Quali sono gli obiettivi di Italia digitale 2026?";

  //query vector store
  const retrievedDocs = await vectorStore!.similaritySearch(question);
  const docsContent = retrievedDocs
    .map((doc: any) => doc.pageContent)
    .join("\n");

  console.log(" ");
  console.log("RETRIEVED DOCUMENTS: ");
  console.log("-------------------------------");
  console.log(docsContent);
  // ask the question to the model with the retrieved documents as context
  const messages = await promptTemplate.invoke({
    question: question,
    context: docsContent,
  });
  const result = await llm.invoke(messages);
  console.log(`=============================`);
  console.log(`ANSWER: `);
  console.log(`=============================`);
  console.log(`${result?.content}`);

  const elapsed = Date.now() - start;
  console.log("FINISH AFTER ...", elapsed / 1000, "SECONDS");
})();
