import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
// const { convert } = require("html-to-text");

export default async function getDocsFromFolder(folderPath: string) {
  const docs: Document[] = [];
  try {
    const dir = await fs.opendir(folderPath);
    for await (const entry of dir) {
      console.log(entry.name);
      const ext = entry.name.split(".").pop();
      if (["md", "txt", "html"].includes(ext)) {
        const content = await fs.readFile(
          `${folderPath}/${entry.name}`,
          "utf-8"
        );
        const metadata = { title: entry.name };
        let pageContent = content;
        if (ext === "html") {
          pageContent = "";
          // const options = {
          //   wordwrap: 130,
          // };
          // pageContent = convert(content, options);
        }
        docs.push(
          new Document({
            pageContent,
            metadata,
          })
        );
      }
    }
  } catch (err) {
    console.error(err);
  }
  return docs;
}
