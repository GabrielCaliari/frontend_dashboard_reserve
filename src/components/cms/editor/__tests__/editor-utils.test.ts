import { describe, it, expect } from"vitest";
import {
 parseHtmlToSlate,
 extractChapters,
 stripMarkdown,
 analyzeContent,
 analyzeMarkdownFallback,
 validateMarkdown,
 EMPTY_SLATE_VALUE,
} from"../editor-utils";
import type { Value } from"platejs";

// ---------------------------------------------------------------------------
// parseHtmlToSlate
// ---------------------------------------------------------------------------
describe("parseHtmlToSlate", () => {
 it("returns empty slate value for empty input", () => {
 expect(parseHtmlToSlate("")).toEqual(EMPTY_SLATE_VALUE);
 expect(parseHtmlToSlate("")).toEqual(EMPTY_SLATE_VALUE);
 });

 it("parses a simple paragraph", () => {
 const result = parseHtmlToSlate("<p>Hello world</p>");
 expect(result).toHaveLength(1);
 expect(result[0].type).toBe("p");
 expect((result[0] as any).children[0].text).toBe("Hello world");
 });

 it("parses heading tags to correct types", () => {
 const result = parseHtmlToSlate("<h1>Title</h1><h2>Sub</h2><h3>Sub2</h3>");
 expect(result[0].type).toBe("h1");
 expect(result[1].type).toBe("h2");
 expect(result[2].type).toBe("h3");
 });

 it("parses bold marks", () => {
 const result = parseHtmlToSlate("<p><strong>Bold text</strong></p>");
 const child = (result[0] as any).children[0];
 expect(child.bold).toBe(true);
 expect(child.text).toBe("Bold text");
 });

 it("parses italic marks", () => {
 const result = parseHtmlToSlate("<p><em>Italic</em></p>");
 const child = (result[0] as any).children[0];
 expect(child.italic).toBe(true);
 });

 it("parses nested bold+italic", () => {
 const result = parseHtmlToSlate("<p><strong><em>Bold italic</em></strong></p>");
 const child = (result[0] as any).children[0];
 expect(child.bold).toBe(true);
 expect(child.italic).toBe(true);
 });

 it("parses image nodes", () => {
 const result = parseHtmlToSlate('<img src="https://example.com/img.png" alt="A photo" />');
 const img = result.find((n: any) => n.type ==="img") as any;
 expect(img).toBeDefined();
 expect(img.url).toBe("https://example.com/img.png");
 expect(img.alt).toBe("A photo");
 expect(img.children).toEqual([{ text:"" }]);
 });

 it("parses blockquote", () => {
 const result = parseHtmlToSlate("<blockquote>A quote</blockquote>");
 expect(result[0].type).toBe("blockquote");
 });

 it("returns fallback for unsupported tags", () => {
 const result = parseHtmlToSlate("<section><p>Inside</p></section>");
 expect(result.length).toBeGreaterThan(0);
 });
});

// ---------------------------------------------------------------------------
// extractChapters
// ---------------------------------------------------------------------------
describe("extractChapters", () => {
 it("returns empty array for non-array value", () => {
 expect(extractChapters("not an array" as any)).toEqual([]);
 });

 it("returns empty array when no headings", () => {
 const value: Value = [{ type:"p", children: [{ text:"paragraph" }] }];
 expect(extractChapters(value)).toEqual([]);
 });

 it("extracts h1, h2, h3 with correct id and type", () => {
 const value: Value = [
 { type:"h1", children: [{ text:"Title" }] },
 { type:"p", children: [{ text:"Para" }] },
 { type:"h2", children: [{ text:"Section" }] },
 { type:"h3", children: [{ text:"Sub" }] },
 ];
 const chapters = extractChapters(value);
 expect(chapters).toHaveLength(3);
 expect(chapters[0]).toMatchObject({ id:"chapter-0", title:"Title", type:"h1", collapsed: false });
 expect(chapters[1]).toMatchObject({ id:"chapter-2", title:"Section", type:"h2" });
 expect(chapters[2]).toMatchObject({ id:"chapter-3", title:"Sub", type:"h3" });
 });

 it("concatenates multiple text children into title", () => {
 const value: Value = [
 { type:"h2", children: [{ text:"Hello" }, { text:"World" }] },
 ];
 expect(extractChapters(value)[0].title).toBe("Hello World");
 });
});

// ---------------------------------------------------------------------------
// stripMarkdown
// ---------------------------------------------------------------------------
describe("stripMarkdown", () => {
 it("removes heading markers", () => {
 expect(stripMarkdown("# Hello\n## World")).not.toContain("#");
 });

 it("removes bold markers", () => {
 expect(stripMarkdown("**bold**")).toBe("bold");
 });

 it("removes italic markers", () => {
 expect(stripMarkdown("*italic*")).toBe("italic");
 });

 it("removes inline code", () => {
 expect(stripMarkdown("`code`")).toBe("code");
 });

 it("removes code blocks and keeps content stripped", () => {
 const result = stripMarkdown("```\nconst x = 1;\n```");
 expect(result).not.toContain("```");
 });

 it("removes image syntax, keeps alt text", () => {
 expect(stripMarkdown("![alt text](url)")).toBe("alt text");
 });

 it("removes link syntax, keeps link text", () => {
 expect(stripMarkdown("[click here](https://example.com)")).toBe("click here");
 });

 it("removes blockquote markers", () => {
 expect(stripMarkdown("> A quote")).toBe("A quote");
 });

 it("removes list markers", () => {
 expect(stripMarkdown("- item\n* item2\n+ item3")).not.toMatch(/^[-*+]/m);
 });
});

