import type { Root } from "mdast";
import type { Options as SanitizeOptions } from "rehype-sanitize";
import type { Plugin } from "unified";

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
    { default: rehypeSanitize, defaultSchema },
    { default: rehypeStringify },
    { visit },
  ] = await Promise.all([
    import("unified"),
    import("vfile-matter"),
    import("remark-parse"),
    import("remark-frontmatter"),
    import("remark-gfm"),
    import("remark-rehype"),
    import("rehype-raw"),
    import("rehype-sanitize"),
    import("rehype-stringify"),
    import("unist-util-visit"),
  ]);

  const remarkFrontmatterMatter: Plugin<[], Root> = () =>
    function transformer(_tree, file) {
      matter(file);

      if (file.data.matter) {
        file.data.frontmatter = file.data.matter;
        delete file.data.matter;
      }
    };

  const remarkWikilinks: Plugin<[], Root> = () =>
    function transformer(tree) {
      visit(tree, "text", (node, index, parent) => {
        if (!parent || index == null) return;
        const n = node as { value: string };
        const re = /\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/g;
        const parts: unknown[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = re.exec(n.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: "text", value: n.value.slice(lastIndex, match.index) });
          }
          const label = match[2] ?? match[1];
          parts.push({ type: "html", value: `<span data-wikilink>${label}</span>` });
          lastIndex = re.lastIndex;
        }

        if (parts.length === 0) return;
        if (lastIndex < n.value.length) {
          parts.push({ type: "text", value: n.value.slice(lastIndex) });
        }
        (parent as { children: unknown[] }).children.splice(index, 1, ...parts);
      });
    };

  const remarkRemoveFrontmatter: Plugin<[], Root> = () =>
    function transformer(tree) {
      tree.children = tree.children.filter((node) => node.type !== "yaml");
    };

  const sanitizeSchema: SanitizeOptions = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      span: [...(defaultSchema.attributes?.span ?? []), "data-wikilink"],
    },
  };

  return unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm)
    .use(remarkWikilinks)
    .use(remarkFrontmatterMatter)
    .use(remarkRemoveFrontmatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema)
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
