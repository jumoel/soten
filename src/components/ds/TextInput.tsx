import type { InputHTMLAttributes } from "react";

const base = "border border-gray-300 rounded px-2 py-1 text-sm";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={[base, className].filter(Boolean).join(" ")} {...props} />;
}
