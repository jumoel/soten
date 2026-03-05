import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { send } from "../atoms/globals";
import { t } from "../i18n";
import type { User, Repo } from "../atoms/store";
import { AppHeader } from "./AppHeader";
import { Button } from "./Button";

export function AuthenticatedShell({
  user,
  selectedRepo,
  children,
}: {
  user: User;
  selectedRepo?: Repo;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <>
      <div className="text-center">
        <AppHeader />
        <div className="my-4">
          <p>{t("auth.welcome", { username: user.username })}</p>
          {selectedRepo && (
            <p className="text-sm">
              {selectedRepo.owner}/{selectedRepo.repo}{" "}
              <Button variant="link" onClick={() => send({ type: "SWITCH_REPO" })}>
                {t("auth.switchRepo")}
              </Button>
            </p>
          )}
          <p>
            <Button
              variant="link"
              onClick={async () => {
                await send({ type: "LOGOUT" });
                navigate({ to: "/" });
              }}
            >
              {t("auth.logout")}
            </Button>
          </p>
        </div>
      </div>
      {children}
    </>
  );
}
