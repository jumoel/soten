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
  "note.unnamedWithStem": "Unnamed note \u00B7 {stem}",
  "note.new": "New note",
  "note.pin": "Pin",
  "note.unpin": "Unpin",
  "note.edit": "Edit",

  "settings.theme": "Theme",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.theme.system": "System",

  "search.placeholder": "Search\u2026",

  "draft.save": "Save",
  "draft.discard": "Discard",
  "draft.minimize": "Minimize",
  "draft.discardAreYouSure": "Are you sure?",
  "draft.discardConfirmAction": "Confirm",
  "draft.discardCancel": "Cancel",
  "draft.discardConfirm": "Discard this draft? This cannot be undone.",
  "draft.placeholder": "Start writing\u2026",

  "notes.empty": "No notes yet. Click + New note to get started.",
  "notes.noResults": "No notes matching \u2018{query}\u2019.",

  "sort.label": "Sort",
  "sort.newest": "Newest",
  "sort.oldest": "Oldest",
  "sort.bestMatch": "Best match",

  "error.fetchReposFailed": "Failed to fetch repos",
  "error.noRepos": "No repos found",
} as const;

export type Messages = { [K in keyof typeof en]: string };
export type MessageKey = keyof Messages;
export default en;
