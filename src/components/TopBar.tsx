import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
import { Toolbar } from "./ds/Toolbar";

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d={d} />
    </svg>
  );
}

export function TopBar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  return (
    <Toolbar>
      <Link to="/" className="text-lg font-medium tracking-tight no-underline text-gray-800">
        soten
      </Link>
      <Button variant="ghost" onClick={onMenuToggle} aria-label="Menu">
        <Icon d={menuOpen ? "M5 5l10 10M15 5L5 15" : "M3 5h14M3 10h14M3 15h14"} />
      </Button>
    </Toolbar>
  );
}
