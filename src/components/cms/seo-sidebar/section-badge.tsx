import type React from "react";
import { cn } from "@/src/lib/utils";

type BadgeVariant = "success" | "error" | "warning";

interface SectionBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles = {
  success: "bg-green-500/15 text-green-500 border-green-500/30",
  error: "bg-red-500/15 text-red-500 border-red-500/30",
  warning: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
};

export function SectionBadge({ variant, children }: SectionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        variantStyles[variant],
      )}
    >
      {children}
    </span>
  );
}
