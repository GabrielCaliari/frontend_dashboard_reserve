/**
 * User Service Unit Tests
 *
 * Tests all user service methods with mock axios responses
 * Validates: Requirements 18.1, 19.2, 20.4, 21.3, 22.2
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  fetchUsers,
  fetchUserById,
  updateUser,
  deactivateUser,
  deleteUser,
} from "../user-service";
import { apiClient as accessManagementApiClient } from "@/src/infraestructure/axios/api";
import type {
  User,
  PaginatedResponse,
  UpdateUserDto,
} from "@/src/shared/domain/types/@access-management";

// Mock the API client
vi.mock("@/src/common/config/access-management-api-client", () => ({
  accessManagementApiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("User Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchUsers", () => {
    it("should fetch paginated list of users with default parameters", async () => {
      const mockResponse: PaginatedResponse<User> = {
        data: [
          {
            id: 1,
            name: "Alice Johnson",
            email: "alice@example.com",
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

      const result = await fetchUsers();

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/users", {
        params: { page: 1, per_page: 10 },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should include search parameter when provided", async () => {
      const mockResponse: PaginatedResponse<User> = {
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

      await fetchUsers(1, 10, "alice");

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/users", {
        params: { page: 1, per_page: 10, search: "alice" },
      });
    });

    it("should handle network errors", async () => {
      const networkError = new Error("Network Error");
      vi.mocked(accessManagementApiClient.get).mockRejectedValue(networkError);

      await expect(fetchUsers()).rejects.toThrow("Network Error");
    });
  });

  describe("fetchUserById", () => {
    it("should fetch user details by ID", async () => {
      const mockUser: User = {
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.get).mockResolvedValue({
        data: mockUser,
      });

      const result = await fetchUserById(1);

      expect(accessManagementApiClient.get).toHaveBeenCalledWith("/users/1");
      expect(result).toEqual(mockUser);
    });

    it("should handle 404 not found errors", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { code: "404", message: "User not found" },
        },
      };
      vi.mocked(accessManagementApiClient.get).mockRejectedValue(notFoundError);

      await expect(fetchUserById(999)).rejects.toEqual(notFoundError);
    });
  });

  describe("updateUser", () => {
    it("should update user with partial data", async () => {
      const updateData: UpdateUserDto = {
        name: "Alice Smith",
      };

      const mockUpdatedUser: User = {
        id: 1,
        name: "Alice Smith",
        email: "alice@example.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockUpdatedUser,
      });

      const result = await updateUser(1, updateData);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/users/1",
        updateData,
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should update email field", async () => {
      const updateData: UpdateUserDto = {
        email: "alice.new@example.com",
      };

      const mockUpdatedUser: User = {
        id: 1,
        name: "Alice Johnson",
        email: "alice.new@example.com",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockUpdatedUser,
      });

      const result = await updateUser(1, updateData);

      expect(result.email).toBe("alice.new@example.com");
    });

    it("should handle 409 conflict errors for duplicate email", async () => {
      const updateData: UpdateUserDto = {
        email: "existing@example.com",
      };

      const conflictError = {
        response: {
          status: 409,
          data: { code: "409", message: "Email already exists" },
        },
      };
      vi.mocked(accessManagementApiClient.patch).mockRejectedValue(
        conflictError,
      );

      await expect(updateUser(1, updateData)).rejects.toEqual(conflictError);
    });
  });

  describe("deactivateUser", () => {
    it("should deactivate an active user", async () => {
      const mockDeactivatedUser: User = {
        id: 1,
        name: "Alice Johnson",
        email: "alice@example.com",
        is_active: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-03T00:00:00Z",
      };

      vi.mocked(accessManagementApiClient.patch).mockResolvedValue({
        data: mockDeactivatedUser,
      });

      const result = await deactivateUser(1);

      expect(accessManagementApiClient.patch).toHaveBeenCalledWith(
        "/users/1/deactivate",
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe("deleteUser", () => {
    it("should delete a user successfully", async () => {
      vi.mocked(accessManagementApiClient.delete).mockResolvedValue({
        data: undefined,
      });

      await deleteUser(1);

      expect(accessManagementApiClient.delete).toHaveBeenCalledWith("/users/1");
    });

    it("should handle 404 when deleting non-existent user", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { code: "404", message: "User not found" },
        },
      };
      vi.mocked(accessManagementApiClient.delete).mockRejectedValue(
        notFoundError,
      );

      await expect(deleteUser(999)).rejects.toEqual(notFoundError);
    });
  });
});
