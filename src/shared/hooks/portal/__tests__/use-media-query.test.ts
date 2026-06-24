import { describe, expect, it, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaQuery } from "../use-media-query";

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  window.dispatchEvent(new Event("resize"));
}

describe("useMediaQuery", () => {
  afterEach(() => setViewportWidth(1024));

  it("reports true when the viewport is narrower than the breakpoint", () => {
    setViewportWidth(375);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(true);
  });

  it("reports false when the viewport is wider than the breakpoint", () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
  });

  it("updates when the viewport is resized", () => {
    setViewportWidth(1280);
    const { result } = renderHook(() => useMediaQuery("(max-width: 767px)"));
    expect(result.current).toBe(false);
    act(() => setViewportWidth(375));
    expect(result.current).toBe(true);
  });
});
