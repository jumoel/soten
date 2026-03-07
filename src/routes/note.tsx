import { useAtom } from "jotai";
import { useParams } from "@tanstack/react-router";
import { Suspense } from "react";
import { renderedNoteAtom } from "../atoms/globals";
import { REPO_DIR } from "../lib/constants";
import { t } from "../i18n";
import { BackLink } from "../components/BackLink";
import { DelayedFallback } from "../components/ds/DelayedFallback";
import { FrontmatterTable } from "../components/FrontmatterTable";
import { ProseContent } from "../components/ProseContent";

function Note({ path }: { path: string }) {
  const [rendered] = useAtom(renderedNoteAtom(path));
  if (!rendered) return null;

  return (
    <>
      <FrontmatterTable data={rendered.frontmatter} />
      <ProseContent html={rendered.html} />
    </>
  );
}

export function NotePage() {
  const { _splat } = useParams({ strict: false });
  const path = REPO_DIR + "/" + (_splat ?? "");

  return (
    <>
      <BackLink to="/">{t("nav.back")}</BackLink>
      <Suspense fallback={<DelayedFallback>{t("note.loading")}</DelayedFallback>}>
        <Note path={path} />
      </Suspense>
    </>
  );
}
