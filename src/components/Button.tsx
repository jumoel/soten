import type { ButtonHTMLAttributes } from "react";

const variantStyles = {
  primary: "px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700",
  link: "underline",
  ghost: "p-1",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const base = variantStyles[variant];

  return <button className={[base, className].filter(Boolean).join(" ")} {...props} />;
}
