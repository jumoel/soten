import { Button } from "./Button";
import { Toolbar } from "./ds/Toolbar";
import { NavLink } from "./ds/NavLink";

export function TopBar({
  menuOpen,
  onMenuToggle,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  return (
    <Toolbar>
      <NavLink to="/" variant="brand">
        soten
      </NavLink>
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
