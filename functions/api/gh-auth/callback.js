export async function onRequest(context) {
  const { request } = context;

  // Get the code from the URL query parameters
  const url = new URL(request.url);
  const baseUrl = context.env.BASE_URL || url.origin;

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  console.log("Received gh-auth request", request.method, request.url, { code, state });

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  try {
    const tokenData = await exchangeCode(code, context.env);

    console.log("Token data received");

    if (!tokenData || !tokenData.access_token) {
      return new Response("Failed to obtain access token", { status: 400 });
    }

    const appInstallId = await findAppInstallationId(tokenData.access_token);

    const hasAppInstalled = appInstallId !== null;

    if (!hasAppInstalled) {
      // Redirect to GitHub app installation page
      console.log("App not installed, redirecting to installation page");
      return new Response(null, {
        status: 302,
        headers: {
          Location: `https://github.com/apps/soten-notes/installations/new?state=app_installed&redirect_uri=${encodeURIComponent(`${baseUrl}/api/gh-auth/callback?code=${code}`)}`,
        },
      });
    }

    const userInfo = await fetchUserInfo(tokenData.access_token);

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/#app_install_id=${appInstallId}&access_token=${tokenData.access_token}&token_type=${tokenData.token_type || "bearer"}&username=${encodeURIComponent(userInfo.login)}`,
      },
    });
  } catch (error) {
    console.error("Error during GitHub OAuth flow:", error);
    return new Response("Server error", { status: 500 });
  }
}

/**
 * Exchange the temporary code for an access token
 *
 * @param {string} code - The temporary code from GitHub OAuth flow
 * @param {Object} env - Environment variables
 * @returns {Promise<Object>} The response containing the access token
 */
async function exchangeCode(code, env) {
  const params = new URLSearchParams({
    client_id: env.VITE_GH_CLIENT_ID,
    client_secret: env.GH_CLIENT_SECRET,
    code: code,
  });

  console.log("Exchanging code for access token");

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      // Set user agent to avoid 403 Forbidden error
      "User-Agent": "Soten-Notes-App",
    },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch information about the authenticated user
 *
 * @param {string} token - The GitHub access token
 * @returns {Promise<Object>} User information
 */
async function fetchUserInfo(token) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      // Set user agent to avoid 403 Forbidden error
      "User-Agent": "Soten-Notes-App",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Check if the user has the GitHub app installed
 *
 * @param {string} token - The GitHub access token
 * @returns {Promise<boolean>} Whether the app is installed or not
 */
async function findAppInstallationId(token) {
  try {
    // Fetch installations accessible to the user
    const response = await fetch("https://api.github.com/user/installations", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        // Set user agent to avoid 403 Forbidden error
        "User-Agent": "Soten-Notes-App",
      },
    });

    if (!response.ok) {
      console.log(await response.text());
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Look for our app in the list of installations
    // The app_slug should match the one used in the installation URL
    return data.installations.filter((installation) => installation.app_slug === "soten-notes").pop()?.id ?? null;
  } catch (error) {
    console.error("Error checking app installation:", error);
    return false;
  }
}
