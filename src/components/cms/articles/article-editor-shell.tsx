"use client";

import type { ReactNode } from "react";
import { ArticleEditorHeader } from "./article-editor-header";
import { PlateEditor } from "@/src/components/cms/editor/plate-editor";
import { SeoSidebar } from "@/src/components/cms/seo-sidebar";
import type { ContentStats } from "@/src/types/cms";
import type { Author } from "@/src/common/@types/@cms-author";

interface ArticleEditorShellProps {
  // Header
  pageTitle: string;
  pageSubtitle: ReactNode;
  actions: ReactNode;
  onBack: () => void;
  isBackDisabled?: boolean;

  // Editor
  highlightedSection: string | null;
  onContentChange: (stats: ContentStats) => void;
  focusKeyword: string;
  initialContent?: string;
  blogId?: number;
  articleId?: number;

  // Sidebar
  contentStats: ContentStats | undefined;
  onHighlightEditorSection: (section: string | null) => void;
  onFocusKeywordChange: (v: string) => void;
  metaTitle: string;
  onMetaTitleChange: (v: string) => void;
  metaDescription: string;
  onMetaDescriptionChange: (v: string) => void;
  displayTitle: string;
  onDisplayTitleChange: (v: string) => void;
  slug: string;
  onSlugChange: (v: string) => void;
  selectedAuthorId: string;
  onAuthorChange: (v: string) => void;
  authors: Author[];
  isLoadingAuthors: boolean;
  isDisabled?: boolean;
}

export function ArticleEditorShell({
  pageTitle,
  pageSubtitle,
  actions,
  onBack,
  isBackDisabled,
  highlightedSection,
  onContentChange,
  focusKeyword,
  initialContent,
  blogId,
  articleId,
  contentStats,
  onHighlightEditorSection,
  onFocusKeywordChange,
  metaTitle,
  onMetaTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  displayTitle,
  onDisplayTitleChange,
  slug,
  onSlugChange,
  selectedAuthorId,
  onAuthorChange,
  authors,
  isLoadingAuthors,
  isDisabled,
}: ArticleEditorShellProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ArticleEditorHeader
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        actions={actions}
        onBack={onBack}
        isBackDisabled={isBackDisabled}
      />

      <div className="flex-1 min-h-0 flex">
        {/* Main Editor */}
        <div className="flex-1 min-w-0 min-h-0 border-r border-border">
          <PlateEditor
            highlightedSection={highlightedSection}
            onContentChange={onContentChange}
            focusKeyword={focusKeyword}
            initialContent={initialContent}
            blogId={blogId}
            articleId={articleId}
          />
        </div>

        {/* SEO Sidebar */}
        <div className="w-80 shrink-0 overflow-y-auto hidden xl:block bg-content1">
          <SeoSidebar
            contentStats={contentStats}
            onHighlightEditorSection={onHighlightEditorSection}
            focusKeyword={focusKeyword}
            onFocusKeywordChange={onFocusKeywordChange}
            metaTitle={metaTitle}
            onMetaTitleChange={onMetaTitleChange}
            metaDescription={metaDescription}
            onMetaDescriptionChange={onMetaDescriptionChange}
            displayTitle={displayTitle}
            onDisplayTitleChange={onDisplayTitleChange}
            slug={slug}
            onSlugChange={onSlugChange}
            selectedAuthorId={selectedAuthorId}
            onAuthorChange={onAuthorChange}
            authors={authors}
            isLoadingAuthors={isLoadingAuthors}
            isDisabled={isDisabled}
          />
        </div>
      </div>
    </div>
  );
}
