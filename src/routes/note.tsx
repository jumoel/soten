import { useAtom } from "jotai";
import { Link, useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { renderedNoteAtom } from "../atoms/globals";
import { REPO_DIR } from "../lib/git";
import { t } from "../i18n";

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

function Note({ path }: { path: string }) {
  const [rendered] = useAtom(renderedNoteAtom(path));
  if (!rendered) return null;

  return (
    <>
      <Frontmatter data={rendered.frontmatter} />
      <div className="prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
    </>
  );
}

export function NotePage() {
  const { _splat } = useParams({ strict: false });
  const path = REPO_DIR + "/" + (_splat ?? "");

  return (
    <>
      <Link to="/">{t("note.frontpage")}</Link>
      <Suspense fallback={t("note.loading")}>
        <Note path={path} />
      </Suspense>
    </>
  );
}
