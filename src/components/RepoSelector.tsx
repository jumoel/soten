import { useAtom } from "jotai";
import { reposAtom, dispatch, Event } from "../atoms/globals";

export function RepoSelector() {
  const [repos] = useAtom(reposAtom);

  return (
    <div className="my-4">
      <p className="mb-2 font-semibold">Select a repository:</p>
      <ul>
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <li key={fullName} className="my-1">
              <button
                className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 font-mono text-sm"
                onClick={() => dispatch(Event.SelectRepo, { owner, repo })}
              >
                {fullName}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm">
        <a
          href="https://github.com/apps/soten-notes/installations/select_target"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Manage repository access on GitHub
        </a>
      </p>
    </div>
  );
}
