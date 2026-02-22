import { useAtom } from "jotai";
import { renderMarkdown } from "./markdown";
import {
  AppState,
  appStateAtom,
  AppView,
  appViewAtom,
  AuthState,
  authStateAtom,
  currentPathAtom,
  dispatch,
  Event,
  filesAtom,
  repoFilenamesAtom,
  reposAtom,
  selectedRepoAtom,
  userAtom,
} from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";
import { RepoSelector } from "./components/RepoSelector";
import { Suspense } from "react";

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

export function App() {
  const [user] = useAtom(userAtom);
  const [appState] = useAtom(appStateAtom);
  const [authState] = useAtom(authStateAtom);
  const [repoFiles] = useAtom(repoFilenamesAtom);
  const [appView] = useAtom(appViewAtom);
  const [currentPath] = useAtom(currentPathAtom);
  const [repos] = useAtom(reposAtom);
  const [selectedRepo, setSelectedRepo] = useAtom(selectedRepoAtom);

  const needsRepoSelection =
    authState === AuthState.Authenticated && repos.length > 0 && !selectedRepo;

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto">
        {appState == AppState.Initialized ? (
          <>
            <div className="text-center">
              <h1 className="text-3xl">soten</h1>
              <h2>Notes written with markdown, backed by git.</h2>

              {authState === AuthState.Authenticated && user ? (
                <div className="my-4">
                  <p>Welcome, {user.username}!</p>
                  {selectedRepo && (
                    <p className="text-sm">
                      {selectedRepo.owner}/{selectedRepo.repo}{" "}
                      <button className="underline" onClick={() => setSelectedRepo(null)}>
                        switch
                      </button>
                    </p>
                  )}
                  <p>
                    <button onClick={() => dispatch(Event.Logout)}>Log out</button>
                  </p>
                </div>
              ) : (
                <GitHubAuthButton />
              )}
            </div>

            {needsRepoSelection && <RepoSelector />}

            {!needsRepoSelection && appView === AppView.Front && (
              <ul className="font-mono">
                {repoFiles.map((file) => (
                  <li key={file}>
                    <a href={"#" + file}>{file}</a>
                  </li>
                ))}
              </ul>
            )}

            {!needsRepoSelection && appView === AppView.Note && (
              <>
                <a href="#/">Frontpage</a>
                <Suspense fallback={"Loading..."}>
                  <Note path={currentPath} />
                </Suspense>
              </>
            )}
          </>
        ) : (
          <>
            <div>Initializing...</div>
          </>
        )}
      </div>
    </div>
  );
}
