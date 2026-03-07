import { useEffect } from "react";
import { Button } from "./Button";
import { Text } from "./ds/Text";
import { Overlay } from "./ds/Overlay";
import { MenuPanel } from "./ds/MenuPanel";
import { NavLink } from "./ds/NavLink";
import { send } from "../atoms/globals";
import { t } from "../i18n";
import type { Repo } from "../atoms/store";

export function Menu({
  open,
  onClose,
  selectedRepo,
}: {
  open: boolean;
  onClose: () => void;
  selectedRepo?: Repo;
}) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <Overlay onClick={onClose} />
      <MenuPanel>
        {selectedRepo && (
          <Text variant="mono" as="p">
            {selectedRepo.owner}/{selectedRepo.repo}
          </Text>
        )}
        <p>
          <NavLink to="/settings" onClick={onClose}>
            {t("menu.settings")}
          </NavLink>
        </p>
        <p>
          <Button
            variant="link"
            size="sm"
            onClick={async () => {
              onClose();
              await send({ type: "LOGOUT" });
            }}
          >
            {t("auth.logout")}
          </Button>
        </p>
      </MenuPanel>
    </>
  );
}
