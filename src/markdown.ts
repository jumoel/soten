import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Plugin } from "unified";
import { matter } from "vfile-matter";
import type { Root } from "mdast";

const remarkFrontmatterMatter: Plugin<[], Root> = function () {
  return function transformer(_tree, file) {
    matter(file);

    if (file.data.matter) {
      file.data.frontmatter = file.data.matter;
      delete file.data.matter;
    }
  };
};

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkFrontmatterMatter)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<{
  frontmatter: Record<string, unknown> | null;
  html: string;
}> {
  const vfile = await processor.process(markdown);

  const frontmatter = vfile.data?.frontmatter ?? null;

  return { frontmatter, html: vfile.toString() };
}
