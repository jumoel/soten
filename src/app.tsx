import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import * as app from "./lib/app";
import { readRepoDir } from "./lib/fs";
import {
  AuthState,
  authStateAtom,
  RepoState,
  repoStateAtom,
  selectedRepoAtom,
  userAtom,
} from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";

export function App() {
  const isFetchingData = useRef(false);

  const [init, setInit] = useState(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [user] = useAtom(userAtom);
  const [authState] = useAtom(authStateAtom);
  const [repoState] = useAtom(repoStateAtom);
  const [selectedRepo] = useAtom(selectedRepoAtom);

  useEffect(() => {
    if (isFetchingData.current) {
      return;
    }

    if (authState !== AuthState.Authenticated) {
      return;
    }
    if (repoState === RepoState.Unselected || !selectedRepo) {
      return;
    }

    (async () => {
      isFetchingData.current = true;

      await app.init(`${selectedRepo.owner}/${selectedRepo.repo}`, user);

      setInit(true);

      isFetchingData.current = false;
    })();
  }, [user, selectedRepo]);

  useEffect(() => {
    if (init) {
      readRepoDir().then(setRepoFiles);
    }
  }, [init]);

  const handleGitHubLogin = () => {
    // GitHub OAuth parameters
  };

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto text-center">
        <h1 className="text-3xl">soten</h1>
        <h2>Notes written with markdown, backed by git.</h2>

        {authState === AuthState.Authenticated ? (
          <div className="my-4">
            <p>Welcome, {user.username}!</p>
          </div>
        ) : (
          <GitHubAuthButton />
        )}

        <ul className="font-mono">
          {repoFiles.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
