import type { Value } from"platejs";
import type { ContentStats } from"@/src/common/@types/cms";

export type { ContentStats };
export type { Value };

export type ViewMode ="formatted" |"markdown";

export interface Chapter {
 id: string;
 anchorId: string;
 title: string;
 type:"h1" |"h2" |"h3";
 order: number;
 hasChildren: boolean;
 collapsed: boolean;
}

export interface PlateEditorProps {
 highlightedSection?: string | null;
 onContentChange?: (stats: ContentStats) => void;
 focusKeyword?: string;
 initialContent?: string;
 blogId?: string | number;
 articleId?: string;
 topSlot?: React.ReactNode;
}
