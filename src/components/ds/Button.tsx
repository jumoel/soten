import type { ButtonHTMLAttributes } from "react";

const variantStyles = {
  primary: "px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover",
  link: "underline",
  ghost: "p-1",
  pagination: "p-1 text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-default",
};

const sizeStyles = {
  default: "",
  sm: "text-sm",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
};

export function Button({ variant = "primary", size = "default", ...props }: ButtonProps) {
  const classes = [variantStyles[variant], sizeStyles[size]].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}
