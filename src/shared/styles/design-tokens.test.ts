import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/shared/styles/globals.css"), "utf8");

describe("design tokens", () => {
  it("declares the header height and sidebar width layout tokens", () => {
    expect(css).toMatch(/--header-height:\s*80px/);
    expect(css).toMatch(/--sidebar-width:\s*310px/);
  });

  it("sets the admin card radius to 16px, not the 30px landing-page radius", () => {
    const cardRule = css.match(/\.card-reserve,\s*\.card-flat\s*\{[^}]*\}/)?.[0];
    expect(cardRule).toBeDefined();
    expect(cardRule).toMatch(/border-radius:\s*16px/);
    expect(cardRule).not.toMatch(/border-radius:\s*30px/);
  });

  it("forces 24h display on time inputs regardless of browser locale", () => {
    expect(css).toMatch(/input\[type="time"\]::-webkit-datetime-edit-ampm-field\s*\{\s*display:\s*none/);
  });

  it("uses the RÉSERVE sage-green brand color, not the Zarp lime", () => {
    expect(css).toMatch(/--brand-green:\s*85 16% 53%/);
    expect(css).not.toMatch(/--brand-green:\s*96 73% 67%/);
  });
});
