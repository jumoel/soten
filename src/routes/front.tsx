import { useAtom } from "jotai";
import { Link } from "@tanstack/react-router";
import { repoFilenamesAtom } from "../atoms/globals";
import { REPO_DIR } from "../lib/git";

export function FrontPage() {
  const [repoFiles] = useAtom(repoFilenamesAtom);
  const prefix = REPO_DIR + "/";

  return (
    <ul className="font-mono">
      {repoFiles.map((file) => {
        const relativePath = file.startsWith(prefix) ? file.slice(prefix.length) : file;
        return (
          <li key={file}>
            <Link to={"/note/" + relativePath}>{relativePath}</Link>
          </li>
        );
      })}
    </ul>
  );
}
