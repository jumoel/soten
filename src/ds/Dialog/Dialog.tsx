import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Icon } from "../Icon/Icon";
import { Text } from "../Text/Text";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

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
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
      onClose={onClose}
    >
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge">
          <Text variant="h3">{title}</Text>
          <button
            type="button"
            onClick={onClose}
            className="text-paper-dim hover:bg-surface-2 rounded-md p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Close dialog"
          >
            <Icon name="close" size="4" />
          </button>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </dialog>
  );
}
