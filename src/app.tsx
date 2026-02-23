import { useAtom } from "jotai";
import { renderMarkdown } from "./markdown";
import { machineStateAtom, send, type AppMachineState, type Files } from "./atoms/globals";
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

async function Note({ path, files }: { path: string; files: Files }) {
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

function Header({
  user,
  repo,
  onSwitchRepo,
}: {
  user: { username: string };
  repo?: { owner: string; repo: string };
  onSwitchRepo?: () => void;
}) {
  return (
    <div className="text-center">
      <h1 className="text-3xl">soten</h1>
      <h2>Notes written with markdown, backed by git.</h2>
      <div className="my-4">
        <p>Welcome, {user.username}!</p>
        {repo && (
          <p className="text-sm">
            {repo.owner}/{repo.repo}{" "}
            {onSwitchRepo && (
              <button className="underline" onClick={onSwitchRepo}>
                switch
              </button>
            )}
          </p>
        )}
        <p>
          <button onClick={() => send({ type: "LOGOUT" })}>Log out</button>
        </p>
      </div>
    </div>
  );
}

function ReadyView({ state }: { state: Extract<AppMachineState, { name: "ready" }> }) {
  if (state.view.name === "note") {
    return (
      <>
        <a href="#/">Frontpage</a>
        <Suspense fallback={"Loading..."}>
          <Note path={state.view.path} files={state.files} />
        </Suspense>
      </>
    );
  }

  return (
    <ul className="font-mono">
      {state.filenames.map((file) => (
        <li key={file}>
          <a href={"#" + file}>{file}</a>
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const [state] = useAtom(machineStateAtom);

  switch (state.name) {
    case "initializing":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <div>Initializing...</div>
          </div>
        </div>
      );

    case "unauthenticated":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <div className="text-center">
              <h1 className="text-3xl">soten</h1>
              <h2>Notes written with markdown, backed by git.</h2>
              {state.authError && (
                <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-red-800 font-medium">Login failed</p>
                  <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                    {state.authError}
                  </pre>
                </div>
              )}
              <GitHubAuthButton />
            </div>
          </div>
        </div>
      );

    case "fetchingRepos":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <p>Loading repositories...</p>
          </div>
        </div>
      );

    case "selectingRepo":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <RepoSelector repos={state.repos} />
          </div>
        </div>
      );

    case "loadingRepo":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} repo={state.repo} />
            <p>
              Loading {state.repo.owner}/{state.repo.repo}...
            </p>
          </div>
        </div>
      );

    case "ready":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header
              user={state.user}
              repo={state.repo}
              onSwitchRepo={() => send({ type: "SWITCH_REPO" })}
            />
            <ReadyView state={state} />
          </div>
        </div>
      );

    case "error":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-red-800 font-medium">Error</p>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{state.message}</pre>
            </div>
          </div>
        </div>
      );
  }
}
