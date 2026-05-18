import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminRole } from "@/src/shared/domain/types/@access-management";
import usePermissions from "./use-permissions";

const getCookie = vi.fn();

vi.mock("cookies-next", () => ({
  getCookie: (...args: unknown[]) => getCookie(...args),
}));

function RoleProbe() {
  const { role, isSuperAdmin } = usePermissions();
  return (
    <span>
      {role ?? "sem papel"}:{isSuperAdmin ? "sim" : "nao"}
    </span>
  );
}

beforeEach(() => {
  getCookie.mockReset();
});

describe("usePermissions", () => {
  it("reads the session role from the cookie on the client", () => {
    getCookie.mockReturnValue(AdminRole.super_admin);

    const { result } = renderHook(() => usePermissions());

    expect(getCookie).toHaveBeenCalledWith("session-role");
    expect(result.current.role).toBe(AdminRole.super_admin);
    expect(result.current.isSuperAdmin).toBe(true);
    expect(result.current.canManageTenants).toBe(true);
  });

  it("renders no role on the server even when a cookie exists, so hydration matches", () => {
    getCookie.mockReturnValue(AdminRole.super_admin);

    expect(renderToStaticMarkup(<RoleProbe />)).toContain("sem papel:nao");
  });

  it("derives cumulative capabilities per role", () => {
    getCookie.mockReturnValue(AdminRole.editor);
    const editor = renderHook(() => usePermissions()).result.current;

    expect(editor.canEditContent).toBe(true);
    expect(editor.canViewContent).toBe(true);
    expect(editor.canManageAdmins).toBe(false);
    expect(editor.canViewReports).toBe(false);

    getCookie.mockReturnValue(AdminRole.viewer);
    const viewer = renderHook(() => usePermissions()).result.current;

    expect(viewer.canViewContent).toBe(true);
    expect(viewer.canEditContent).toBe(false);
  });
});
