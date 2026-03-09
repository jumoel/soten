import { type ReactNode } from "react";
import { Icon } from "../Icon/Icon";

type AlertVariant = "info" | "warning" | "error";

export type AlertProps = {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
};

const variantClasses: Record<AlertVariant, { container: string; iconText: string }> = {
  info: {
    container: "bg-info-surface border-info-edge",
    iconText: "text-info-text",
  },
  warning: {
    container: "bg-warning-surface border-warning-edge",
    iconText: "text-warning-text",
  },
  error: {
    container: "bg-error-surface border-error-edge",
    iconText: "text-error-text",
  },
};

export function Alert({ variant, title, children }: AlertProps) {
  const { container, iconText } = variantClasses[variant];

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={["rounded-md border px-4 py-3 flex gap-3", container].join(" ")}
    >
      <span className={["shrink-0 mt-0.5", iconText].join(" ")}>
        <Icon name={variant} size="5" aria-hidden={true} />
      </span>
      <div className={title ? "flex flex-col gap-1" : "flex items-start"}>
        {title && <p className={["font-medium", iconText].join(" ")}>{title}</p>}
        <div className="text-sm text-paper">{children}</div>
      </div>
    </div>
  );
}
