import { useAtom } from "jotai";
import { Link, useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { renderMarkdown } from "../markdown";
import { filesAtom } from "../atoms/globals";

function Frontmatter({ data }: { data: Record<string, unknown> | null }) {
  const keys = Object.entries(data ?? {});

  if (keys.length === 0) {
    return null;
  }

  return (
    <table>
      {keys.map(([key, value]) => (
        <tr key={key}>
          <td className="p-1">
            <pre>{key}</pre>
          </td>
          <td className="p-1">
            <pre>{typeof value === "string" ? value : JSON.stringify(value)}</pre>
          </td>
        </tr>
      ))}
    </table>
  );
}

async function Note({ path }: { path: string }) {
  const [files] = useAtom(filesAtom);
  const file = files[path];

  if (file.type !== "text") {
    return null;
  }

  const md = await renderMarkdown(file.content);
  return (
    <>
      <Frontmatter data={md.frontmatter} />
      <div className="prose" dangerouslySetInnerHTML={{ __html: md.html }} />
    </>
  );
}

export function NotePage() {
  const { _splat } = useParams({ strict: false });
  const path = "/" + (_splat ?? "");

  return (
    <>
      <Link to="/">Frontpage</Link>
      <Suspense fallback={"Loading..."}>
        <Note path={path} />
      </Suspense>
    </>
  );
}
