import type { Plugin } from "unified";
import type { Root } from "mdast";

let processorPromise: ReturnType<typeof buildProcessor> | null = null;

function getProcessor() {
  if (!processorPromise) {
    processorPromise = buildProcessor().catch((err) => {
      processorPromise = null;
      throw err;
    });
  }
  return processorPromise;
}

async function buildProcessor() {
  const [
    { unified },
    { matter },
    { default: remarkParse },
    { default: remarkFrontmatter },
    { default: remarkGfm },
    { default: remarkRehype },
    { default: rehypeRaw },
    { default: rehypeStringify },
  ] = await Promise.all([
    import("unified"),
    import("vfile-matter"),
    import("remark-parse"),
    import("remark-frontmatter"),
    import("remark-gfm"),
    import("remark-rehype"),
    import("rehype-raw"),
    import("rehype-stringify"),
  ]);

  const remarkFrontmatterMatter: Plugin<[], Root> = function () {
    return function transformer(_tree, file) {
      matter(file);

      if (file.data.matter) {
        file.data.frontmatter = file.data.matter;
        delete file.data.matter;
      }
    };
  };

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkFrontmatterMatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify);
}

export function warmProcessor() {
  getProcessor();
}

export async function renderMarkdown(markdown: string): Promise<{
  frontmatter: Record<string, unknown> | null;
  html: string;
}> {
  const processor = await getProcessor();
  const vfile = await processor.process(markdown);

  const frontmatter = vfile.data?.frontmatter ?? null;

  return { frontmatter, html: vfile.toString() };
}
