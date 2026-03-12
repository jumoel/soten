import { Button } from "../ds";

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 md:hidden">
      <Button variant="primary" icon="plus" iconOnly aria-label="New note" onClick={onClick} />
    </div>
  );
}
