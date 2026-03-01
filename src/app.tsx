import { useAtom } from "jotai";
import { Outlet, useNavigate } from "@tanstack/react-router";
import {
  AppState,
  appStateAtom,
  AuthState,
  authErrorAtom,
  authStateAtom,
  dispatch,
  Event,
  reposAtom,
  selectedRepoAtom,
  userAtom,
} from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";
import { RepoSelector } from "./components/RepoSelector";

export function App() {
  const [user] = useAtom(userAtom);
  const [appState] = useAtom(appStateAtom);
  const [authState] = useAtom(authStateAtom);
  const [repos] = useAtom(reposAtom);
  const [selectedRepo, setSelectedRepo] = useAtom(selectedRepoAtom);
  const [authError, setAuthError] = useAtom(authErrorAtom);
  const navigate = useNavigate();

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

              {authError && (
                <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-red-800 font-medium">Login failed</p>
                  <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{authError}</pre>
                  <button
                    className="mt-3 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
                    onClick={() => setAuthError(null)}
                  >
                    Try again
                  </button>
                </div>
              )}

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
                    <button
                      onClick={async () => {
                        await dispatch(Event.Logout);
                        navigate({ to: "/" });
                      }}
                    >
                      Log out
                    </button>
                  </p>
                </div>
              ) : (
                <GitHubAuthButton />
              )}
            </div>

            {needsRepoSelection ? <RepoSelector /> : <Outlet />}
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
