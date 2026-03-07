const en = {
  "app.tagline": "Notes written with markdown, backed by git.",

  "auth.loginWithGithub": "Login with GitHub",
  "auth.loginFailed": "Login failed",
  "auth.tryAgain": "Try again",
  "auth.logout": "Log out",

  "repo.selectRepository": "Select a repository:",
  "repo.manageAccess": "Manage repository access on GitHub",

  "menu.settings": "Settings",
  "nav.back": "Back",

  "note.loading": "Loading\u2026",
  "note.dayPrefix": "Day: {date}",
  "note.unnamedWithDate": "Unnamed note \u00B7 {date}",
  "note.unnamedWithStem": "Unnamed note \u00B7 {stem}",

  "settings.pageSize": "Notes per page",
  "settings.theme": "Theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",

  "pagination.previous": "\u2190 Previous",
  "pagination.next": "Next \u2192",
  "pagination.pageOf": "Page {page} of {total}",

  "error.fetchReposFailed": "Failed to fetch repos",
  "error.noRepos": "No repos found",
} as const;

export type Messages = { [K in keyof typeof en]: string };
export type MessageKey = keyof Messages;
export default en;
