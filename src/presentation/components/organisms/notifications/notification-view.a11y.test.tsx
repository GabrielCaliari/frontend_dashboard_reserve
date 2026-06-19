import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { createTestQueryClient } from "@/src/shared/query/test-query-provider";
import { NotificationView } from "./notification-view";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/src/shared/stores/tenant-store", () => ({
  useTenantStore: (selector: (state: { selectedTenant: { id: string; name: string } }) => unknown) =>
    selector({ selectedTenant: { id: "tenant-1", name: "Hotel RÉSERVE" } }),
}));
vi.mock("@/src/shared/hooks/notifications/use-tenant-notification", () => ({
  useTenantNotification: () => ({
    notification: {
      viewed: false,
      Notification: { title: "Novo lead recebido", body: "Um novo lead chegou.", published_at: "2026-07-25T10:00:00.000Z" },
    },
    loading: false,
  }),
}));
vi.mock("@/src/shared/hooks/notifications/use-notification-settings", () => ({
  useNotificationSettings: () => ({ settings: { timezone: "America/Sao_Paulo" } }),
}));

describe("NotificationView accessibility", () => {
  it("has no axe violations rendering a single notification", async () => {
    const client = createTestQueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { container } = render(<NotificationView id="notification-1" />, { wrapper });

    await waitFor(() => expect(container.textContent).toContain("Novo lead recebido"));
    expect(await axe(container)).toHaveNoViolations();
  });
});
