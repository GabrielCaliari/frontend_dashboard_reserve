import type { Value } from "platejs";
import type { Chapter } from "./editor-types";
import type { ContentStats } from "@/src/common/@types/cms";

export const EMPTY_SLATE_VALUE: Value = [
  { type: "p", children: [{ text: "" }] },
];

const headingLevelMap: Record<string, number> = { h1: 1, h2: 2, h3: 3 };

function getHeadingText(node: any): string {
  return (node.children as Array<{ text?: string }>)
    .map((c) => c.text || "")
    .join("")
    .trim();
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "heading";
}

// ---------------------------------------------------------------------------
// HTML parser (used only for legacy HTML initial content)
// ---------------------------------------------------------------------------

export function parseHtmlToSlate(html: string): Value {
  if (!html || !html.trim()) return EMPTY_SLATE_VALUE;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes: any[] = [];

  function parseNode(domNode: Node): any {
    if (domNode.nodeType === Node.TEXT_NODE) {
      return { text: domNode.textContent || "" };
    }

    if (domNode.nodeType !== Node.ELEMENT_NODE) return { text: "" };

    const el = domNode as Element;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).flatMap(parseNode);

    // Inline marks — spread into parent children list
    const markMap: Record<string, string> = {
      strong: "bold", b: "bold",
      em: "italic", i: "italic",
      u: "underline",
      s: "strikethrough", del: "strikethrough", strike: "strikethrough",
      code: "code",
    };
    if (markMap[tag]) {
      return children.map((c: any) => ({ ...c, [markMap[tag]]: true }));
    }

    const safeChildren = children.length > 0 ? children : [{ text: "" }];

    const blockMap: Record<string, string> = {
      h1: "h1", h2: "h2", h3: "h3",
      blockquote: "blockquote",
      ul: "ul", ol: "ol", li: "li",
      p: "p", div: "p",
    };
    if (blockMap[tag]) {
      return { type: blockMap[tag], children: safeChildren };
    }
    if (tag === "img") {
      return {
        type: "img",
        url: el.getAttribute("src") || "",
        alt: el.getAttribute("alt") || "",
        children: [{ text: "" }],
      };
    }
    if (tag === "a") {
      return { type: "a", url: el.getAttribute("href") || "", children: safeChildren };
    }
    if (tag === "br") return { text: "\n" };

    return children;
  }

  Array.from(doc.body.childNodes).forEach((node) => {
    const result = parseNode(node);
    if (Array.isArray(result)) {
      if (result.length > 0) nodes.push({ type: "p", children: result });
    } else if (result?.type) {
      nodes.push(result);
    } else if (result?.text) {
      nodes.push({ type: "p", children: [result] });
    }
  });

  return nodes.length > 0 ? nodes : EMPTY_SLATE_VALUE;
}

// ---------------------------------------------------------------------------
// Chapter extraction
// ---------------------------------------------------------------------------

export function extractChapters(value: Value): Chapter[] {
  if (!Array.isArray(value)) return [];

  const chapters = value.reduce<Chapter[]>((acc, node, index) => {
    if (node.type === "h1" || node.type === "h2" || node.type === "h3") {
      const title = getHeadingText(node);
      const slug = slugifyHeading(title);
      const order = acc.length;
      const anchorId = (node as any).id || `heading-${order}-${slug}`;
      acc.push({
        id: `chapter-${index}`,
        anchorId,
        title,
        type: node.type,
        order,
        hasChildren: false,
        collapsed: false,
      });
    }
    return acc;
  }, []);

  return chapters.map((chapter, idx) => {
    const next = chapters[idx + 1];
    const currentLevel = headingLevelMap[chapter.type] || 0;
    const nextLevel = next ? headingLevelMap[next.type] || 0 : 0;
    return {
      ...chapter,
      hasChildren: next ? nextLevel > currentLevel : false,
    };
  });
}

// ---------------------------------------------------------------------------
// Markdown strip (for keyword analysis when markdown is source of truth)
// ---------------------------------------------------------------------------

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\*\*|__|~~|[*_]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Content analysis from Slate value
// ---------------------------------------------------------------------------

