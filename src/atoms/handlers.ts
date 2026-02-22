import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import {
  store,
  AppView,
  AuthState,
  appViewAtom,
  authStateAtom,
  currentPathAtom,
  errorAtom,
  filesAtom,
  repoFilenamesAtom,
  repoReadyAtom,
  reposAtom,
  selectedRepoAtom,
  userAtom,
} from "./store";
import { dispatch, Event } from "./events";

export async function handleAuthenticated(payload: {
  username: string;
  token: string;
  installationId: string;
  email: string;
}) {
  store.set(userAtom, payload);
  store.set(authStateAtom, AuthState.Authenticated);
  await dispatch(Event.FetchAndSelectRepos);
}

export async function handleLogout() {
  store.set(userAtom, null);
  store.set(authStateAtom, AuthState.Unauthenticated);
  store.set(selectedRepoAtom, null);
  store.set(reposAtom, []);
  store.set(repoFilenamesAtom, []);
  store.set(filesAtom, {});
  store.set(repoReadyAtom, false);
  store.set(errorAtom, null);
  store.set(appViewAtom, AppView.Front);
  await wipeFs();
}

export async function handleFetchAndSelectRepos() {
  const user = store.get(userAtom);

  if (!user) {
    await dispatch(Event.Error, { message: "Invalid installationId or token" });
    return;
  }

  const repos = await fetchUserRepos(user.installationId, user.token);

  if (!repos) {
    await dispatch(Event.Error, { message: "Failed to fetch repos" });
    return;
  }

  if (repos.length === 0) {
    await dispatch(Event.Error, { message: "No repos found" });
    return;
  }

  store.set(reposAtom, repos);

  const cachedRepo = store.get(selectedRepoAtom);

  if (cachedRepo && repos.includes(`${cachedRepo.owner}/${cachedRepo.repo}`)) {
    await dispatch(Event.FetchRepoFiles);
    return;
  }

  store.set(selectedRepoAtom, null);
}

export async function handleSelectRepo(payload: { owner: string; repo: string }) {
  store.set(selectedRepoAtom, payload);
  store.set(repoFilenamesAtom, []);
  store.set(filesAtom, {});
  store.set(repoReadyAtom, false);
  await wipeFs();
  await dispatch(Event.FetchRepoFiles);
}

export async function handleFetchRepoFiles() {
  const selectedRepo = store.get(selectedRepoAtom);
  const user = store.get(userAtom);

  if (!selectedRepo || !user) {
    await dispatch(Event.Error, { message: "Invalid state when fetching files" });
    return;
  }

  if (await git.isInitialized()) {
    await git.pull(user);
  } else {
    await git.clone(`https://github.com/${selectedRepo.owner}/${selectedRepo.repo}.git`, user);
  }

  const repoFiles = await readRepoFiles();
  store.set(repoFilenamesAtom, repoFiles);

  await dispatch(Event.ReadRepoFilesContent);
}

export async function handleReadRepoFilesContent() {
  const filenames = store.get(repoFilenamesAtom);

  const files = (
    await Promise.all(
      filenames.map(async (filename) => {
        const content = await readFile(filename);

        if (content === null) {
          return null;
        }

        return { [filename]: content };
      }),
    )
  )
    .filter(Boolean)
    .reduce((acc, obj) => Object.assign(acc, obj), {});

  store.set(filesAtom, files);
  store.set(repoReadyAtom, true);
}

export function handleError(payload: { message: string }) {
  store.set(errorAtom, payload.message);
}

export function handleShowNote(payload: { path: string }) {
  store.set(currentPathAtom, payload.path);
  store.set(appViewAtom, AppView.Note);
}

export function handleShowFront() {
  store.set(currentPathAtom, "/");
  store.set(appViewAtom, AppView.Front);
}
