import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalNav, PORTAL_ROUTES } from "../nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/portal/dashboard",
}));

describe("PortalNav", () => {
  it("renders a link for every portal route", () => {
    render(<PortalNav />);
    PORTAL_ROUTES.forEach((route) => {
      expect(screen.getByRole("link", { name: route.label })).toHaveAttribute("href", route.href);
    });
  });

  it("marks the current route as active", () => {
    render(<PortalNav />);
    const activeLink = screen.getByRole("link", { name: "Visão Geral" });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });
});
