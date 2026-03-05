import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "./Button";
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
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="relative z-20 border-b border-gray-200 px-4 py-3 space-y-2 bg-white">
        {selectedRepo && (
          <p className="text-sm font-mono text-gray-500">
            {selectedRepo.owner}/{selectedRepo.repo}
          </p>
        )}
        <p>
          <Link to="/settings" className="text-sm no-underline hover:underline" onClick={onClose}>
            {t("menu.settings")}
          </Link>
        </p>
        <p>
          <Button
            variant="link"
            className="text-sm"
            onClick={async () => {
              onClose();
              await send({ type: "LOGOUT" });
            }}
          >
            {t("auth.logout")}
          </Button>
        </p>
      </div>
    </>
  );
}
