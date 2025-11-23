import { useAtom } from "jotai";
import {
  AppState,
  appStateAtom,
  AuthState,
  authStateAtom,
  dispatch,
  Event,
  repoFilesAtom,
  userAtom,
} from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";

export function App() {
  const [user] = useAtom(userAtom);
  const [appState] = useAtom(appStateAtom);
  const [authState] = useAtom(authStateAtom);
  const [repoFiles] = useAtom(repoFilesAtom);

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

            <ul className="font-mono">
              {repoFiles.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
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