// ---------------------------------------------------------------------------
// analyzeContent
// ---------------------------------------------------------------------------
describe("analyzeContent", () => {
 const makeValue = (): Value => [
 { type:"h1", children: [{ text:"The keyword Article" }] },
 { type:"p", children: [{ text:"keyword appears here in the first paragraph for SEO" }] },
 { type:"h2", children: [{ text:"keyword in subheading" }] },
 { type:"p", children: [{ text:"More content." }] },
 { type:"img", url:"https://example.com/img.png", alt:"keyword image", children: [{ text:"" }] },
 ];

 it("counts words correctly", () => {
 const value: Value = [{ type:"p", children: [{ text:"one two three" }] }];
 const stats = analyzeContent(value,"");
 expect(stats.wordCount).toBe(3);
 });

 it("detects images", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.hasImages).toBe(true);
 });

 it("extracts headings array", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.headings.some((h) => h.type ==="h1")).toBe(true);
 expect(stats.headings.some((h) => h.type ==="h2")).toBe(true);
 });

 it("counts keyword occurrences", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.keywordCount).toBeGreaterThan(1);
 });

 it("detects keyword in subheadings", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.keywordInSubheadings).toBe(true);
 });

 it("detects keyword in first 10% of text", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.keywordInFirstTenPercent).toBe(true);
 });

 it("detects keyword in image alt", () => {
 const stats = analyzeContent(makeValue(),"keyword");
 expect(stats.keywordInImageAlt).toBe(true);
 });

 it("returns zero keyword stats for empty keyword", () => {
 const stats = analyzeContent(makeValue(),"");
 expect(stats.keywordCount).toBe(0);
 expect(stats.keywordDensity).toBe(0);
 });

 it("metaDescription is at most 160 chars from first paragraph", () => {
 const stats = analyzeContent(makeValue(),"");
 expect(stats.metaDescription.length).toBeLessThanOrEqual(160);
 });

 it("uses mdContent as content field when provided", () => {
 const stats = analyzeContent(makeValue(),"","raw markdown");
 expect(stats.content).toBe("raw markdown");
 });
});

// ---------------------------------------------------------------------------
// analyzeMarkdownFallback
// ---------------------------------------------------------------------------
describe("analyzeMarkdownFallback", () => {
 const md =`# Main Title\n\nkeyword appears in this paragraph with enough words to test.\n\n## keyword subheading\n\n![keyword image](https://example.com/img.png)\n\n[link](https://external.com)`;

 it("counts words after stripping markdown", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.wordCount).toBeGreaterThan(0);
 });

 it("detects headings", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.headings.some((h) => h.type ==="h1")).toBe(true);
 expect(stats.headings.some((h) => h.type ==="h2")).toBe(true);
 });

 it("detects keyword in subheadings", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.keywordInSubheadings).toBe(true);
 });

 it("detects images", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.hasImages).toBe(true);
 });

 it("detects external links", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.hasExternalLinks).toBe(true);
 });

 it("detects keyword in image alt", () => {
 const stats = analyzeMarkdownFallback(md,"keyword");
 expect(stats.keywordInImageAlt).toBe(true);
 });

 it("returns zero keyword stats for empty keyword", () => {
 const stats = analyzeMarkdownFallback(md,"");
 expect(stats.keywordCount).toBe(0);
 });

 it("content field is the original markdown", () => {
 const stats = analyzeMarkdownFallback(md,"");
 expect(stats.content).toBe(md);
 });
});

// ---------------------------------------------------------------------------
// validateMarkdown
// ---------------------------------------------------------------------------
describe("validateMarkdown", () => {
 it("returns null for empty string", () => {
 expect(validateMarkdown("")).toBeNull();
 expect(validateMarkdown("")).toBeNull();
 });

 it("returns null for valid markdown", () => {
 expect(validateMarkdown("# Hello\n\nThis is **bold** and *italic*.")).toBeNull();
 });

 it("detects unclosed code fence", () => {
 const warning = validateMarkdown("```\ncode without closing fence");
 expect(warning).not.toBeNull();
 expect(warning).toMatch(/code fence/i);
 });

 it("allows properly closed code fences", () => {
 expect(validateMarkdown("```\ncode\n```")).toBeNull();
 });

 it("detects unclosed bold marker", () => {
 const warning = validateMarkdown("this is **unclosed bold");
 expect(warning).not.toBeNull();
 expect(warning).toMatch(/bold/i);
 });

 it("detects unbalanced brackets", () => {
 const warning = validateMarkdown("this has [unclosed bracket");
 expect(warning).not.toBeNull();
 expect(warning).toMatch(/bracket/i);
 });

 it("allows balanced brackets in links", () => {
 expect(validateMarkdown("[link](https://example.com)")).toBeNull();
 });
});
