import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "bg-primary text-white hover:bg-[#201c18] focus-visible:outline-primary",
  secondary:
    "bg-surface text-text-primary ring-1 ring-border hover:bg-surface-muted focus-visible:outline-primary",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:outline-primary",
};

export function Button({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium [transition-property:color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    />
  );
}
