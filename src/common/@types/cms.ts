export interface ContentStats {
  wordCount: number;
  headings: Array<{ type: string; text: string }>;
  hasImages: boolean;
  hasExternalLinks: boolean;
  hasInternalLinks: boolean;
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
