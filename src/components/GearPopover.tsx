import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { send } from "../atoms/globals";
import type { Repo } from "../atoms/store";
import { Button, Link, Popover, Stack, Text } from "../design";
import { t } from "../i18n";

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
  const navigate = useNavigate();

  return (
    <Popover
      trigger={
        <Button variant="ghost" iconOnly aria-label="Settings" onClick={() => setOpen((v) => !v)}>
          <GearIcon />
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    >
      <div className="py-1">
        {selectedRepo && (
          <div className="px-3 py-2 border-b border-edge">
            <Text variant="body-dim" as="p">
              {selectedRepo.owner}/{selectedRepo.repo}
            </Text>
          </div>
        )}
        <Stack gap={1} as="ul">
          <li className="px-3 py-1">
            <Link
              variant="muted"
              onClick={() => {
                setOpen(false);
                void navigate({ to: "/settings" });
              }}
            >
              {t("menu.settings")}
            </Link>
          </li>
          <li className="px-3 py-1">
            <Link
              variant="muted"
              onClick={() => {
                setOpen(false);
                void send({ type: "LOGOUT" });
              }}
            >
              {t("auth.logout")}
            </Link>
          </li>
        </Stack>
      </div>
    </Popover>
  );
}
