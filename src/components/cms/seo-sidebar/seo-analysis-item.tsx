"use client";

import type React from"react";

import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from"lucide-react";
import { cn } from"@/src/common/lib/utils";
// Ensure Tooltip is imported from your UI components
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger,
 TooltipProvider,
} from"@/src/components/ui/tooltip";

type Status ="success" |"error" |"warning";

interface SeoAnalysisItemProps {
 status: Status;
 children: React.ReactNode;
 tooltip?: string;
 onHover?: () => void;
 onLeave?: () => void;
}

// Adjust colors to use standard tailwind classes or match your theme directly
const statusConfig = {
 success: {
 icon: CheckCircle2,
 color:"text-green-500",
 },
 error: {
 icon: XCircle,
 color:"text-red-500",
 },
 warning: {
 icon: AlertCircle,
 color:"text-yellow-500",
 },
};

export function SeoAnalysisItem({
 status,
 children,
 tooltip ="Click to learn why this matters for SEO.",
 onHover,
 onLeave,
}: SeoAnalysisItemProps) {
 const { icon: Icon, color } = statusConfig[status];

 return (
 <TooltipProvider>
 <div
 className={cn("group flex items-start gap-3 py-2 px-1 rounded-md transition-colors","hover:bg-accent/50",
 )}
 onMouseEnter={onHover}
 onMouseLeave={onLeave}
 >
 <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
 <span className="flex-1 text-sm text-muted-foreground leading-relaxed">
 {children}
 </span>
 <Tooltip>
 <TooltipTrigger asChild>
 <button className="opacity-0 group-hover:opacity-100 transition-opacity">
 <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
 </button>
 </TooltipTrigger>
 <TooltipContent side="left" className="max-w-xs text-xs">
 {tooltip}
 </TooltipContent>
 </Tooltip>
 </div>
 </TooltipProvider>
 );
}
