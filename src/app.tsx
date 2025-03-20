import { useEffect, useRef, useState } from "react";
import * as app from "./lib/app";
import { readRepoDir } from "./lib/fs";

export function App() {
  const isFetchingData = useRef(false);

  const [init, setInit] = useState(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);

  useEffect(() => {
    if (isFetchingData.current) {
      return;
    }

    (async () => {
      isFetchingData.current = true;

      await app.init();

      setInit(true);

      isFetchingData.current = false;
    })();
  }, []);

  useEffect(() => {
    if (init) {
      readRepoDir().then(setRepoFiles);
    }
  }, [init]);

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto text-center">
        <h1 className="text-3xl">soten</h1>
        <h2>Notes written with markdown, backed by git.</h2>
        <ul className="font-mono">
          {repoFiles.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
