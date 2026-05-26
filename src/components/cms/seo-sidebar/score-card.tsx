"use client";

import { HelpCircle } from"lucide-react";
import { cn } from"@/src/common/lib/utils";
import { Input } from"@/src/components/ui/input";
import { Label } from"@/src/components/ui/label";
import {
 Tooltip,
 TooltipContent,
 TooltipTrigger,
 TooltipProvider,
} from"@/src/components/ui/tooltip";

interface ScoreCardProps {
 score: number;
 focusKeyword: string;
 onKeywordChange: (keyword: string) => void;
}

function getScoreColor(score: number) {
 if (score >= 80) return"text-green-500";
 if (score >= 50) return"text-yellow-500";
 return"text-red-500";
}

function getScoreRingColor(score: number) {
 if (score >= 80) return"stroke-green-500";
 if (score >= 50) return"stroke-yellow-500";
 return"stroke-red-500";
}

function getScoreLabel(score: number) {
 if (score >= 80) return"Great";
 if (score >= 50) return"Needs Work";
 return"Poor";
}

export function ScoreCard({
 score,
 focusKeyword,
 onKeywordChange,
}: ScoreCardProps) {
 const circumference = 2 * Math.PI * 28;
 const strokeDashoffset = circumference - (score / 100) * circumference;

 return (
 <TooltipProvider>
 <div className="space-y-3">
 {/* Score + Preview Row */}
 <div className="flex items-center justify-between">
 {/* Circular Score */}
 <div className="flex items-center gap-3">
 <div className="relative w-14 h-14">
 <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
 <circle
 cx="32"
 cy="32"
 r="28"
 fill="none"
 strokeWidth="4"
 className="stroke-border"
 />
 <circle
 cx="32"
 cy="32"
 r="28"
 fill="none"
 strokeWidth="4"
 strokeLinecap="round"
 className={cn("transition-all duration-500",
 getScoreRingColor(score),
 )}
 strokeDasharray={circumference}
 strokeDashoffset={strokeDashoffset}
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <span
 className={cn("text-sm font-bold tabular-nums",
 getScoreColor(score),
 )}
 >
 {score}
 </span>
 </div>
 </div>
 <div className="flex flex-col">
 <span
 className={cn("text-xs font-semibold", getScoreColor(score))}
 >
 {getScoreLabel(score)}
 </span>
 <span className="text-[10px] text-muted-foreground">
 SEO Score
 </span>
 </div>
 </div>

 {/* Help */}
 <Tooltip>
 <TooltipTrigger asChild>
 <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
 <HelpCircle className="h-3.5 w-3.5" />
 </button>
 </TooltipTrigger>
 <TooltipContent>SEO Analysis Help</TooltipContent>
 </Tooltip>
 </div>

 {/* Focus Keyword Input */}
 <div className="space-y-1.5">
 <Label
 htmlFor="focus-keyword"
 className="text-xs text-muted-foreground font-medium"
 >
 Focus Keyword
 </Label>
 <Input
 id="focus-keyword"
 value={focusKeyword}
 onChange={(e) => onKeywordChange(e.target.value)}
 placeholder="Enter focus keyword..."
 className="h-8 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
 />
 </div>
 </div>
 </TooltipProvider>
 );
}
