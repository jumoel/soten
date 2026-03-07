import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { useParams } from "@tanstack/react-router";
import { renderedNoteAtom } from "../atoms/globals";
import { REPO_DIR } from "../lib/constants";
import { t } from "../i18n";
import { BackLink } from "../components/BackLink";
import { FrontmatterTable } from "../components/FrontmatterTable";
import { ProseContent } from "../components/ProseContent";

function Note({ path }: { path: string }) {
  const loadableAtom = useMemo(() => loadable(renderedNoteAtom(path)), [path]);
  const [result] = useAtom(loadableAtom);
  if (result.state !== "hasData" || !result.data) return null;

  return (
    <>
      <FrontmatterTable data={result.data.frontmatter} />
      <ProseContent html={result.data.html} />
    </>
  );
}

export function NotePage() {
  const { _splat } = useParams({ strict: false });
  const path = REPO_DIR + "/" + (_splat ?? "");

  return (
    <>
      <BackLink to="/">{t("nav.back")}</BackLink>
      <Note path={path} />
    </>
  );
}