export function analyzeContent(
  value: Value,
  keyword: string,
  mdContent?: string,
): ContentStats {
  const keywordLower = keyword.toLowerCase().trim();
  let plainText = "";
  const headings: ContentStats["headings"] = [];
  let keywordInSubheadings = false;

  for (const node of value as any[]) {
    const nodeText = (node.children as Array<{ text?: string }>)
      ?.map((c) => c.text || "")
      .join("") ?? "";

    if (node.type === "h1" || node.type === "h2" || node.type === "h3") {
      headings.push({ type: node.type, text: nodeText });
      if (
        (node.type === "h2" || node.type === "h3") &&
        keywordLower &&
        nodeText.toLowerCase().includes(keywordLower)
      ) {
        keywordInSubheadings = true;
      }
    }
    plainText += nodeText + " ";
  }

  plainText = plainText.trim();
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const keywordCount = keywordLower
    ? (plainText.toLowerCase().match(new RegExp(keywordLower, "gi")) || []).length
    : 0;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const firstTenPercent = words.slice(0, Math.ceil(wordCount * 0.1)).join(" ").toLowerCase();
  const keywordInFirstTenPercent = keywordLower
    ? firstTenPercent.includes(keywordLower)
    : false;

  const paragraphs = (value as any[]).filter((n) => n.type === "p");
  const shortParagraphs = paragraphs.every((p: any) => {
    const text = (p.children as Array<{ text?: string }>)
      ?.map((c) => c.text || "")
      .join("") ?? "";
    return text.split(/\s+/).filter(Boolean).length < 120;
  });

  const firstParagraph = (value as any[]).find((n) => n.type === "p");
  const metaDescription = firstParagraph
    ? (firstParagraph.children as Array<{ text?: string }>)
        ?.map((c) => c.text || "")
        .join("")
        .slice(0, 160) ?? ""
    : "";

  return {
    wordCount,
    headings,
    hasImages: (value as any[]).some((n) => n.type === "img"),
    hasExternalLinks: /https?:\/\//.test(plainText),
    hasInternalLinks: false,
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInFirstTenPercent,
    keywordInSubheadings,
    keywordInImageAlt: keywordLower
      ? (value as any[]).some(
          (n) => n.type === "img" && (n.alt || "").toLowerCase().includes(keywordLower),
        )
      : false,
    shortParagraphs,
    plainText,
    metaDescription,
    content: mdContent ?? plainText,
  };
}

// ---------------------------------------------------------------------------
// Content analysis from raw markdown (fallback when Slate parse fails)
// ---------------------------------------------------------------------------

export function analyzeMarkdownFallback(md: string, keyword: string): ContentStats {
  const keywordLower = keyword.toLowerCase().trim();
  const plainText = stripMarkdown(md);
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const keywordCount = keywordLower
    ? (plainText.toLowerCase().match(new RegExp(keywordLower, "gi")) || []).length
    : 0;
  const keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const firstTenPercent = words.slice(0, Math.ceil(wordCount * 0.1)).join(" ").toLowerCase();

  const headings = md
    .split("\n")
    .flatMap((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      return match ? [{ type: `h${match[1].length}`, text: match[2].trim() }] : [];
    });

  const paragraphs = plainText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return {
    wordCount,
    headings,
    hasImages: /!\[[^\]]*\]\([^)]+\)/.test(md),
    hasExternalLinks: /\[[^\]]+\]\(https?:\/\/[^)]+\)/i.test(md),
    hasInternalLinks: /\[[^\]]+\]\((?!https?:\/\/)[^)]+\)/i.test(md),
    keywordCount,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    keywordInFirstTenPercent: keywordLower ? firstTenPercent.includes(keywordLower) : false,
    keywordInSubheadings: headings.some(
      (h) =>
        (h.type === "h2" || h.type === "h3") &&
        keywordLower &&
        h.text.toLowerCase().includes(keywordLower),
    ),
    keywordInImageAlt: keywordLower
      ? new RegExp(`!\\[[^\\]]*${keywordLower}[^\\]]*\\]`, "i").test(md)
      : false,
    shortParagraphs: paragraphs.every((p) => p.split(/\s+/).filter(Boolean).length < 120),
    plainText,
    metaDescription: plainText.slice(0, 160),
    content: md,
  };
}

// ---------------------------------------------------------------------------
// Markdown validation
// ---------------------------------------------------------------------------

export function validateMarkdown(md: string): string | null {
  if (!md?.trim()) return null;

  const fences = (md.match(/^```/gm) || []).length;
  if (fences % 2 !== 0) {
    return "Unclosed code fence (```) detected — content may render incorrectly.";
  }

  const boldMarkers = (md.match(/\*\*/g) || []).length;
  if (boldMarkers % 2 !== 0) {
    return "Unclosed bold marker (**) detected — some formatting may be lost.";
  }

  const openBrackets = (md.match(/\[/g) || []).length;
  const closeBrackets = (md.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return "Unbalanced brackets [] detected — some links may not parse correctly.";
  }

  return null;
}
