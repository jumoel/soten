import {
  handleAuthenticated,
  handleError,
  handleFetchAndSelectRepos,
  handleFetchRepoFiles,
  handleLogout,
  handleReadRepoFilesContent,
  handleShowFront,
  handleShowNote,
} from "./handlers";

export enum Event {
  Authenticated = "Authenticated",
  Logout = "Logout",
  FetchAndSelectRepos = "FetchAndSelectRepos",
  FetchRepoFiles = "FetchRepoFiles",
  ReadRepoFilesContent = "ReadRepoFilesContent",
  Error = "Error",
  ShowNote = "ShowNote",
  ShowFront = "ShowFront",
}

type DEvent<T, P> = { event: T; payload: P };
type DispatchEvents =
  | DEvent<
      Event.Authenticated,
      { username: string; token: string; installationId: string; email: string }
    >
  | DEvent<Event.Logout, undefined>
  | DEvent<Event.FetchAndSelectRepos, undefined>
  | DEvent<Event.FetchRepoFiles, undefined>
  | DEvent<Event.ReadRepoFilesContent, undefined>
  | DEvent<Event.Error, { event?: Event; message: string }>
  | DEvent<Event.ShowNote, { path: string }>
  | DEvent<Event.ShowFront, undefined>;

export async function dispatch<E extends DispatchEvents["event"]>(
  event: E,
  payload?: Extract<DispatchEvents, { event: E }>["payload"],
) {
  const dispatchEvent = { event, payload } as DispatchEvents;

  return await dispatchInternal(dispatchEvent);
}

async function dispatchInternal({ event, payload }: DispatchEvents) {
  console.log("Received Event", event, "with payload", payload);

  switch (event) {
    case Event.Authenticated:
      return handleAuthenticated(payload);
    case Event.Logout:
      return handleLogout();
    case Event.FetchAndSelectRepos:
      return handleFetchAndSelectRepos();
    case Event.FetchRepoFiles:
      return handleFetchRepoFiles();
    case Event.ReadRepoFilesContent:
      return handleReadRepoFilesContent();
    case Event.Error:
      return handleError(payload);
    case Event.ShowNote:
      return handleShowNote(payload);
    case Event.ShowFront:
      return handleShowFront();
    default:
      console.warn("Unimplemented event received:", event, "with payload", payload);
  }
}
