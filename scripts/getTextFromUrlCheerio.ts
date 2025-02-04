import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import type { SelectorType } from "cheerio";

const defaultUrl = "https://lilianweng.github.io/posts/2023-06-23-agent/";

export async function getTextFRomUrl(
  url = defaultUrl,
  tagSelector: SelectorType
) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const cheerioLoader = new CheerioWebBaseLoader(url, {
    selector: tagSelector,
  });
  const docs = await cheerioLoader.load();
  console.assert(docs.length === 1);
  console.log(`Total characters: ${docs[0].pageContent.length}`);
  console.log(docs);

  const allSplits = await splitter.splitDocuments(docs);
  console.log(`Split blog post into ${allSplits.length} sub-documents.`);

  return allSplits;
}
