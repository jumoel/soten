import { useEffect, useRef, useState } from "react";
import * as app from "./lib/app";
import { readRepoDir } from "./lib/fs";

export function App() {
  const isFetchingData = useRef(false);

  const [init, setInit] = useState(false);
  const [repoFiles, setRepoFiles] = useState<string[]>([]);
  const [user, setUser] = useState<{ username: string; token: string } | null>(null);
  const [repoName, setRepoName] = useState<string | null>(null);

  useEffect(() => {
    // Check for GitHub authentication response in URL hash
    const handleAuthResponse = () => {
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get("access_token");
        const username = params.get("username");

        if (token && username) {
          setUser({ username, token });
          // Clear the URL hash after extracting the data
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };

    handleAuthResponse();

    if (isFetchingData.current) {
      return;
    }

    if (!user) {
      return;
    }
    if (!repoName) {
      return;
    }

    (async () => {
      isFetchingData.current = true;

      await app.init(repoName, user);

      setInit(true);

      isFetchingData.current = false;
    })();
  }, [user, repoName]);

  useEffect(() => {
    if (init) {
      readRepoDir().then(setRepoFiles);
    }
  }, [init]);

  const handleGitHubLogin = () => {
    // GitHub OAuth parameters

    const clientId = import.meta.env.VITE_GH_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/gh-auth/callback`;
    // Redirect to GitHub OAuth authorization page directly
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  useEffect(() => {
    if (user) {
      // call the GH API to fetch list of repos that the user has given permission to

      const fetchRepos = async () => {
        // Define TypeScript interfaces for GitHub API responses
        interface Installation {
          id: number;
          app_id: number;
          target_id: number;
          target_type: string;
        }

        interface InstallationsResponse {
          total_count: number;
          installations: Installation[];
        }

        interface Repository {
          id: number;
          name: string;
          full_name: string;
          html_url: string;
          private: boolean;
          // Add other properties as needed
        }

        interface RepositoriesResponse {
          total_count: number;
          repositories: Repository[];
        }

        // Use the installations endpoint to get only repositories the app has been granted access to
        const response = await fetch("https://api.github.com/user/installations", {
          headers: {
            Authorization: `token ${user.token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          // Use type assertion for the response
          const installations = (await response.json()) as InstallationsResponse;
          const accessibleRepos: Repository[] = [];

          // For each installation, fetch the repositories it has access to
          for (const installation of installations.installations) {
            const reposResponse = await fetch(
              `https://api.github.com/user/installations/${installation.id}/repositories`,
              {
                headers: {
                  Authorization: `token ${user.token}`,
                  Accept: "application/vnd.github.v3+json",
                },
              },
            );

            if (reposResponse.ok) {
              // Use type assertion for the repos response
              const reposData = (await reposResponse.json()) as RepositoriesResponse;
              accessibleRepos.push(...reposData.repositories);
            } else {
              console.error("Failed to fetch repositories for installation:", reposResponse.statusText);
            }
          }

          const repoNames = accessibleRepos.map((repo) => repo.full_name);

          if (repoNames.length > 0) {
            const firstRepo = repoNames[0];
            setRepoName(firstRepo);
          }
        } else {
          console.error("Failed to fetch installations:", response.statusText);
        }
      };

      fetchRepos();
    }
  }, [user]);

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto text-center">
        <h1 className="text-3xl">soten</h1>
        <h2>Notes written with markdown, backed by git.</h2>

        {user ? (
          <div className="my-4">
            <p>Welcome, {user.username}!</p>
          </div>
        ) : (
          <div className="my-4">
            <button
              className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center m-auto"
              onClick={handleGitHubLogin}
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Login with GitHub
            </button>
          </div>
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
