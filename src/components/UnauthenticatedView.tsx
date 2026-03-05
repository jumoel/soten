import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { GitHubAuthButton } from "./GitHubAuthButton";

export function UnauthenticatedView({ authError }: { authError: string | null }) {
  return (
    <div className="text-center">
      <h1 className="text-3xl">soten</h1>
      <h2>{t("app.tagline")}</h2>
      {authError && (
        <AlertBox>
          <p className="text-red-800 font-medium">{t("auth.loginFailed")}</p>
          <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{authError}</pre>
        </AlertBox>
      )}
      <GitHubAuthButton />
    </div>
  );
}
