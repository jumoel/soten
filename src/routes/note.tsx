import { useAtom } from "jotai";
import { useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { renderedNoteAtom } from "../atoms/globals";
import { REPO_DIR } from "../lib/git";
import { t } from "../i18n";
import { BackLink } from "../components/BackLink";
import { FrontmatterTable } from "../components/FrontmatterTable";

function Note({ path }: { path: string }) {
  const [rendered] = useAtom(renderedNoteAtom(path));
  if (!rendered) return null;

  return (
    <>
      <FrontmatterTable data={rendered.frontmatter} />
      <div
        className="prose prose-sm prose-gray"
        dangerouslySetInnerHTML={{ __html: rendered.html }}
      />
    </>
  );
}

export function NotePage() {
  const { _splat } = useParams({ strict: false });
  const path = REPO_DIR + "/" + (_splat ?? "");

  return (
    <>
      <BackLink to="/">{t("nav.back")}</BackLink>
      <Suspense fallback={t("note.loading")}>
        <Note path={path} />
      </Suspense>
    </>
  );
}
