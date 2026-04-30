"use client";

import { useState, useCallback } from "react";
import type { ContentStats } from "@/src/common/@types/cms";
import { generateSlug } from "@/src/common/utils/slug-generator";

export interface ArticleEditorValues {
  displayTitle: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  language: string;
  selectedAuthorId: string;
  coverImageId: string;
  content: string;
  focusKeyword: string;
}

export interface ArticleEditorState extends ArticleEditorValues {
  contentStats: ContentStats | undefined;
  highlightedSection: string | null;
  setDisplayTitle: (v: string) => void;
  setMetaTitle: (v: string) => void;
  setMetaDescription: (v: string) => void;
  setSlug: (v: string) => void;
  setLanguage: (v: string) => void;
  setSelectedAuthorId: (v: string) => void;
  setCoverImageId: (v: string) => void;
  setContent: (v: string) => void;
  setFocusKeyword: (v: string) => void;
  setContentStats: (stats: ContentStats | undefined) => void;
  setHighlightedSection: (section: string | null) => void;
  handleTitleChange: (value: string) => void;
  reset: (values: Partial<ArticleEditorValues>) => void;
}

export function useArticleEditorState(): ArticleEditorState {
  const [displayTitle, setDisplayTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [language, setLanguage] = useState("en_us");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [coverImageId, setCoverImageId] = useState("");
  const [content, setContent] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [contentStats, setContentStats] = useState<ContentStats | undefined>(undefined);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const handleTitleChange = useCallback(
    (value: string) => {
      setDisplayTitle(value);
      setMetaTitle((prev) =>
        !prev || prev === displayTitle.substring(0, 60)
          ? value.substring(0, 60)
          : prev,
      );
      setSlug((prev) =>
        !prev || prev === generateSlug(displayTitle) ? generateSlug(value) : prev,
      );
    },
    [displayTitle],
  );

  const reset = useCallback((values: Partial<ArticleEditorValues>) => {
    if (values.displayTitle !== undefined) setDisplayTitle(values.displayTitle);
    if (values.metaTitle !== undefined) setMetaTitle(values.metaTitle);
    if (values.metaDescription !== undefined) setMetaDescription(values.metaDescription);
    if (values.slug !== undefined) setSlug(values.slug);
    if (values.language !== undefined) setLanguage(values.language);
    if (values.selectedAuthorId !== undefined) setSelectedAuthorId(values.selectedAuthorId);
    if (values.coverImageId !== undefined) setCoverImageId(values.coverImageId);
    if (values.content !== undefined) setContent(values.content);
    if (values.focusKeyword !== undefined) setFocusKeyword(values.focusKeyword);
  }, []);

  return {
    displayTitle,
    metaTitle,
    metaDescription,
    slug,
    language,
    selectedAuthorId,
    coverImageId,
    content,
    focusKeyword,
    contentStats,
    highlightedSection,
    setDisplayTitle,
    setMetaTitle,
    setMetaDescription,
    setSlug,
    setLanguage,
    setSelectedAuthorId,
    setCoverImageId,
    setContent,
    setFocusKeyword,
    setContentStats,
    setHighlightedSection,
    handleTitleChange,
    reset,
  };
}
