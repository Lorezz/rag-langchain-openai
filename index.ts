import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
const vectorStore = new MemoryVectorStore(embeddings);

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/",
  {
    selector: pTagSelector,
  }
);

const docs = await cheerioLoader.load();

console.assert(docs.length === 1);
console.log(`Total characters: ${docs[0].pageContent.length}`);

const allSplits = await splitter.splitDocuments(docs);
console.log(`Split blog post into ${allSplits.length} sub-documents.`);

await vectorStore.addDocuments(allSplits);

const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

// `
// You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
// Question: (question goes here)
// Context: (context goes here)
// Answer:
// `;

//CUSTOM PROMPT TEMPLATE
// const template = `Use the following pieces of context to answer the question at the end.
// If you don't know the answer, just say that you don't know, don't try to make up an answer.
// Use three sentences maximum and keep the answer as concise as possible.
// Always say "thanks for asking!" at the end of the answer.

// {context}

// Question: {question}

// Helpful Answer:`;

// const promptTemplateCustom = ChatPromptTemplate.fromMessages([
//   ["user", template],
// ]);

// Example:
const example_prompt = await promptTemplate.invoke({
  context: "(context goes here)",
  question: "(question goes here)",
});
const example_messages = example_prompt.messages;

console.assert(example_messages.length === 1);
example_messages[0].content;

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

const retrieve = async (state: typeof InputStateAnnotation.State) => {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const docsContent = state.context.map((doc) => doc.pageContent).join("\n");
  const messages = await promptTemplate.invoke({
    question: state.question,
    context: docsContent,
  });
  const response = await llm.invoke(messages);
  return { answer: response.content };
};

/*
let question = "...";

const retrievedDocs = await vectorStore.similaritySearch(question);
const docsContent = retrievedDocs.map((doc) => doc.pageContent).join("\n");
const messages = await promptTemplate.invoke({
  question: question,
  context: docsContent,
});
const answer = await llm.invoke(messages);
 */
const graph = new StateGraph(StateAnnotation)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge("__start__", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "__end__")
  .compile();

//CALL
let inputs = { question: "What is Task Decomposition?" };

const result = await graph.invoke(inputs);
console.log(result.context.slice(0, 2));
console.log(`\nAnswer: ${result["answer"]}`);

// STREAM
// console.log(inputs);
// console.log("\n====\n");
// for await (const chunk of await graph.stream(inputs, {
//   streamMode: "updates",
// })) {
//   console.log(chunk);
//   console.log("\n====\n");
// }
// STREAM TOKENS

// const stream = await graph.stream(inputs, { streamMode: "messages" });
// for await (const [message, _metadata] of stream) {
//   process.stdout.write(message.content + "|");
// }
