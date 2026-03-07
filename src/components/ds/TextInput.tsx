import type { InputHTMLAttributes } from "react";

const base =
  "border border-edge-2 rounded px-2 py-1 text-base sm:text-sm bg-surface-2 text-paper placeholder:text-muted focus:outline-none focus:border-accent";

const widthMap = {
  full: "w-full",
  "20": "w-20",
  auto: "",
} as const;

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "width"> & {
  width?: keyof typeof widthMap;
};

export function TextInput({ width, ...props }: TextInputProps) {
  const classes = [base, width && widthMap[width]].filter(Boolean).join(" ");
  return <input className={classes} {...props} />;
}
