import { Button } from "../ds";
import { t } from "../i18n";

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 md:hidden">
      <Button variant="primary" icon="plus" iconOnly aria-label={t("note.new")} onClick={onClick} />
    </div>
  );
}
