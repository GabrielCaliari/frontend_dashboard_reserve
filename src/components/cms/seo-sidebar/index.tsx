"use client";

import { useState, useMemo } from "react";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/components/ui/accordion";
import { ScoreCard } from "./score-card";
import { SectionBadge } from "./section-badge";
import { SeoAnalysisItem } from "./seo-analysis-item";
import { Link2, Plus, ExternalLink, Type, BarChart3 } from "lucide-react";
import type { ContentStats } from "@/src/types/cms";

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
}

export function SeoSidebar({
  onHighlightEditorSection,
  contentStats,
  focusKeyword = "Agentic Workflow",
  onFocusKeywordChange,
}: SeoSidebarProps) {
  const [urlSlug, setUrlSlug] = useState(
    "agentic-workflow-complete-guide-ai-agent-automation-2024-best-practices",
  );
  const [seoTitle, setSeoTitle] = useState(
    "Agentic Workflow: The Complete Guide to AI Agent Automation",
  );
  const [metaDesc, setMetaDesc] = useState(
    "Learn how agentic workflows transform AI automation. This complete guide covers agent architecture, implementation best practices, and the future of intelligent workflows.",
  );

  const kw = focusKeyword.toLowerCase();
  const kwSlug = kw.replace(/\s+/g, "-");

  // --- Derived reactive checks ---

  // Basic SEO checks
  const kwInTitle = seoTitle.toLowerCase().includes(kw);
  const kwInMeta = metaDesc.toLowerCase().includes(kw);
  const kwInUrl = urlSlug.toLowerCase().includes(kwSlug);
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
      <div className="w-80 h-full bg-background border-l border-border flex flex-col overflow-hidden">
        {/* Sticky Score Header */}
        <div className="shrink-0 p-4 border-b border-border">
          <ScoreCard
            score={score}
            focusKeyword={focusKeyword}
            onKeywordChange={onFocusKeywordChange ?? (() => {})}
          />
        </div>

        {/* Scrollable Analysis Sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Live Stats Bar */}
          <div className="flex items-center gap-3 p-2.5 bg-secondary/50 border border-border rounded-lg">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
              <span>
                <span className="font-semibold text-foreground">
                  {wordCount.toLocaleString()}
                </span>{" "}
                words
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-semibold text-foreground">{kwCount}</span>{" "}
                keywords
              </span>
              <span className="text-border">|</span>
              <span>
                <span className="font-semibold text-foreground">
                  {kwDensity.toFixed(2)}%
                </span>{" "}
                density
              </span>
            </div>
          </div>

          {/* SEO Title input section */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <Type className="h-3 w-3" />
              SEO Title (H1)
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full mt-2 px-2 py-1.5 text-sm bg-card border border-input rounded text-card-foreground outline-none focus:border-ring transition-colors font-medium"
            />
            <p
              className={`mt-1.5 text-xs ${titleLength > 60 ? "text-yellow-500" : titleLength < 30 ? "text-yellow-500" : "text-muted-foreground"}`}
            >
              {titleLength}/60 characters
              {titleLength > 60 && " - too long"}
              {titleLength < 30 && titleLength > 0 && " - too short"}
            </p>
          </div>

          {/* Meta Description */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Meta Description
            </label>
            <textarea
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              rows={3}
              className="w-full mt-2 px-2 py-1.5 text-xs bg-card border border-input rounded text-card-foreground outline-none focus:border-ring transition-colors resize-none leading-relaxed"
            />
            <p
              className={`mt-1.5 text-xs ${metaDesc.length > 160 ? "text-yellow-500" : metaDesc.length < 120 ? "text-muted-foreground" : "text-green-500"}`}
            >
              {metaDesc.length}/160 characters
              {metaDesc.length > 160 && " - too long"}
            </p>
          </div>

          {/* URL Slug input section */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <Link2 className="h-3 w-3" />
              URL Slug
            </label>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-muted-foreground truncate">
                yourdomain.com/blog/
              </span>
            </div>
            <input
              type="text"
              value={urlSlug}
              onChange={(e) => setUrlSlug(e.target.value)}
              className="w-full mt-1 px-2 py-1.5 text-xs bg-card border border-input rounded text-card-foreground outline-none focus:border-ring transition-colors"
            />
            <p
              className={`mt-1.5 text-xs ${urlTooLong ? "text-red-500" : "text-muted-foreground"}`}
            >
              {urlSlug.length} characters
              {urlTooLong ? " - aim for under 75" : ""}
            </p>
          </div>

          {/* Internal Links manager section */}
          <div className="p-3 bg-secondary/50 border border-border rounded-lg">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <ExternalLink className="h-3 w-3" />
              Internal Links
            </label>
            <p
              className={`mt-2 text-xs ${hasInternalLinks ? "text-green-500" : "text-muted-foreground"}`}
            >
              {hasInternalLinks
                ? "Internal links detected."
                : "No internal links detected."}
            </p>
            <div className="mt-3 space-y-2">
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-card border border-input text-card-foreground rounded hover:bg-accent hover:border-ring transition-colors">
                <Plus className="h-3 w-3" />
                Add Internal Link
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Suggested links:
              </p>
              <div className="space-y-1.5">
                <button className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground bg-card/50 rounded hover:bg-accent hover:text-accent-foreground transition-colors truncate">
                  /blog/ai-agents-explained
                </button>
                <button className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground bg-card/50 rounded hover:bg-accent hover:text-accent-foreground transition-colors truncate">
                  /blog/automation-best-practices
                </button>
              </div>
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
              className="border border-border rounded-lg bg-card/50 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="text-sm font-medium text-foreground">
                    Basic SEO
                  </span>
                  <SectionBadge
                    variant={basicSeoStatus as "success" | "warning" | "error"}
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
                    Content is{" "}
                    <span className="font-semibold text-foreground">
                      {wordCount.toLocaleString()}
                    </span>{" "}
                    words long.{" "}
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
              className="border border-border rounded-lg bg-card/50 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
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
                      !kwInSubheadings && onHighlightEditorSection?.("content")
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
                    Keyword Density is{" "}
                    <span
                      className={`font-bold ${densityOk ? "text-green-500" : "text-yellow-500"}`}
                    >
                      {kwDensity.toFixed(2)}%
                    </span>
                    , the Focus Keyword appears{" "}
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
                        URL is{" "}
                        <span className="font-semibold text-red-500">
                          {urlSlug.length} characters
                        </span>{" "}
                        long. Consider shortening it.
                      </>
                    ) : (
                      <>
                        URL length is{" "}
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
                      !hasInternalLinks && onHighlightEditorSection?.("content")
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
              className="border border-border rounded-lg bg-card/50 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="text-sm font-medium text-foreground">
                    Title Readability
                  </span>
                  <SectionBadge variant={titleStatus as "success" | "warning"}>
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
                    tooltip="Power words like 'Ultimate', 'Essential', 'Proven', or 'Exclusive' trigger emotional responses and improve CTR."
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
              className="border border-border rounded-lg bg-card/50 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent/50 [&[data-state=open]]:border-b [&[data-state=open]]:border-border">
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
      </div>
    </TooltipProvider>
  );
}
