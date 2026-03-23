import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { Icon } from "../Icon/Icon";
import { Text } from "../Text/Text";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  closeLabel?: string;
  children: ReactNode;
};

export function Dialog({
  open,
  onClose,
  title,
  closeLabel = "Close dialog",
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="bg-surface rounded-lg border border-edge shadow-lg max-w-md w-full mx-auto p-0 backdrop:bg-black/50"
      aria-labelledby={title ? titleId : undefined}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <Text variant="h3" id={titleId}>
            {title}
          </Text>
          <button
            type="button"
            onClick={onClose}
            className="text-paper hover:bg-surface-2 rounded-lg min-h-9 min-w-9 inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label={closeLabel}
          >
            <Icon name="close" size="5" />
          </button>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
