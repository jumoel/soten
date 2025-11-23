import { useAtom } from "jotai";
import {
  AppState,
  appStateAtom,
  AppView,
  appViewAtom,
  AuthState,
  authStateAtom,
  dispatch,
  Event,
  filesAtom,
  repoFilenamesAtom,
  userAtom,
} from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";

export function App() {
  const [user] = useAtom(userAtom);
  const [appState] = useAtom(appStateAtom);
  const [authState] = useAtom(authStateAtom);
  const [repoFiles] = useAtom(repoFilenamesAtom);
  const [appView] = useAtom(appViewAtom);
  const [files] = useAtom(filesAtom);
  console.log(files);

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto text-center">
        {appState == AppState.Initialized ? (
          <>
            <h1 className="text-3xl">soten</h1>
            <h2>Notes written with markdown, backed by git.</h2>

            {authState === AuthState.Authenticated && user ? (
              <div className="my-4">
                <p>Welcome, {user.username}!</p>
                <p>
                  <button onClick={() => dispatch(Event.Logout)}>Log out</button>
                </p>
              </div>
            ) : (
              <GitHubAuthButton />
            )}

            {appView === AppView.Front && (
              <ul className="font-mono">
                {repoFiles.map((file) => (
                  <li key={file}>
                    <a href={"#" + file}>{file}</a>
                  </li>
                ))}
              </ul>
            )}

            {appView === AppView.Note && (
              <>
                <a href="#/">Frontpage</a>
                <pre>{JSON.stringify(files[window.location.hash.slice(1)])}</pre>
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
