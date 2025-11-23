interface Repository {
  full_name: string;
}

interface RepositoriesResponse {
  repositories: Repository[];
}

interface UserResponse {
  login: string;
}

export async function fetchCurrentUser(token: string) {
  /*
  curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/user
  */

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!userResponse.ok) {
    if (userResponse.status === 401 || userResponse.status === 403) {
      return null;
    }

    throw new Error("Unexpected status code returned from user endpoint");
  }

  const userData = (await userResponse.json()) as UserResponse;

  return userData;
}

export async function fetchUserRepos(
  installationId: string,
  token: string,
): Promise<string[] | null> {
  const reposResponse = await fetch(
    `https://api.github.com/user/installations/${installationId}/repositories`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  if (reposResponse.ok) {
    const reposData = (await reposResponse.json()) as RepositoriesResponse;

    const repoNames = reposData.repositories.map((repo) => repo.full_name);

    if (repoNames.length > 0) {
      return repoNames;
    } else {
      console.warn("No repositories found for the installation.");
      return [];
    }
  } else {
    console.error("Failed to fetch repositories for installation:", reposResponse.statusText);
  }

  return null;
}

export function redirectToGitHubAuth() {
  const clientId = import.meta.env.VITE_GH_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/gh-auth/callback`;
  // Redirect to GitHub OAuth authorization page directly
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}
