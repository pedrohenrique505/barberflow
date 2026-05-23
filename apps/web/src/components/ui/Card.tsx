import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg bg-surface shadow-[0_0_0_1px_rgba(47,42,36,0.08),0_8px_24px_rgba(47,42,36,0.05)] ${className}`}
      {...props}
    />
  );
}
