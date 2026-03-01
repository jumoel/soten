import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import { t } from "../i18n";
import {
  store,
  AuthState,
  authStateAtom,
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
  await wipeFs();
}

export async function handleFetchAndSelectRepos() {
  const user = store.get(userAtom);

  if (!user) {
    await dispatch(Event.Error, { message: t("error.invalidAuth") });
    return;
  }

  const repos = await fetchUserRepos(user.installationId, user.token);

  if (!repos) {
    await dispatch(Event.Error, { message: t("error.fetchReposFailed") });
    return;
  }

  if (repos.length === 0) {
    await dispatch(Event.Error, { message: t("error.noRepos") });
    return;
  }

  store.set(reposAtom, repos);

  const cachedRepo = store.get(selectedRepoAtom);

  if (cachedRepo && repos.includes(`${cachedRepo.owner}/${cachedRepo.repo}`)) {
    await dispatch(Event.FetchRepoFiles);
    return;
  }

  if (repos.length === 1) {
    const [owner, repo] = repos[0].split("/");
    await dispatch(Event.SelectRepo, { owner, repo });
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
    await dispatch(Event.Error, { message: t("error.invalidState") });
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
