import { HTMLWebBaseLoader } from "@langchain/community/document_loaders/web/html";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";

const defaultUrl = "https://lilianweng.github.io/posts/2023-06-23-agent/";

export async function getTextFromHtml(url = defaultUrl) {
  const loader = new HTMLWebBaseLoader(url);

  const docs = await loader.load();

  console.log(docs);

  const splitter = RecursiveCharacterTextSplitter.fromLanguage("html");
  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const newDocuments = await sequence.invoke(docs);

  console.log(newDocuments);
  const allSplits = await splitter.splitDocuments(newDocuments);
  console.log(`Split blog post into ${allSplits.length} sub-documents.`);

  return allSplits;
}
