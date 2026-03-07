"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? "text-foreground font-medium truncate max-w-[200px]" : ""}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground transition-colors truncate max-w-[150px]">{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
