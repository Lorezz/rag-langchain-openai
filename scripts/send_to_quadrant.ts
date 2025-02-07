import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import getDocsFromFolder from "./getDocsFromFolder";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
let vectorStore;

export async function generateSplits() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await getDocsFromFolder("./scripts/data");
  console.log(docs.length, "documents loaded.");

  const allSplits = await splitter.splitDocuments(docs);
  console.log(`Split blog post into ${allSplits.length} sub-documents.`);

  return allSplits;
}

function getVectorStore() {
  return QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: process.env.QDRANT_COLLECTION,
    apiKey: process.env.QDRANT_API_KEY,
  });
}

async function generateEmbeddings() {
  const allSplits = await generateSplits();

  console.log("Adding embeddings to Qdrant...");

  await vectorStore!.addDocuments(allSplits);
}

(async () => {
  const start = Date.now();
  console.log("Starting...");
  vectorStore = await getVectorStore();
  await generateEmbeddings();
  const elapsed = Date.now() - start;
  console.log("Finish after ...", elapsed / 1000, "seconds");
})();
