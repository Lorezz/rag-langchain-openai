import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
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

function getVectorStore() {
  return QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: process.env.QDRANT_COLLECTION,
    apiKey: process.env.QDRANT_API_KEY,
  });
}

async function getPromptTemplate() {
  const t = await pull<ChatPromptTemplate>("rlm/rag-prompt");
  return t;
}

export async function POST(request: Request) {
  const { message } = await request.json();

  vectorStore = await getVectorStore();
  promptTemplate = await getPromptTemplate();

  //query vector store
  const retrievedDocs = await vectorStore.similaritySearch(message);
  const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n");

  // ask the question to the model with the retrieved documents as context
  const messages = await promptTemplate.invoke({
    question: message,
    context: docsContent,
  });
  const result = await llm.invoke(messages);
  const reply = `${result?.content}`;

  // const reply = `Hai detto: "${message}"`;
  return Response.json({ reply });
}
