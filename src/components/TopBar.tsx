import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "./Button";
import { Toolbar } from "./ds/Toolbar";
import { NavLink } from "./ds/NavLink";
import { TextInput } from "./ds/TextInput";
import { Text } from "./ds/Text";
import { onlineAtom } from "../lib/online";
import { machineAtom, searchQueryAtom } from "../atoms/globals";
import { t } from "../i18n";

function SearchBar() {
  const query = useAtomValue(searchQueryAtom);
  const setQuery = useSetAtom(searchQueryAtom);
  const [local, setLocal] = useState(query);

  useEffect(() => {
    if (query === "") setLocal("");
  }, [query]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(local), 150);
    return () => clearTimeout(id);
  }, [local, setQuery]);

  return (
    <TextInput
      type="search"
      placeholder={t("search.placeholder")}
      aria-label={t("search.placeholder")}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
    />
  );
}

export function TopBar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const online = useAtomValue(onlineAtom);
  const machine = useAtomValue(machineAtom);

  return (
    <Toolbar>
      <div className="flex items-center gap-3">
        <NavLink to="/" variant="brand">
          <svg
            width="26"
            height="30"
            viewBox="36 24 130 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M42 30 H140 L162 52 V170 H42 V30Z"
              fill="#faf8f4"
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="3"
            />
            <path d="M140 30 L140 52 H162" fill="#ece8e0" />
            <rect x="42" y="30" width="12" height="140" fill="#e07040" />
            <path
              d="M88.694 92.552Q84.646 92.552 81.656 91.218Q78.666 89.884 76.826 87.584L80.828 83.168Q82.576 85.1 84.669 86.02Q86.762 86.94 88.924 86.94Q91.408 86.94 92.696 85.836Q93.984 84.732 93.984 82.662Q93.984 80.96 92.995 80.086Q92.006 79.212 89.66 78.844L86.302 78.292Q81.978 77.556 80.046 75.095Q78.114 72.634 78.114 69.092Q78.114 64.446 81.15 61.893Q84.186 59.34 89.66 59.34Q93.386 59.34 96.146 60.49Q98.906 61.64 100.608 63.618L96.698 67.988Q95.41 66.562 93.662 65.757Q91.914 64.952 89.706 64.952Q85.06 64.952 85.06 68.77Q85.06 70.426 86.095 71.254Q87.13 72.082 89.476 72.496L92.834 73.094Q96.744 73.784 98.86 76.038Q100.976 78.292 100.976 82.11Q100.976 84.364 100.194 86.273Q99.412 88.182 97.848 89.585Q96.284 90.988 94.007 91.77Q91.73 92.552 88.694 92.552Z M118.8 92.552Q112.36 92.552 109.301 88.182Q106.242 83.812 106.242 75.946Q106.242 68.08 109.301 63.71Q112.36 59.34 118.8 59.34Q125.24 59.34 128.299 63.71Q131.358 68.08 131.358 75.946Q131.358 83.812 128.299 88.182Q125.24 92.552 118.8 92.552ZM118.8 86.986Q121.744 86.986 122.871 84.801Q123.998 82.616 123.998 78.706V73.14Q123.998 69.276 122.871 67.091Q121.744 64.906 118.8 64.906Q115.856 64.906 114.729 67.091Q113.602 69.276 113.602 73.14V78.752Q113.602 82.616 114.729 84.801Q115.856 86.986 118.8 86.986Z"
              fill="#1a1a1e"
            />
            <path
              d="M79.724 144.0V138.434H88.372V116.906H87.958L81.426 125.462L77.01 122.012L84.692 111.892H95.272V138.434H102.08V144.0Z M118.8 144.552Q112.36 144.552 109.301 140.182Q106.242 135.812 106.242 127.946Q106.242 120.08 109.301 115.71Q112.36 111.34 118.8 111.34Q125.24 111.34 128.299 115.71Q131.358 120.08 131.358 127.946Q131.358 135.812 128.299 140.182Q125.24 144.552 118.8 144.552ZM118.8 139.124Q121.882 139.124 123.101 136.962Q124.32 134.8 124.32 130.936V124.956Q124.32 121.092 123.101 118.93Q121.882 116.768 118.8 116.768Q115.718 116.768 114.499 118.93Q113.28 121.092 113.28 124.956V130.936Q113.28 134.8 114.499 136.962Q115.718 139.124 118.8 139.124ZM118.8 130.66Q117.19 130.66 116.569 130.016Q115.948 129.372 115.948 128.452V127.44Q115.948 126.52 116.569 125.876Q117.19 125.232 118.8 125.232Q120.41 125.232 121.031 125.876Q121.652 126.52 121.652 127.44V128.452Q121.652 129.372 121.031 130.016Q120.41 130.66 118.8 130.66Z"
              fill="#e07040"
            />
          </svg>
          soten
        </NavLink>
        {!online && <Text variant="meta">offline</Text>}
      </div>
      {machine.phase === "ready" && <SearchBar />}
      <Button variant="ghost" onClick={onMenuToggle} aria-label="Menu">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d={menuOpen ? "M5 5l10 10M15 5L5 15" : "M3 5h14M3 10h14M3 15h14"} />
        </svg>
      </Button>
    </Toolbar>
  );
}
