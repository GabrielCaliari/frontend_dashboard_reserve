/**
 * Admin Service Unit Tests
 *
 * Tests all admin service methods with mock axios responses
 * Validates: Requirements 1.1, 2.6, 3.2, 4.4, 5.4, 5.5, 6.2
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchAdmins,
  fetchAdminById,
  createAdmin,
  updateAdmin,
  activateAdmin,
  deactivateAdmin,
  deleteAdmin,
} from "../admin-service";
import { apiClient as accessManagementApiClient } from "@/src/common/config/api";
import type {
  Admin,
  PaginatedResponse,
  CreateAdminDto,
  UpdateAdminDto,
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

describe("Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAdmins", () => {
    it("should fetch paginated list of admins with default parameters", async () => {
      const mockResponse: PaginatedResponse<Admin> = {
        data: [
          {
            id: 1,
            name: "John Doe",
            email: "john@example.com",
            role: "super_admin",
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

      const result = await fetchAdmins();

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/admins", {
        params: { page: 1, per_page: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should fetch admins with custom pagination parameters", async () => {
      const mockResponse: PaginatedResponse<Admin> = {
        data: [],
        meta: {
          current_page: 2,
          per_page: 20,
          total: 0,
          total_pages: 0,
        },
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockResponse,
      });

      await fetchAdmins(2, 20);

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/admins", {
        params: { page: 2, per_page: 20 },
      });
    });

    it("should include search parameter when provided", async () => {
      const mockResponse: PaginatedResponse<Admin> = {
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

      await fetchAdmins(1, 10, "john");

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/admins", {
        params: { page: 1, per_page: 10, search: "john" },
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      vi.mocked(accessManagementApiClient.get).mockRejectedValue(networkError);

      await expect(fetchAdmins()).rejects.toThrow("Network Error");
    });
  });

  describe("fetchAdminById", () => {
    it("should fetch admin details by ID", async () => {
      const mockAdmin: Admin = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "super_admin",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        tenants: [],
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockAdmin,
      });

      const result = await fetchAdminById(1);

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/admins/1");
      expect(result).toEqual(mockAdmin);
    });

    it("should handle 404 not found errors", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { code: "404", message: "Admin not found" },
        },
      };
      vi.mocked(accessManagementApiClient.get).mockRejectedValue(notFoundError);

      await expect(fetchAdminById(999)).rejects.toEqual(notFoundError);
    });
  });

  describe("createAdmin", () => {
    it("should create a new admin with valid data", async () => {
      const createData: CreateAdminDto = {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "SecurePass123",
        role: "manager",
      };

      const mockCreatedAdmin: Admin = {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "manager",
        is_active: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.post).mockResolvedValue({
        data: mockCreatedAdmin,
      });

      const result = await createAdmin(createData);

      expect(accessManagementApiClient.post).toHaveBeenCalledWith(
        "/admins",
        createData,
      );
      expect(result).toEqual(mockCreatedAdmin);
    });

    it("should handle 409 conflict errors for duplicate email", async () => {
      const createData: CreateAdminDto = {
        name: "Duplicate User",
        email: "existing@example.com",
        password: "SecurePass123",
        role: "editor",
      };

      const conflictError = {
        response: {
          status: 409,
          data: { code: "409", message: "Email already exists" },
        },
      };
      vi.mocked(accessManagementApiClient.post).mockRejectedValue(
        conflictError,
      );

      await expect(createAdmin(createData)).rejects.toEqual(conflictError);
    });

    it("should handle 400 validation errors", async () => {
      const createData: CreateAdminDto = {
        name: "",
        email: "invalid-email",
        password: "weak",
        role: "viewer",
      };

      const validationError = {
        response: {
          status: 400,
          data: {
            code: "400",
            message: "Validation failed",
            details: {
              name: ["Name is required"],
              email: ["Invalid email format"],
              password: ["Password too weak"],
            },
          },
        },
      };
      vi.mocked(accessManagementApiClient.post).mockRejectedValue(
        validationError,
      );

      await expect(createAdmin(createData)).rejects.toEqual(validationError);
    });
  });

  describe("updateAdmin", () => {
    it("should update admin with partial data", async () => {
      const updateData: UpdateAdminDto = {
        name: "John Updated",
      };

      const mockUpdatedAdmin: Admin = {
        id: 1,
        name: "John Updated",
        email: "john@example.com",
        role: "super_admin",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockUpdatedAdmin,
      });

      const result = await updateAdmin(1, updateData);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/admins/1",
        updateData,
      );
      expect(result).toEqual(mockUpdatedAdmin);
    });

    it("should update multiple fields at once", async () => {
      const updateData: UpdateAdminDto = {
        name: "Jane Updated",
        email: "jane.new@example.com",
        role: "owner",
      };

      const mockUpdatedAdmin: Admin = {
        id: 2,
        name: "Jane Updated",
        email: "jane.new@example.com",
        role: "owner",
        is_active: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockUpdatedAdmin,
      });

      const result = await updateAdmin(2, updateData);

      expect(result).toEqual(mockUpdatedAdmin);
    });
  });

  describe("activateAdmin", () => {
    it("should activate an inactive admin", async () => {
      const mockActivatedAdmin: Admin = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "manager",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockActivatedAdmin,
      });

      const result = await activateAdmin(1);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/admins/1/activate",
      );
      expect(result.is_active).toBe(true);
    });
  });

  describe("deactivateAdmin", () => {
    it("should deactivate an active admin", async () => {
      const mockDeactivatedAdmin: Admin = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "manager",
        is_active: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockDeactivatedAdmin,
      });

      const result = await deactivateAdmin(1);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/admins/1/deactivate",
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteAdmin", () => {
    it("should delete an admin successfully", async () => {
      vi.mocked(accessManagementApiClient.delete).mockResolvedValue({
        data: undefined,
      });

      await deleteAdmin(1);

      expect(accessManagementApiClient.delete).toHaveBeenCalledWith(
        "/admins/1",
      );
    });

    it("should handle 404 when deleting non-existent admin", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { code: "404", message: "Admin not found" },
        },
      };
      vi.mocked(accessManagementApiClient.delete).mockRejectedValue(
        notFoundError,
      );

      await expect(deleteAdmin(999)).rejects.toEqual(notFoundError);
    });
  });
});
