"use client";

import { useState, useMemo } from "react";
import {
  Avatar,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { TooltipProvider } from "@/src/presentation/components/atoms/shadcn-ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/presentation/components/atoms/shadcn-ui/accordion";
import { ScoreCard } from "./score-card";
import { SectionBadge } from "./section-badge";
import { SeoAnalysisItem } from "./seo-analysis-item";
import {
  Link2,
  Plus,
  ExternalLink,
  Type,
  BarChart3,
  FileText,
  User,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import type { ContentStats } from "@/src/shared/domain/types/cms";
import type { Author } from "@/src/shared/domain/types/@cms-author";
import { useAsset } from "@/src/shared/hooks/cms/use-assets";
import { BlogImageInsertDialog } from "@/src/presentation/components/organisms/cms/editor/blog-image-insert-dialog";

const POWER_WORDS = [
  "ultimate",
  "essential",
  "proven",
  "exclusive",
  "definitive",
  "complete",
  "powerful",
  "incredible",
  "remarkable",
  "breakthrough",
  "revolutionary",
  "guaranteed",
  "secret",
  "instant",
  "massive",
  "epic",
  "brilliant",
];

const POSITIVE_WORDS = [
  "complete",
  "guide",
  "best",
  "top",
  "easy",
  "simple",
  "effective",
  "powerful",
  "amazing",
  "great",
  "perfect",
  "smart",
  "innovative",
  "advanced",
  "comprehensive",
  "expert",
  "professional",
  "master",
];

interface SeoSidebarProps {
  onHighlightEditorSection?: (section: string | null) => void;
  contentStats?: ContentStats;
  focusKeyword?: string;
  onFocusKeywordChange?: (keyword: string) => void;
  metaTitle?: string;
  onMetaTitleChange?: (title: string) => void;
  metaDescription?: string;
  onMetaDescriptionChange?: (description: string) => void;
  displayTitle?: string;
  onDisplayTitleChange?: (title: string) => void;
  slug?: string;
  onSlugChange?: (slug: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  blogId?: string | number;
  selectedAuthorId?: string;
  onAuthorChange?: (authorId: string) => void;
  coverImageId?: string;
  onCoverImageChange?: (assetId: string) => void;
  authors?: Author[];
  isLoadingAuthors?: boolean;
  isDisabled?: boolean;
}

export function SeoSidebar({
  onHighlightEditorSection,
  contentStats,
  focusKeyword = "",
  onFocusKeywordChange,
  metaTitle,
  onMetaTitleChange,
  metaDescription,
  onMetaDescriptionChange,
  displayTitle,
  onDisplayTitleChange,
  slug,
  onSlugChange,
  language = "en_us",
  onLanguageChange,
  blogId,
  selectedAuthorId,
  onAuthorChange,
  coverImageId,
  onCoverImageChange,
  authors,
  isLoadingAuthors,
  isDisabled,
}: SeoSidebarProps) {
  const [localUrlSlug, setLocalUrlSlug] = useState("");
  const [localSeoTitle, setLocalSeoTitle] = useState("");
  const [localMetaDesc, setLocalMetaDesc] = useState("");
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  // Use parent-controlled metaTitle if provided, otherwise local state
  const seoTitle = metaTitle !== undefined ? metaTitle : localSeoTitle;
  const setSeoTitle = (value: string) => {
    if (onMetaTitleChange) {
      onMetaTitleChange(value);
    } else {
      setLocalSeoTitle(value);
    }
  };

  // Use parent-controlled slug if provided, otherwise local state
  const urlSlug = slug !== undefined ? slug : localUrlSlug;
  const setUrlSlug = (value: string) => {
    if (onSlugChange) {
      onSlugChange(value);
    } else {
      setLocalUrlSlug(value);
    }
  };

  // Use parent-controlled metaDescription if provided, otherwise local state
  const metaDesc =
    metaDescription !== undefined ? metaDescription : localMetaDesc;
  const setMetaDesc = (value: string) => {
    if (onMetaDescriptionChange) {
      onMetaDescriptionChange(value);
    } else {
      setLocalMetaDesc(value);
    }
  };

  const authorOptions = authors ?? [];
  const { data: coverAsset, isLoading: isLoadingCoverAsset } = useAsset(
    coverImageId ?? "",
  );

  // Check if we have any content
  const hasContent = (contentStats?.wordCount ?? 0) > 0;
  const isEmpty = !hasContent && !focusKeyword;

  const kw = focusKeyword.toLowerCase().trim();
  const kwSlug = kw.replace(/\s+/g, "-");

  // --- Derived reactive checks ---

  // Basic SEO checks
  const kwInTitle = kw ? seoTitle.toLowerCase().includes(kw) : false;
  const kwInMeta = kw ? metaDesc.toLowerCase().includes(kw) : false;
  const kwInUrl = kw ? urlSlug.toLowerCase().includes(kwSlug) : false;
  const kwInFirst10 = contentStats?.keywordInFirstTenPercent ?? false;
  const kwInContent = (contentStats?.keywordCount ?? 0) > 0;
  const wordCount = contentStats?.wordCount ?? 0;

  const basicSeoChecks = [
    kwInTitle,
    kwInMeta,
    kwInUrl,
    kwInFirst10,
    kwInContent,
    wordCount >= 1500,
  ];
  const basicSeoErrors = basicSeoChecks.filter((c) => !c).length;
  const basicSeoStatus =
    basicSeoErrors === 0
      ? "success"
      : basicSeoErrors <= 2
        ? "warning"
        : "error";

  // Additional checks
  const kwInSubheadings = contentStats?.keywordInSubheadings ?? false;
  const kwInImageAlt = contentStats?.keywordInImageAlt ?? false;
  const kwDensity = contentStats?.keywordDensity ?? 0;
  const kwCount = contentStats?.keywordCount ?? 0;
  const urlTooLong = urlSlug.length > 75;
  const hasExternalLinks = contentStats?.hasExternalLinks ?? false;
  const hasInternalLinks = contentStats?.hasInternalLinks ?? false;
  const densityOk = kwDensity >= 0.5 && kwDensity <= 2.5;

  const additionalChecks = [
    kwInSubheadings,
    kwInImageAlt,
    densityOk,
    !urlTooLong,
    hasExternalLinks,
    hasInternalLinks,
  ];
  const additionalErrors = additionalChecks.filter((c) => !c).length;
  const additionalStatus = additionalErrors === 0 ? "success" : "error";

  // Title readability checks
  const kwAtStart = seoTitle.toLowerCase().startsWith(kw);
  const titleWords = seoTitle.toLowerCase().split(/\s+/);
  const hasPowerWord = titleWords.some((w) => POWER_WORDS.includes(w));
  const hasPositiveSentiment = titleWords.some((w) =>
    POSITIVE_WORDS.includes(w),
  );
  const titleLength = seoTitle.length;
  const titleLengthOk = titleLength >= 30 && titleLength <= 60;

  const titleChecks = [
    kwAtStart,
    hasPositiveSentiment,
    hasPowerWord,
    titleLengthOk,
  ];
  const titleWarnings = titleChecks.filter((c) => !c).length;
  const titleStatus = titleWarnings === 0 ? "success" : "warning";

  // Content readability checks
  const shortParagraphs = contentStats?.shortParagraphs ?? true;
  const hasImages = contentStats?.hasImages ?? false;

  const readabilityChecks = [shortParagraphs, hasImages];
  const readabilityWarnings = readabilityChecks.filter((c) => !c).length;
  const readabilityStatus = readabilityWarnings === 0 ? "success" : "warning";

  // Compute live score
  const score = useMemo(() => {
    let s = 0;
    // Basic SEO (60 pts)
    if (kwInTitle) s += 10;
    if (kwInMeta) s += 10;
    if (kwInUrl) s += 10;
    if (kwInFirst10) s += 10;
    if (kwInContent) s += 10;
    if (wordCount >= 1500) s += 10;
    // Additional (25 pts)
    if (kwInSubheadings) s += 5;
    if (densityOk) s += 5;
    if (!urlTooLong) s += 5;
    if (hasExternalLinks) s += 5;
    if (hasInternalLinks) s += 5;
    // Title readability (10 pts)
    if (kwAtStart) s += 3;
    if (hasPositiveSentiment) s += 3;
    if (hasPowerWord) s += 2;
    if (titleLengthOk) s += 2;
    // Content readability (5 pts)
    if (shortParagraphs) s += 3;
    if (hasImages) s += 2;
    return Math.min(100, s);
  }, [
    kwInTitle,
    kwInMeta,
    kwInUrl,
    kwInFirst10,
    kwInContent,
    wordCount,
    kwInSubheadings,
    densityOk,
    urlTooLong,
    hasExternalLinks,
    hasInternalLinks,
    kwAtStart,
    hasPositiveSentiment,
    hasPowerWord,
    titleLengthOk,
    shortParagraphs,
    hasImages,
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full flex flex-col overflow-hidden">
        {/* Sticky Score Header */}
        <div className="shrink-0 p-3 border-b border-border">
          <ScoreCard
            score={score}
            focusKeyword={focusKeyword}
            onKeywordChange={onFocusKeywordChange ?? (() => {})}
          />
        </div>

        <div className="shrink-0 p-3 space-y-2.5 border-b border-border bg-content1/70">
          <Input
            label="Display Title"
            placeholder="Enter article title..."
            value={displayTitle ?? ""}
            onChange={(e) => onDisplayTitleChange?.(e.target.value)}
            isDisabled={isDisabled}
            maxLength={255}
            variant="bordered"
            size="sm"
            startContent={
              <FileText className="w-4 h-4 text-muted-foreground" />
            }
            classNames={{
              input: "font-semibold",
              inputWrapper:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              label: "text-muted-foreground",
            }}
            description={`${(displayTitle ?? "").length}/255`}
          />

          <Select
            label="Author"
            placeholder="Select an author"
            selectedKeys={selectedAuthorId ? [selectedAuthorId] : []}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0]?.toString() ?? "";
              onAuthorChange?.(selected);
            }}
            isDisabled={isDisabled || isLoadingAuthors}
            isLoading={isLoadingAuthors}
            variant="bordered"
            size="sm"
            startContent={<User className="w-4 h-4 text-muted-foreground" />}
            classNames={{
              trigger:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              value: "text-foreground",
              label: "text-muted-foreground",
              popoverContent: "bg-content1 border border-border",
            }}
            renderValue={(items) =>
              items.map((item) => {
                const author = authorOptions.find(
                  (entry) => entry.id === item.key,
                );

                if (!author) {
                  return <span key={item.key}>{item.textValue}</span>;
                }

                return (
                  <div key={author.id} className="flex items-center gap-2">
                    <Avatar
                      src={author.avatar_url ?? author.avatar?.url ?? undefined}
                      name={`${author.firstName} ${author.lastName}`}
                      className="h-6 w-6 text-[10px]"
                    />
                    <span>
                      {author.firstName} {author.lastName}
                    </span>
                  </div>
                );
              })
            }
          >
            {authorOptions.map((author) => (
              <SelectItem
                key={author.id}
                textValue={`${author.firstName} ${author.lastName}`}
              >
                <div className="flex items-center gap-2">
                  <Avatar
                    src={author.avatar_url ?? author.avatar?.url ?? undefined}
                    name={`${author.firstName} ${author.lastName}`}
                    className="h-7 w-7 text-xs"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">
                      {author.firstName} {author.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {author.biography?.trim() || "Author profile"}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </Select>

          <div className="rounded-lg border border-border bg-default-100/70 p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Cover Image
                </div>
                <div className="text-xs text-muted-foreground">
                  Associates coverImageId on the article payload using the same
                  blog collection.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  startContent={<ImageIcon className="h-4 w-4" />}
                  onPress={() => setCoverPickerOpen(true)}
                  isDisabled={isDisabled || !blogId}
                >
                  {coverImageId ? "Change" : "Select"}
                </Button>
                {coverImageId && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => onCoverImageChange?.("")}
                    isDisabled={isDisabled}
                    aria-label="Remove cover image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {coverAsset ? (
              <div className="space-y-2">
                <img
                  src={coverAsset.url}
                  alt={coverAsset.alt_text || coverAsset.filename}
                  className="h-36 w-full rounded-md object-cover"
                />
                <div className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground truncate">
                    {coverAsset.filename}
                  </div>
                  <div>{coverAsset.id}</div>
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                {isLoadingCoverAsset && coverImageId
                  ? "Loading cover image..."
                  : blogId
                    ? "No cover image selected"
                    : "Select a blog first to use the blog media library"}
              </div>
            )}
          </div>

          <Input
            label="SEO Title"
            placeholder="SEO-optimized title..."
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            isDisabled={isDisabled}
            maxLength={60}
            variant="bordered"
            size="sm"
            startContent={<Type className="w-4 h-4 text-muted-foreground" />}
            classNames={{
              inputWrapper:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              label: "text-muted-foreground",
            }}
            description={`${titleLength}/60${titleLength > 60 ? " - too long" : titleLength > 0 && titleLength < 30 ? " - too short" : ""}`}
          />

          <Textarea
            label="Meta Description"
            placeholder="Write a compelling meta description..."
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            isDisabled={isDisabled}
            minRows={3}
            maxRows={5}
            variant="bordered"
            size="sm"
            classNames={{
              inputWrapper:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              label: "text-muted-foreground",
            }}
            description={`${metaDesc.length}/160${metaDesc.length > 160 ? " - too long" : ""}`}
          />

          <Input
            label="URL Slug"
            placeholder="article-url-slug"
            value={urlSlug}
            onChange={(e) => setUrlSlug(e.target.value)}
            isDisabled={isDisabled}
            maxLength={255}
            variant="bordered"
            size="sm"
            startContent={<Link2 className="w-4 h-4 text-muted-foreground" />}
            classNames={{
              inputWrapper:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              label: "text-muted-foreground",
            }}
            description={`${urlSlug.length} characters${urlTooLong ? " - aim for under 75" : ""}`}
          />

          <Input
            label="Language"
            placeholder="en_us"
            value={language}
            onChange={(e) => onLanguageChange?.(e.target.value.toLowerCase())}
            isDisabled={isDisabled}
            maxLength={5}
            variant="bordered"
            size="sm"
            classNames={{
              inputWrapper:
                "border-border bg-default-100/70 data-[hover=true]:border-primary/50",
              label: "text-muted-foreground",
            }}
            description="Use lowercase locale format like en_us or pt_br"
          />
        </div>

        {/* Empty State */}
        {isEmpty && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3 max-w-xs">
              <div className="w-16 h-16 rounded-full bg-default-100/50 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Start Writing
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Add a focus keyword and start writing content to see SEO
                  analysis and recommendations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content State */}
        {!isEmpty && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {/* Live Stats Bar */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-default-100 border border-border rounded-lg text-center">
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {wordCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground">words</span>
              </div>
              <div className="flex flex-col items-center border-x border-border">
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {kwCount}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  keywords
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-foreground tabular-nums">
                  {kwDensity.toFixed(2)}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  density
                </span>
              </div>
            </div>

            {/* Internal & External Links manager section */}
            <div className="p-3 bg-default-100 border border-border rounded-lg space-y-3">
              {/* Internal Links */}
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  Internal Links
                  <span
                    className={`ml-auto text-[10px] font-semibold tabular-nums ${hasInternalLinks ? "text-green-500" : "text-muted-foreground"}`}
                  >
                    {contentStats?.internalLinks?.length ?? 0}
                  </span>
                </label>
                {(contentStats?.internalLinks?.length ?? 0) > 0 ? (
                  <div className="mt-2 space-y-1">
                    {contentStats!.internalLinks.map((link, i) => (
                      <div
                        key={`internal-${i}`}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs bg-default-100 rounded border border-border group"
                      >
                        <Link2 className="h-3 w-3 shrink-0 text-green-500" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-foreground font-medium truncate">
                            {link.text || "Untitled"}
                          </span>
                          <span className="text-muted-foreground truncate text-[10px]">
                            {link.url}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No internal links detected. Link to your other content to
                    improve SEO.
                  </p>
                )}
              </div>

              {/* External Links */}
              <div className="pt-2 border-t border-border">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  External Links
                  <span
                    className={`ml-auto text-[10px] font-semibold tabular-nums ${hasExternalLinks ? "text-blue-500" : "text-muted-foreground"}`}
                  >
                    {contentStats?.externalLinks?.length ?? 0}
                  </span>
                </label>
                {(contentStats?.externalLinks?.length ?? 0) > 0 ? (
                  <div className="mt-2 space-y-1">
                    {contentStats!.externalLinks.map((link, i) => (
                      <div
                        key={`external-${i}`}
                        className="flex items-center gap-2 px-2 py-1.5 text-xs bg-default-100 rounded border border-border group"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0 text-blue-500" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-foreground font-medium truncate">
                            {link.text || "Untitled"}
                          </span>
                          <span className="text-muted-foreground truncate text-[10px]">
                            {link.url}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No external links found. Link to authoritative sources.
                  </p>
                )}
              </div>
            </div>

            {/* Analysis Accordions */}
            <Accordion
              type="multiple"
              defaultValue={[
                "basic-seo",
                "additional",
                "title-readability",
                "content-readability",
              ]}
              className="space-y-2"
            >
              {/* Basic SEO Section */}
              <AccordionItem
                value="basic-seo"
                className="border border-border rounded-lg bg-default-100 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium text-foreground">
                      Basic SEO
                    </span>
                    <SectionBadge
                      variant={
                        basicSeoStatus as "success" | "warning" | "error"
                      }
                    >
                      {basicSeoErrors === 0
                        ? "All Good"
                        : `${basicSeoErrors} Issue${basicSeoErrors > 1 ? "s" : ""}`}
                    </SectionBadge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-0.5">
                    <SeoAnalysisItem
                      status={kwInTitle ? "success" : "error"}
                      tooltip="Having the focus keyword in your SEO title helps search engines understand what your page is about."
                      onHover={() =>
                        !kwInTitle && onHighlightEditorSection?.("title")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwInTitle
                        ? "Focus Keyword used in the SEO Title."
                        : "Focus Keyword is missing from the SEO Title."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={kwInMeta ? "success" : "error"}
                      tooltip="Including the keyword in the meta description improves click-through rates from search results."
                    >
                      {kwInMeta
                        ? "Focus Keyword used inside SEO Meta Description."
                        : "Focus Keyword is missing from the Meta Description."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={kwInUrl ? "success" : "error"}
                      tooltip="Keywords in the URL signal relevance to search engines and users."
                      onHover={() =>
                        !kwInUrl && onHighlightEditorSection?.("url")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwInUrl
                        ? "Focus Keyword used in the URL."
                        : "Focus Keyword is missing from the URL."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={kwInFirst10 ? "success" : "warning"}
                      tooltip="Placing the keyword early in content signals its importance to search engines."
                      onHover={() =>
                        !kwInFirst10 && onHighlightEditorSection?.("content")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwInFirst10
                        ? "Focus Keyword appears in the first 10% of the content."
                        : "Focus Keyword doesn't appear in the first 10% of content."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={kwInContent ? "success" : "error"}
                      tooltip="Your content should naturally include the focus keyword."
                      onHover={() =>
                        !kwInContent && onHighlightEditorSection?.("content")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwInContent
                        ? "Focus Keyword found in the content."
                        : "Focus Keyword not found in the content."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={
                        wordCount >= 1500
                          ? "success"
                          : wordCount >= 800
                            ? "warning"
                            : "error"
                      }
                      tooltip="Long-form content typically ranks better for competitive keywords. Aim for 1,500+ words."
                    >
                      Content is{""}
                      <span className="font-semibold text-foreground">
                        {wordCount.toLocaleString()}
                      </span>
                      {""}
                      words long.{""}
                      {wordCount >= 1500
                        ? "Good job!"
                        : wordCount >= 800
                          ? "Consider adding more."
                          : "Very short content."}
                    </SeoAnalysisItem>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Additional Section */}
              <AccordionItem
                value="additional"
                className="border border-border rounded-lg bg-default-100 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium text-foreground">
                      Additional
                    </span>
                    <SectionBadge
                      variant={additionalStatus as "success" | "error"}
                    >
                      {additionalErrors === 0
                        ? "All Good"
                        : `${additionalErrors} Error${additionalErrors > 1 ? "s" : ""}`}
                    </SectionBadge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-0.5">
                    <SeoAnalysisItem
                      status={kwInSubheadings ? "success" : "error"}
                      tooltip="Keywords in subheadings help structure your content and improve SEO."
                      onHover={() =>
                        !kwInSubheadings &&
                        onHighlightEditorSection?.("content")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwInSubheadings
                        ? "Focus Keyword found in the subheading(s)."
                        : "Focus Keyword missing from subheadings."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={kwInImageAlt ? "success" : "warning"}
                      tooltip="Alt attributes help search engines understand images and improve accessibility."
                    >
                      {kwInImageAlt
                        ? "Focus Keyword found in image alt attribute(s)."
                        : hasImages
                          ? "Focus Keyword missing from image alt attributes."
                          : "No images found. Add images with keyword-rich alt text."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={
                        densityOk
                          ? "success"
                          : kwDensity > 0
                            ? "warning"
                            : "error"
                      }
                      tooltip="Optimal keyword density is between 0.5% and 2.5%."
                    >
                      Keyword Density is{""}
                      <span
                        className={`font-bold ${densityOk ? "text-green-500" : "text-yellow-500"}`}
                      >
                        {kwDensity.toFixed(2)}%
                      </span>
                      , the Focus Keyword appears{""}
                      <span
                        className={`font-bold ${densityOk ? "text-green-500" : "text-yellow-500"}`}
                      >
                        {kwCount} times
                      </span>
                      .
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={urlTooLong ? "error" : "success"}
                      tooltip="Shorter URLs are easier to share and rank better. Aim for under 75 characters."
                      onHover={() =>
                        urlTooLong && onHighlightEditorSection?.("url")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {urlTooLong ? (
                        <>
                          URL is{""}
                          <span className="font-semibold text-red-500">
                            {urlSlug.length} characters
                          </span>
                          {""}
                          long. Consider shortening it.
                        </>
                      ) : (
                        <>
                          URL length is{""}
                          <span className="font-semibold text-green-500">
                            {urlSlug.length} characters
                          </span>
                          . Good job!
                        </>
                      )}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={hasExternalLinks ? "success" : "error"}
                      tooltip="External DoFollow links show search engines you reference authoritative sources."
                    >
                      {hasExternalLinks
                        ? "At least one external link with DoFollow found in your content."
                        : "No external links found. Link to authoritative sources."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={hasInternalLinks ? "success" : "error"}
                      tooltip="Internal links help search engines discover other content and keep users engaged."
                      onHover={() =>
                        !hasInternalLinks &&
                        onHighlightEditorSection?.("content")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {hasInternalLinks
                        ? "Internal links found in your content."
                        : "No internal links found. Link to your other content."}
                    </SeoAnalysisItem>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Title Readability Section */}
              <AccordionItem
                value="title-readability"
                className="border border-border rounded-lg bg-default-100 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium text-foreground">
                      Title Readability
                    </span>
                    <SectionBadge
                      variant={titleStatus as "success" | "warning"}
                    >
                      {titleWarnings === 0
                        ? "All Good"
                        : `${titleWarnings} Warning${titleWarnings > 1 ? "s" : ""}`}
                    </SectionBadge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-0.5">
                    <SeoAnalysisItem
                      status={kwAtStart ? "success" : "warning"}
                      tooltip="Keywords at the beginning of titles carry more weight in search rankings."
                      onHover={() =>
                        !kwAtStart && onHighlightEditorSection?.("title")
                      }
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {kwAtStart
                        ? "Focus Keyword at the beginning of the SEO Title."
                        : "Focus Keyword is not at the beginning of the SEO Title."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={hasPositiveSentiment ? "success" : "warning"}
                      tooltip="Positive sentiment in titles can increase click-through rates."
                    >
                      {hasPositiveSentiment
                        ? "Your title has a positive sentiment."
                        : "Your title lacks positive sentiment words. Consider adding one."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={hasPowerWord ? "success" : "warning"}
                      tooltip="Power words like'Ultimate','Essential','Proven', or'Exclusive' trigger emotional responses and improve CTR."
                      onHover={() => onHighlightEditorSection?.("title")}
                      onLeave={() => onHighlightEditorSection?.(null)}
                    >
                      {hasPowerWord
                        ? "Your title contains a Power Word."
                        : "Your title does not contain a Power Word. Add one to increase CTR."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={titleLengthOk ? "success" : "warning"}
                      tooltip="SEO titles between 30-60 characters are optimal. Too short misses opportunities, too long gets truncated."
                    >
                      {titleLengthOk
                        ? `Title length is ${titleLength} characters. Optimal!`
                        : titleLength < 30
                          ? `Title is ${titleLength} characters. Too short - aim for 30-60.`
                          : `Title is ${titleLength} characters. Too long - aim for 30-60.`}
                    </SeoAnalysisItem>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Content Readability Section */}
              <AccordionItem
                value="content-readability"
                className="border border-border rounded-lg bg-default-100 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium text-foreground">
                      Content Readability
                    </span>
                    <SectionBadge
                      variant={readabilityStatus as "success" | "warning"}
                    >
                      {readabilityWarnings === 0
                        ? "All Good"
                        : `${readabilityWarnings} Warning${readabilityWarnings > 1 ? "s" : ""}`}
                    </SectionBadge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <div className="space-y-0.5">
                    <SeoAnalysisItem
                      status={shortParagraphs ? "success" : "warning"}
                      tooltip="Short paragraphs improve readability and keep users engaged."
                    >
                      {shortParagraphs
                        ? "You seem to be using short paragraphs."
                        : "Some paragraphs are too long. Consider breaking them up."}
                    </SeoAnalysisItem>
                    <SeoAnalysisItem
                      status={hasImages ? "success" : "warning"}
                      tooltip="Visual content increases engagement and time on page, which helps SEO."
                    >
                      {hasImages
                        ? "Your content contains images and/or videos."
                        : "Consider adding images or videos to your content."}
                    </SeoAnalysisItem>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </div>

      <BlogImageInsertDialog
        open={coverPickerOpen}
        onOpenChange={setCoverPickerOpen}
        onSelectAsset={(asset) => onCoverImageChange?.(asset.id)}
        blogId={blogId}
        title="Select Cover Image"
        insertLabel="Use as Cover"
        allowExternalUrl={false}
      />
    </TooltipProvider>
  );
}
