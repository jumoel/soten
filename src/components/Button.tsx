import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "link";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base =
    variant === "link" ? "underline" : "px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700";

  return <button className={[base, className].filter(Boolean).join(" ")} {...props} />;
}
