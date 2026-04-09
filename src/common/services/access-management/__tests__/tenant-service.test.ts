/**
 * Tenant Service Unit Tests
 *
 * Tests all tenant service methods with mock axios responses
 * Validates: Requirements 8.1, 9.6, 10.2, 11.5, 12.4, 12.5, 13.2
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchTenants,
  fetchTenantById,
  createTenant,
  updateTenant,
  activateTenant,
  deactivateTenant,
  deleteTenant,
} from "../tenant-service";
import { apiClient as accessManagementApiClient } from "@/src/common/config/api";
import type {
  Tenant,
  PaginatedResponse,
  CreateTenantDto,
  UpdateTenantDto,
} from "@/src/common/@types/@access-management";

// Mock the API client
vi.mock("@/src/common/config/access-management-api-client", () => ({
  accessManagementApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("Tenant Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchTenants", () => {
    it("should fetch paginated list of tenants with default parameters", async () => {
      const mockResponse: PaginatedResponse<Tenant> = {
        data: [
          {
            id: 1,
            name: "Acme Corp",
            slug: "acme-corp",
            domain: "acme.com",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        meta: {
          current_page: 1,
          per_page: 10,
          total: 1,
          total_pages: 1,
        },
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockResponse,
      });

      const result = await fetchTenants();

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/tenants", {
        params: { page: 1, per_page: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should include search parameter when provided", async () => {
      const mockResponse: PaginatedResponse<Tenant> = {
        data: [],
        meta: {
          current_page: 1,
          per_page: 10,
          total: 0,
          total_pages: 0,
        },
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockResponse,
      });

      await fetchTenants(1, 10, "acme");

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/tenants", {
        params: { page: 1, per_page: 10, search: "acme" },
      });
    });
  });

  describe("fetchTenantById", () => {
    it("should fetch tenant details by ID with assigned admins", async () => {
      const mockTenant: Tenant = {
        id: 1,
        name: "Acme Corp",
        slug: "acme-corp",
        domain: "acme.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        admins: [],
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockTenant,
      });

      const result = await fetchTenantById(1);

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/tenants/1");
      expect(result).toEqual(mockTenant);
    });
  });

  describe("createTenant", () => {
    it("should create a new tenant with valid data", async () => {
      const createData: CreateTenantDto = {
        name: "New Company",
        slug: "new-company",
        domain: "newcompany.com",
      };

      const mockCreatedTenant: Tenant = {
        id: 2,
        name: "New Company",
        slug: "new-company",
        domain: "newcompany.com",
        is_active: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.post).mockResolvedValue({
        data: mockCreatedTenant,
      });

      const result = await createTenant(createData);

      expect(accessManagementApiClient.post).toHaveBeenCalledWith(
        "/tenants",
        createData,
      );
      expect(result).toEqual(mockCreatedTenant);
    });

    it("should handle 409 conflict errors for duplicate slug", async () => {
      const createData: CreateTenantDto = {
        name: "Duplicate Tenant",
        slug: "existing-slug",
        domain: "duplicate.com",
      };

      const conflictError = {
        response: {
          status: 409,
          data: { code: "409", message: "Slug already exists" },
        },
      };
      vi.mocked(accessManagementApiClient.post).mockRejectedValue(
        conflictError,
      );

      await expect(createTenant(createData)).rejects.toEqual(conflictError);
    });
  });

  describe("updateTenant", () => {
    it("should update tenant with partial data", async () => {
      const updateData: UpdateTenantDto = {
        name: "Acme Corporation",
      };

      const mockUpdatedTenant: Tenant = {
        id: 1,
        name: "Acme Corporation",
        slug: "acme-corp",
        domain: "acme.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockUpdatedTenant,
      });

      const result = await updateTenant(1, updateData);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/tenants/1",
        updateData,
      );
      expect(result).toEqual(mockUpdatedTenant);
    });
  });

  describe("activateTenant", () => {
    it("should activate an inactive tenant", async () => {
      const mockActivatedTenant: Tenant = {
        id: 1,
        name: "Acme Corp",
        slug: "acme-corp",
        domain: "acme.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockActivatedTenant,
      });

      const result = await activateTenant(1);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/tenants/1/activate",
      );
      expect(result.is_active).toBe(true);
    });
  });

  describe("deactivateTenant", () => {
    it("should deactivate an active tenant", async () => {
      const mockDeactivatedTenant: Tenant = {
        id: 1,
        name: "Acme Corp",
        slug: "acme-corp",
        domain: "acme.com",
        is_active: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockDeactivatedTenant,
      });

      const result = await deactivateTenant(1);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/tenants/1/deactivate",
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteTenant", () => {
    it("should delete a tenant successfully", async () => {
      vi.mocked(accessManagementApiClient.delete).mockResolvedValue({
        data: undefined,
      });

      await deleteTenant(1);

      expect(accessManagementApiClient.delete).toHaveBeenCalledWith(
        "/tenants/1",
      );
    });

    it("should handle 404 when deleting non-existent tenant", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { code: "404", message: "Tenant not found" },
        },
      };
      vi.mocked(accessManagementApiClient.delete).mockRejectedValue(
        notFoundError,
      );

      await expect(deleteTenant(999)).rejects.toEqual(notFoundError);
    });
  });
});
