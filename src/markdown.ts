import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { unified, type Plugin } from "unified";
import { matter } from "vfile-matter";
import type { Nodes, Root } from "mdast";

const remarkFrontmatterMatter: Plugin<[], Root> = function () {
  return function transformer(_tree, file) {
    matter(file);

    if (file.data.matter) {
      file.data.frontmatter = file.data.matter;
      delete file.data.matter;
    }
  };
};

let processorPromise: ReturnType<typeof buildProcessor> | null = null;

async function buildProcessor() {
  const [
    { default: remarkGfm },
    { default: remarkRehype },
    { default: rehypeRaw },
    { default: rehypeStringify },
  ] = await Promise.all([
    import("remark-gfm"),
    import("remark-rehype"),
    import("rehype-raw"),
    import("rehype-stringify"),
  ]);

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkFrontmatterMatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);
}

const titleParser = unified().use(remarkParse).use(remarkFrontmatter);

function collectText(node: Nodes): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map(collectText).join("");
  return "";
}

function stripWikilinks(text: string): string {
  return text.replace(/\[\[([^\]]+)\]\]/g, "$1");
}

export function extractTitle(markdown: string): string | null {
  const tree = titleParser.parse(markdown);
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) {
      const raw = collectText(node);
      return raw ? stripWikilinks(raw) : null;
    }
  }
  return null;
}

export async function renderMarkdown(markdown: string): Promise<{
  frontmatter: Record<string, unknown> | null;
  html: string;
}> {
  const processor = await (processorPromise ??= buildProcessor());
  const vfile = await processor.process(markdown);

  const frontmatter = vfile.data?.frontmatter ?? null;

  return { frontmatter, html: vfile.toString() };
}
