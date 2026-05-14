export interface ContentStats {
  wordCount: number;
  headings: Array<{ type: string; text: string }>;
  hasImages: boolean;
  hasExternalLinks: boolean;
  hasInternalLinks: boolean;
  /** All external link URLs found in the content */
  externalLinks: Array<{ url: string; text: string }>;
  /** All internal link URLs found in the content */
  internalLinks: Array<{ url: string; text: string }>;
  keywordCount: number;
  keywordDensity: number;
  keywordInFirstTenPercent: boolean;
  keywordInSubheadings: boolean;
  keywordInImageAlt: boolean;
  shortParagraphs: boolean;
  plainText: string;
  metaDescription: string;
  content: string;
}
