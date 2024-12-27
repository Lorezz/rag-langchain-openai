import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  Annotation,
} from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  trimMessages,
} from "@langchain/core/messages";

const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

// INVOKE with messages
// const messages = [
//   new SystemMessage("Translate the following from English into Italian"),
//   new HumanMessage("hi!"),
// ];
// const response = await llm.invoke(messages);
// console.log("=", response);

// INVOKE with template
/*
const systemTemplate = "Translate the following from English into {language}";
const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);
const promptValue = await promptTemplate.invoke({
  language: "italian",
  text: "hi dude!",
});
const response = await llm.invoke(promptValue);
console.log(`${response.content}`);
*/

//SRTEAM SAMPLE
/*
const stream = await llm.stream(messages);
const chunks = [];
for await (const chunk of stream) {
  chunks.push(chunk);
  console.log(`${chunk.content}|`);
}
*/

// GRPAPH PERSISTENCE
/* */
const promptTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant. Answer all questions to the best of your ability in {language}.",
  ],
  ["placeholder", "{messages}"],
]);

// Define the State
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  language: Annotation<string>(),
});

const trimmer = trimMessages({
  maxTokens: 4,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});
let counter = 0;
// Define the function that calls the model
const callModel = async (state: typeof GraphAnnotation.State) => {
  // const response = await llm.invoke(state.messages);

  let len = state.messages.length;
  if (len > 0) {
    const lastMessage = state.messages[len - 1];
    console.log(` `);
    console.log(`-- ${counter} --`);
    console.log(`${lastMessage.content}`);
  }

  const trimmedMessage = await trimmer.invoke(state.messages);
  const prompt = await promptTemplate.invoke({
    messages: trimmedMessage,
    language: state.language,
  });
  // const prompt = await promptTemplate.invoke(state);
  const response = await llm.invoke(prompt);
  console.log(`${response.content}`);
  counter++;

  return { messages: response };
};

// Define a new graph
const workflow = new StateGraph(GraphAnnotation) //MessagesAnnotation
  // Define the node and edge
  .addNode("model", callModel)
  .addEdge(START, "model")
  .addEdge("model", END);

// Add memory
const memory = new MemorySaver();
const app = workflow.compile({ checkpointer: memory });
const config = { configurable: { thread_id: uuidv4() } };

let inputs = [
  "Hi! I'm Lorezz.",
  "What's my name?",
  "What could be my hacker nickname? say only two of them",
  "Can you suggest another hacker nickname for me?",
  "I choose AddictedPoison.",
  "What's my nickname?",
  "What's my real name?",
];
for (const element of inputs) {
  await app.invoke(
    {
      messages: [
        {
          role: "user",
          content: element,
        },
      ],
      language: "english",
    },
    config
  );
}
