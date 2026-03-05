const en = {
  "app.tagline": "Notes written with markdown, backed by git.",
  "app.initializing": "Initializing\u2026",

  "auth.loginWithGithub": "Login with GitHub",
  "auth.loginFailed": "Login failed",
  "auth.tryAgain": "Try again",
  "auth.welcome": "Welcome, {username}!",
  "auth.switchRepo": "switch",
  "auth.logout": "Log out",

  "repo.selectRepository": "Select a repository:",
  "repo.manageAccess": "Manage repository access on GitHub",

  "menu.settings": "Settings",
  "nav.back": "Back",

  "note.frontpage": "Frontpage",
  "note.loading": "Loading\u2026",
  "note.dayPrefix": "Day: {date}",
  "note.unnamedWithDate": "Unnamed note \u00B7 {date}",
  "note.unnamedWithStem": "Unnamed note \u00B7 {stem}",

  "settings.pageSize": "Notes per page",

  "note.continueReading": "Continue reading \u2192",

  "pagination.previous": "\u2190 Previous",
  "pagination.next": "Next \u2192",
  "pagination.pageOf": "Page {page} of {total}",

  "error.invalidAuth": "Invalid installationId or token",
  "error.fetchReposFailed": "Failed to fetch repos",
  "error.noRepos": "No repos found",
  "error.invalidState": "Invalid state when fetching files",
} as const;

export type Messages = { [K in keyof typeof en]: string };
export type MessageKey = keyof Messages;
export default en;
