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
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h.263c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.394.394c.39.39.419 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v.263c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.3.447.269 1.06-.12 1.45l-.394.394a1.125 1.125 0 0 1-1.45.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-.263c-.55 0-1.02-.398-1.11-.94l-.149-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.3-1.06.269-1.45-.12l-.394-.394a1.125 1.125 0 0 1-.12-1.45l.527-.738c.25-.35.273-.806.108-1.204-.165-.397-.506-.71-.93-.781l-.894-.149c-.542-.09-.94-.56-.94-1.11v-.263c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.394-.394c.39-.39 1.002-.419 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.781-.929l.149-.894Z" />
      <circle cx="12" cy="12" r="3.75" />
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
