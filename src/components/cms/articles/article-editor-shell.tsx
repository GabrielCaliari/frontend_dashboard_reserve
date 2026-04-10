"use client";

import type { ReactNode } from "react";
import { ArticleEditorHeader } from "./article-editor-header";
import { PlateEditor } from "@/src/components/cms/editor/plate-editor";
import { SeoSidebar } from "@/src/components/cms/seo-sidebar";
import type { ContentStats } from "@/src/shared/domain/types/cms";
import type { Author } from "@/src/shared/domain/types/@cms-author";

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
  blogId?: string | number;
  articleId?: string;

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
  language: string;
  onLanguageChange: (v: string) => void;
  selectedAuthorId: string;
  onAuthorChange: (v: string) => void;
  coverImageId: string;
  onCoverImageChange: (v: string) => void;
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
  language,
  onLanguageChange,
  selectedAuthorId,
  onAuthorChange,
  coverImageId,
  onCoverImageChange,
  authors,
  isLoadingAuthors,
  isDisabled,
}: ArticleEditorShellProps) {
  return (
    <div className="flex-1 min-h-0 flex overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 min-w-0 min-h-0 border-r border-border flex flex-col">
        <PlateEditor
          highlightedSection={highlightedSection}
          onContentChange={onContentChange}
          focusKeyword={focusKeyword}
          initialContent={initialContent}
          blogId={blogId}
          articleId={articleId}
          topSlot={
            <ArticleEditorHeader
              pageTitle={pageTitle}
              pageSubtitle={pageSubtitle}
              actions={actions}
              onBack={onBack}
              isBackDisabled={isBackDisabled}
            />
          }
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
          language={language}
          onLanguageChange={onLanguageChange}
          selectedAuthorId={selectedAuthorId}
          onAuthorChange={onAuthorChange}
          blogId={blogId}
          coverImageId={coverImageId}
          onCoverImageChange={onCoverImageChange}
          authors={authors}
          isLoadingAuthors={isLoadingAuthors}
          isDisabled={isDisabled}
        />
      </div>
    </div>
  );
}
