import { useAtom } from "jotai";
import { AuthState, authStateAtom, repoFilesAtom, userAtom } from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";

export function App() {
  const [user] = useAtom(userAtom);
  const [authState] = useAtom(authStateAtom);
  const [repoFiles] = useAtom(repoFilesAtom);

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto text-center">
        <h1 className="text-3xl">soten</h1>
        <h2>Notes written with markdown, backed by git.</h2>

        {authState === AuthState.Authenticated && user ? (
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
