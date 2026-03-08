import { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { NavLink } from "./ds/NavLink";
import { Text } from "./ds/Text";
import { send } from "../atoms/globals";
import { t } from "../i18n";
import type { Repo } from "../atoms/store";

function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="2.5" />
      <path
        d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.1 4.1l1.1 1.1M14.8 14.8l1.1 1.1M15.9 4.1l-1.1 1.1M5.2 14.8l-1.1 1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

type GearPopoverProps = { selectedRepo?: Repo };

export function GearPopover({ selectedRepo }: GearPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen((v) => !v)} aria-label="Settings">
        <GearIcon />
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-48 border border-edge rounded bg-surface px-3 py-2 space-y-2 shadow-sm">
          {selectedRepo && (
            <Text variant="mono" as="p">
              {selectedRepo.owner}/{selectedRepo.repo}
            </Text>
          )}
          <p>
            <NavLink to="/settings" onClick={() => setOpen(false)}>
              {t("menu.settings")}
            </NavLink>
          </p>
          <p>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setOpen(false);
                void send({ type: "LOGOUT" });
              }}
            >
              {t("auth.logout")}
            </Button>
          </p>
        </div>
      )}
    </div>
  );
}
