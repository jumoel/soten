import { t } from "../i18n";

export function AppHeader() {
  return (
    <>
      <h1 className="text-3xl">soten</h1>
      <h2>{t("app.tagline")}</h2>
    </>
  );
}
