import { useAtom } from "jotai";
import { Link } from "@tanstack/react-router";
import { repoFilenamesAtom } from "../atoms/globals";

export function FrontPage() {
  const [repoFiles] = useAtom(repoFilenamesAtom);

  return (
    <ul className="font-mono">
      {repoFiles.map((file) => (
        <li key={file}>
          <Link to={file}>{file}</Link>
        </li>
      ))}
    </ul>
  );
}
