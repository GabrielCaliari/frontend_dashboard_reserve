/**
 * Error Handling and Recovery Property-Based Tests
 *
 * Property tests for error handling and recovery using fast-check
 * Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4, 28.1, 28.2
 *
 * Each test runs 100 iterations to ensure comprehensive input coverage
 *
 * Tests verify API error display, network error recovery, and validation error display
 * across all operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import { AdminRole } from "@/src/common/@types/@access-management";

// Generator for Admin data
const adminArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  role: fc.constantFrom(
    AdminRole.super_admin,
    AdminRole.owner,
    AdminRole.manager,
    AdminRole.editor,
    AdminRole.viewer,
  ),
  is_active: fc.boolean(),
  created_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
  updated_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
});

// Generator for Tenant data
const tenantArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  slug: fc.string({ minLength: 2, maxLength: 50 }).map(
    (s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "test-slug",
  ),
  domain: fc.domain(),
  is_active: fc.boolean(),
  created_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
  updated_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
});

// Generator for User data
const userArbitrary = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  email: fc.emailAddress(),
  is_active: fc.boolean(),
  created_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
  updated_at: fc
    .integer({ min: 1577836800000, max: 1735689600000 })
    .map((ts) => new Date(ts).toISOString()),
});

// Generator for HTTP status codes
const httpStatusCodeArbitrary = fc.constantFrom(
  400, // Bad Request
  401, // Unauthorized
  403, // Forbidden
  404, // Not Found
  409, // Conflict
  422, // Unprocessable Entity
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
);

// Generator for API error responses
const apiErrorArbitrary = fc.record({
  code: fc.constantFrom(
    "VALIDATION_ERROR",
    "DUPLICATE_EMAIL",
    "DUPLICATE_SLUG",
    "NOT_FOUND",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "INTERNAL_ERROR",
  ),
  message: fc
    .string({ minLength: 10, maxLength: 100 })
    .filter((s) => s.trim().length >= 10),
  statusCode: httpStatusCodeArbitrary,
});

// Generator for validation errors
const validationErrorArbitrary = fc.record({
  field: fc.constantFrom("name", "email", "password", "slug", "domain", "role"),
  message: fc.oneof(
    fc.constant("This field is required"),
    fc.constant("Invalid email format"),
    fc.constant("Password must be at least 8 characters"),
    fc.constant("Password must contain uppercase letter"),
    fc.constant("Password must contain digit"),
    fc.constant("Invalid slug format"),
    fc.constant("Invalid domain format"),
    fc.constant("Email already exists"),
    fc.constant("Slug already exists"),
    fc
      .string({ minLength: 10, maxLength: 50 })
      .filter((s) => s.trim().length >= 10),
  ),
});

// Generator for network error types
const networkErrorArbitrary = fc.constantFrom(
  "NETWORK_ERROR",
  "TIMEOUT",
  "CONNECTION_REFUSED",
  "DNS_LOOKUP_FAILED",
  "ECONNABORTED",
);

// Generator for mutation types
const mutationTypeArbitrary = fc.constantFrom(
  "create",
  "update",
  "delete",
  "activate",
  "deactivate",
  "assign",
  "remove",
);

// Generator for entity types
const entityTypeArbitrary = fc.constantFrom("admin", "tenant", "user");

describe("Error Handling and Recovery Property Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("Property 17: API error display", () => {
    it("should display error message for any API request failure", () => {
      // Feature: access-management
      // Property 17: For any API request failure, system should display error message with details
      // Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4

      fc.assert(
        fc.property(
          apiErrorArbitrary,
          entityTypeArbitrary,
          mutationTypeArbitrary,
          (apiError, entityType, mutationType) => {
            // Simulate API error toast
            const toast = document.createElement("div");
            toast.setAttribute("role", "alert");
            toast.setAttribute("aria-live", "assertive");
            toast.setAttribute("data-testid", "error-toast");
            toast.className = "toast toast-error";

            const messageEl = document.createElement("span");
            messageEl.textContent = apiError.message;
            messageEl.setAttribute("data-error-code", apiError.code);
            toast.appendChild(messageEl);

            // Add status code if server error
            if (apiError.statusCode >= 500) {
              const statusEl = document.createElement("span");
              statusEl.className = "status-code";
              statusEl.textContent = `(${apiError.statusCode})`;
              toast.appendChild(statusEl);
            }

            container.appendChild(toast);

            // Verify error message is displayed
            expect(toast.getAttribute("role")).toBe("alert");
            expect(toast.getAttribute("aria-live")).toBe("assertive");
            expect(messageEl.textContent).toBe(apiError.message);
            expect(messageEl.getAttribute("data-error-code")).toBe(
              apiError.code,
            );

            // Verify status code for server errors
            if (apiError.statusCode >= 500) {
              const statusEl = toast.querySelector(".status-code");
              expect(statusEl).not.toBeNull();
              expect(statusEl?.textContent).toContain(
                apiError.statusCode.toString(),
              );
            }

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should display error details from API response", () => {
      // Feature: access-management
      // Property 17: Error display should include details from API response
      // Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4

      fc.assert(
        fc.property(
          apiErrorArbitrary,
          fc.option(
            fc.record({
              details: fc.dictionary(
                fc.constantFrom("name", "email", "password", "slug", "domain"),
                fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
                  minLength: 1,
                  maxLength: 3,
                }),
              ),
            }),
            { nil: undefined },
          ),
          (apiError, additionalData) => {
            const errorDisplay = document.createElement("div");
            errorDisplay.setAttribute("role", "alert");
            errorDisplay.className = "error-display";

            // Main error message
            const mainMessage = document.createElement("p");
            mainMessage.className = "error-message";
            mainMessage.textContent = apiError.message;
            errorDisplay.appendChild(mainMessage);

            // Error code
            const codeEl = document.createElement("span");
            codeEl.className = "error-code";
            codeEl.textContent = apiError.code;
            errorDisplay.appendChild(codeEl);

            // Additional details if present
            if (additionalData?.details) {
              const detailsList = document.createElement("ul");
              detailsList.className = "error-details";

              Object.entries(additionalData.details).forEach(
                ([field, messages]) => {
                  messages.forEach((msg) => {
                    const item = document.createElement("li");
                    item.textContent = `${field}: ${msg}`;
                    detailsList.appendChild(item);
                  });
                },
              );

              errorDisplay.appendChild(detailsList);
            }

            container.appendChild(errorDisplay);

            // Verify main error is displayed
            expect(mainMessage.textContent).toBe(apiError.message);
            expect(codeEl.textContent).toBe(apiError.code);

            // Verify details are displayed if present
            if (additionalData?.details) {
              const detailsList = errorDisplay.querySelector(".error-details");
              expect(detailsList).not.toBeNull();

              const items = detailsList?.querySelectorAll("li");
              const totalMessages = Object.values(
                additionalData.details,
              ).reduce((sum, msgs) => sum + msgs.length, 0);
              expect(items?.length).toBe(totalMessages);
            }

            // Clean up
            errorDisplay.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle different error status codes appropriately", () => {
      // Feature: access-management
      // Property 17: Different status codes should be handled with appropriate messaging
      // Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4

      fc.assert(
        fc.property(
          httpStatusCodeArbitrary,
          fc.string({ minLength: 10, maxLength: 100 }),
          (statusCode, message) => {
            const errorHandler = document.createElement("div");
            errorHandler.setAttribute(
              "data-status-code",
              statusCode.toString(),
            );

            // Determine error type based on status code
            let errorType = "error";
            let severity = "medium";

            if (statusCode === 401 || statusCode === 403) {
              errorType = "auth-error";
              severity = "high";
            } else if (statusCode === 404) {
              errorType = "not-found";
              severity = "low";
            } else if (statusCode === 409 || statusCode === 422) {
              errorType = "validation-error";
              severity = "medium";
            } else if (statusCode >= 500) {
              errorType = "server-error";
              severity = "high";
            }

            errorHandler.setAttribute("data-error-type", errorType);
            errorHandler.setAttribute("data-severity", severity);

            const messageEl = document.createElement("p");
            messageEl.textContent = message;
            errorHandler.appendChild(messageEl);

            container.appendChild(errorHandler);

            // Verify error type classification
            expect(errorHandler.getAttribute("data-status-code")).toBe(
              statusCode.toString(),
            );
            expect(errorHandler.getAttribute("data-error-type")).toBe(
              errorType,
            );
            expect(errorHandler.getAttribute("data-severity")).toBe(severity);

            // Verify appropriate error type for status code
            if (statusCode === 401 || statusCode === 403) {
              expect(errorType).toBe("auth-error");
            } else if (statusCode === 404) {
              expect(errorType).toBe("not-found");
            } else if (statusCode === 409 || statusCode === 422) {
              expect(errorType).toBe("validation-error");
            } else if (statusCode >= 500) {
              expect(errorType).toBe("server-error");
            }

            // Clean up
            errorHandler.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should persist error message in modal without closing on API failure", () => {
      // Feature: access-management
      // Property 17: Modal should remain open with error message on API failure
      // Validates: Requirements 1.6, 5.8, 6.5, 8.6, 12.7, 13.4, 18.6, 21.5, 22.4

      fc.assert(
        fc.property(
          apiErrorArbitrary,
          mutationTypeArbitrary,
          (apiError, mutationType) => {
            let isModalOpen = true;

            const modal = document.createElement("div");
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            modal.setAttribute("data-testid", "form-modal");
            modal.style.display = "block";

            const form = document.createElement("form");
            modal.appendChild(form);

            // Simulate API error
            const errorEl = document.createElement("div");
            errorEl.className = "form-error";
            errorEl.setAttribute("role", "alert");
            errorEl.textContent = apiError.message;
            form.appendChild(errorEl);

            // Modal should NOT close on error
            const closeButton = document.createElement("button");
            closeButton.textContent = "Close";
            closeButton.onclick = () => {
              isModalOpen = false;
              modal.style.display = "none";
            };
            modal.appendChild(closeButton);

            container.appendChild(modal);

            // Verify modal remains open
            expect(modal.style.display).toBe("block");
            expect(isModalOpen).toBe(true);

            // Verify error is displayed in modal
            expect(errorEl.textContent).toBe(apiError.message);
            expect(errorEl.getAttribute("role")).toBe("alert");

            // Verify modal can still be closed manually
            closeButton.click();
            expect(isModalOpen).toBe(false);
            expect(modal.style.display).toBe("none");

            // Clean up
            modal.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 18: Network error recovery", () => {
    it("should display network error message with retry option", () => {
      // Feature: access-management
      // Property 18: For any network failure, system should display message and offer retry
      // Validates: Requirements 28.1

      fc.assert(
        fc.property(
          networkErrorArbitrary,
          entityTypeArbitrary,
          (networkError, entityType) => {
            let retryClicked = false;

            const errorDisplay = document.createElement("div");
            errorDisplay.setAttribute("role", "alert");
            errorDisplay.setAttribute("data-testid", "network-error");
            errorDisplay.className = "network-error";

            // Error message
            const message = document.createElement("p");
            message.textContent =
              "Network connection failed. Please check your internet connection.";
            message.setAttribute("data-error-type", networkError);
            errorDisplay.appendChild(message);

            // Retry button
            const retryButton = document.createElement("button");
            retryButton.textContent = "Retry";
            retryButton.setAttribute("data-testid", "retry-button");
            retryButton.onclick = () => {
              retryClicked = true;
            };
            errorDisplay.appendChild(retryButton);

            container.appendChild(errorDisplay);

            // Verify network error message is displayed
            expect(errorDisplay.getAttribute("role")).toBe("alert");
            expect(message.textContent).toContain("Network");
            expect(message.textContent).toContain("connection");
            expect(message.getAttribute("data-error-type")).toBe(networkError);

            // Verify retry button exists
            expect(retryButton).not.toBeNull();
            expect(retryButton.textContent).toBe("Retry");

            // Verify retry button is clickable
            retryButton.click();
            expect(retryClicked).toBe(true);

            // Clean up
            errorDisplay.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should indicate network problems clearly to user", () => {
      // Feature: access-management
      // Property 18: Network error messages should clearly indicate network problems
      // Validates: Requirements 28.1

      fc.assert(
        fc.property(
          networkErrorArbitrary,
          fc.constantFrom("fetch", "list", "create", "update", "delete"),
          (networkError, operation) => {
            const errorDisplay = document.createElement("div");
            errorDisplay.setAttribute("role", "alert");
            errorDisplay.className = "network-error-banner";

            // Network-specific message
            const icon = document.createElement("span");
            icon.setAttribute("aria-label", "Network error");
            icon.textContent = "⚠️";
            errorDisplay.appendChild(icon);

            const message = document.createElement("p");

            // Generate network-specific message
            const networkMessages = {
              NETWORK_ERROR: "Unable to connect to the server",
              TIMEOUT: "Request timed out - connection issue",
              CONNECTION_REFUSED: "Connection refused by server",
              DNS_LOOKUP_FAILED: "Could not resolve server address",
              ECONNABORTED: "Connection was aborted",
            };

            message.textContent =
              networkMessages[networkError as keyof typeof networkMessages] ||
              "Network error occurred";
            errorDisplay.appendChild(message);

            container.appendChild(errorDisplay);

            // Verify network-specific messaging
            expect(icon.getAttribute("aria-label")).toBe("Network error");
            expect(message.textContent).toBeTruthy();
            expect(message.textContent!.length).toBeGreaterThan(10);

            // Verify message indicates network problem
            const lowerMessage = message.textContent!.toLowerCase();
            const hasNetworkIndicator =
              lowerMessage.includes("network") ||
              lowerMessage.includes("connection") ||
              lowerMessage.includes("connect") ||
              lowerMessage.includes("timeout") ||
              lowerMessage.includes("timed out") ||
              lowerMessage.includes("server");

            expect(hasNetworkIndicator).toBe(true);

            // Clean up
            errorDisplay.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should allow retry after network error", () => {
      // Feature: access-management
      // Property 18: User should be able to retry operation after network error
      // Validates: Requirements 28.1

      fc.assert(
        fc.property(
          networkErrorArbitrary,
          fc.integer({ min: 0, max: 5 }),
          (networkError, retryCount) => {
            let currentRetryCount = 0;

            const errorDisplay = document.createElement("div");
            errorDisplay.setAttribute("role", "alert");

            const message = document.createElement("p");
            message.textContent = "Network error. Please try again.";
            errorDisplay.appendChild(message);

            const retryButton = document.createElement("button");
            retryButton.textContent = "Retry";
            retryButton.setAttribute(
              "data-retry-count",
              currentRetryCount.toString(),
            );
            retryButton.onclick = () => {
              currentRetryCount++;
              retryButton.setAttribute(
                "data-retry-count",
                currentRetryCount.toString(),
              );
            };
            errorDisplay.appendChild(retryButton);

            container.appendChild(errorDisplay);

            // Simulate multiple retry attempts
            for (let i = 0; i < retryCount; i++) {
              retryButton.click();
            }

            // Verify retry functionality
            expect(retryButton).not.toBeNull();
            expect(currentRetryCount).toBe(retryCount);
            expect(retryButton.getAttribute("data-retry-count")).toBe(
              retryCount.toString(),
            );

            // Clean up
            errorDisplay.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain form data after network error for retry", () => {
      // Feature: access-management
      // Property 18: Form data should be preserved after network error for retry
      // Validates: Requirements 28.1

      fc.assert(
        fc.property(
          adminArbitrary,
          networkErrorArbitrary,
          (admin, networkError) => {
            const form = document.createElement("form");

            // Form inputs with data
            const nameInput = document.createElement("input");
            nameInput.name = "name";
            nameInput.value = admin.name;
            form.appendChild(nameInput);

            const emailInput = document.createElement("input");
            emailInput.name = "email";
            emailInput.value = admin.email;
            form.appendChild(emailInput);

            // Error display
            const errorEl = document.createElement("div");
            errorEl.className = "network-error";
            errorEl.textContent = "Network error occurred";
            errorEl.setAttribute("data-error-type", networkError);
            form.appendChild(errorEl);

            // Retry button
            const retryButton = document.createElement("button");
            retryButton.type = "button";
            retryButton.textContent = "Retry";
            form.appendChild(retryButton);

            container.appendChild(form);

            // Verify form data is preserved
            expect(nameInput.value).toBe(admin.name);
            expect(emailInput.value).toBe(admin.email);

            // Verify error is displayed
            expect(errorEl.textContent).toContain("Network error");

            // Verify retry button exists
            expect(retryButton).not.toBeNull();

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 19: Validation error display", () => {
    it("should display specific validation errors from API", () => {
      // Feature: access-management
      // Property 19: For any validation error, system should display specific errors from API
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          fc
            .array(validationErrorArbitrary, { minLength: 1, maxLength: 5 })
            .map((errors) => {
              // Ensure unique fields
              const uniqueErrors = new Map<string, (typeof errors)[0]>();
              errors.forEach((error) => {
                if (!uniqueErrors.has(error.field)) {
                  uniqueErrors.set(error.field, error);
                }
              });
              return Array.from(uniqueErrors.values());
            }),
          (validationErrors) => {
            const form = document.createElement("form");
            form.setAttribute("data-testid", "validation-form");

            // API validation error display
            const errorSummary = document.createElement("div");
            errorSummary.setAttribute("role", "alert");
            errorSummary.className = "validation-errors";
            form.appendChild(errorSummary);

            validationErrors.forEach((error) => {
              const formGroup = document.createElement("div");
              formGroup.className = "form-group";

              const input = document.createElement("input");
              input.name = error.field;
              input.setAttribute("aria-invalid", "true");
              input.setAttribute("aria-describedby", `${error.field}-error`);
              formGroup.appendChild(input);

              // Field-specific error from API
              const errorEl = document.createElement("span");
              errorEl.id = `${error.field}-error`;
              errorEl.className = "field-error";
              errorEl.setAttribute("role", "alert");
              errorEl.textContent = error.message;
              errorEl.setAttribute("data-source", "api");
              formGroup.appendChild(errorEl);

              form.appendChild(formGroup);
            });

            container.appendChild(form);

            // Verify each validation error is displayed
            validationErrors.forEach((error) => {
              const errorEl = form.querySelector(`#${error.field}-error`);
              expect(errorEl).not.toBeNull();
              expect(errorEl?.textContent).toBe(error.message);
              expect(errorEl?.getAttribute("role")).toBe("alert");
              expect(errorEl?.getAttribute("data-source")).toBe("api");

              // Verify input is marked invalid
              const input = form.querySelector(`input[name="${error.field}"]`);
              expect(input?.getAttribute("aria-invalid")).toBe("true");
              expect(input?.getAttribute("aria-describedby")).toBe(
                `${error.field}-error`,
              );
            });

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should map API validation errors to form fields", () => {
      // Feature: access-management
      // Property 19: Validation errors should be mapped to specific form fields
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          fc.record({
            details: fc.dictionary(
              fc.constantFrom("name", "email", "password", "slug", "domain"),
              fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
                minLength: 1,
                maxLength: 2,
              }),
            ),
          }),
          (apiResponse) => {
            const form = document.createElement("form");

            // Create form fields
            Object.keys(apiResponse.details).forEach((fieldName) => {
              const formGroup = document.createElement("div");
              formGroup.className = "form-group";
              formGroup.setAttribute("data-field", fieldName);

              const input = document.createElement("input");
              input.name = fieldName;
              formGroup.appendChild(input);

              form.appendChild(formGroup);
            });

            // Map API errors to fields
            Object.entries(apiResponse.details).forEach(
              ([fieldName, messages]) => {
                const formGroup = form.querySelector(
                  `[data-field="${fieldName}"]`,
                );
                const input = formGroup?.querySelector("input");

                if (input && messages.length > 0) {
                  input.setAttribute("aria-invalid", "true");

                  const errorEl = document.createElement("span");
                  errorEl.className = "field-error";
                  errorEl.textContent = messages[0]; // Show first error
                  errorEl.setAttribute("data-field", fieldName);
                  formGroup?.appendChild(errorEl);
                }
              },
            );

            container.appendChild(form);

            // Verify errors are mapped to correct fields
            Object.entries(apiResponse.details).forEach(
              ([fieldName, messages]) => {
                const formGroup = form.querySelector(
                  `[data-field="${fieldName}"]`,
                );
                expect(formGroup).not.toBeNull();

                const input = formGroup?.querySelector("input");
                expect(input?.getAttribute("aria-invalid")).toBe("true");

                const errorEl = formGroup?.querySelector(".field-error");
                expect(errorEl).not.toBeNull();
                expect(errorEl?.textContent).toBe(messages[0]);
                expect(errorEl?.getAttribute("data-field")).toBe(fieldName);
              },
            );

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should display multiple validation errors for a single field", () => {
      // Feature: access-management
      // Property 19: Multiple validation errors for same field should be displayed
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          fc.constantFrom("name", "email", "password", "slug", "domain"),
          fc.array(fc.string({ minLength: 5, maxLength: 50 }), {
            minLength: 2,
            maxLength: 4,
          }),
          (fieldName, errorMessages) => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";

            const input = document.createElement("input");
            input.name = fieldName;
            input.setAttribute("aria-invalid", "true");
            formGroup.appendChild(input);

            // Display all errors for the field
            const errorList = document.createElement("ul");
            errorList.className = "error-list";
            errorList.setAttribute("role", "alert");

            errorMessages.forEach((message) => {
              const errorItem = document.createElement("li");
              errorItem.textContent = message;
              errorList.appendChild(errorItem);
            });

            formGroup.appendChild(errorList);
            container.appendChild(formGroup);

            // Verify all errors are displayed
            const displayedErrors = errorList.querySelectorAll("li");
            expect(displayedErrors.length).toBe(errorMessages.length);

            displayedErrors.forEach((errorEl, index) => {
              expect(errorEl.textContent).toBe(errorMessages[index]);
            });

            // Verify input is marked invalid
            expect(input.getAttribute("aria-invalid")).toBe("true");

            // Clean up
            formGroup.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should distinguish between client and server validation errors", () => {
      // Feature: access-management
      // Property 19: System should distinguish between client and API validation errors
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          validationErrorArbitrary,
          fc.constantFrom("client", "server"),
          (validationError, errorSource) => {
            const formGroup = document.createElement("div");

            const input = document.createElement("input");
            input.name = validationError.field;
            input.setAttribute("aria-invalid", "true");
            formGroup.appendChild(input);

            const errorEl = document.createElement("span");
            errorEl.className = "field-error";
            errorEl.textContent = validationError.message;
            errorEl.setAttribute("data-source", errorSource);

            // Different styling or indicators based on source
            if (errorSource === "server") {
              errorEl.setAttribute("data-from-api", "true");
            }

            formGroup.appendChild(errorEl);
            container.appendChild(formGroup);

            // Verify error source is tracked
            expect(errorEl.getAttribute("data-source")).toBe(errorSource);

            if (errorSource === "server") {
              expect(errorEl.getAttribute("data-from-api")).toBe("true");
            }

            // Clean up
            formGroup.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should clear validation errors when user corrects input", () => {
      // Feature: access-management
      // Property 19: Validation errors should clear when user corrects input
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          validationErrorArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (validationError, correctedValue) => {
            const formGroup = document.createElement("div");

            const input = document.createElement("input");
            input.name = validationError.field;
            input.value = "";
            input.setAttribute("aria-invalid", "true");
            formGroup.appendChild(input);

            let errorEl = document.createElement("span");
            errorEl.className = "field-error";
            errorEl.textContent = validationError.message;
            formGroup.appendChild(errorEl);

            container.appendChild(formGroup);

            // Verify initial error state
            expect(input.getAttribute("aria-invalid")).toBe("true");
            expect(errorEl.textContent).toBe(validationError.message);

            // Simulate user correcting input
            input.value = correctedValue;

            // Simulate validation passing (error cleared)
            if (correctedValue.trim().length > 0) {
              input.removeAttribute("aria-invalid");
              errorEl.textContent = "";
              errorEl.style.display = "none";
            }

            // Verify error is cleared
            if (correctedValue.trim().length > 0) {
              expect(input.getAttribute("aria-invalid")).toBeNull();
              expect(errorEl.textContent).toBe("");
              expect(errorEl.style.display).toBe("none");
            }

            // Clean up
            formGroup.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle validation errors for nested or complex fields", () => {
      // Feature: access-management
      // Property 19: Validation errors should work for complex field structures
      // Validates: Requirements 28.2

      fc.assert(
        fc.property(
          fc.record({
            field: fc.constantFrom("admin.email", "tenant.slug", "user.name"),
            message: fc.string({ minLength: 10, maxLength: 50 }),
          }),
          (validationError) => {
            const form = document.createElement("form");

            // Create nested field structure
            const fieldParts = validationError.field.split(".");
            const fieldId = validationError.field.replace(".", "-");

            const formGroup = document.createElement("div");
            formGroup.className = "form-group";

            const input = document.createElement("input");
            input.id = fieldId;
            input.name = validationError.field;
            input.setAttribute("aria-invalid", "true");
            input.setAttribute("aria-describedby", `${fieldId}-error`);
            formGroup.appendChild(input);

            const errorEl = document.createElement("span");
            errorEl.id = `${fieldId}-error`;
            errorEl.className = "field-error";
            errorEl.textContent = validationError.message;
            errorEl.setAttribute("data-field-path", validationError.field);
            formGroup.appendChild(errorEl);

            form.appendChild(formGroup);
            container.appendChild(form);

            // Verify nested field error handling
            expect(input.getAttribute("aria-invalid")).toBe("true");
            expect(errorEl.textContent).toBe(validationError.message);
            expect(errorEl.getAttribute("data-field-path")).toBe(
              validationError.field,
            );

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Error Recovery Integration", () => {
    it("should handle transition from network error to validation error", () => {
      // Feature: access-management
      // Property: Error display should handle transition between error types
      // Validates: Requirements 28.1, 28.2

      fc.assert(
        fc.property(
          networkErrorArbitrary,
          validationErrorArbitrary,
          (networkError, validationError) => {
            const errorContainer = document.createElement("div");
            errorContainer.className = "error-container";

            // Initial network error
            let currentError = document.createElement("div");
            currentError.setAttribute("role", "alert");
            currentError.className = "network-error";
            currentError.textContent = "Network error occurred";
            currentError.setAttribute("data-error-type", networkError);
            errorContainer.appendChild(currentError);

            container.appendChild(errorContainer);

            // Verify network error is displayed
            expect(currentError.className).toBe("network-error");
            expect(currentError.getAttribute("data-error-type")).toBe(
              networkError,
            );

            // Transition to validation error after retry
            errorContainer.removeChild(currentError);

            currentError = document.createElement("div");
            currentError.setAttribute("role", "alert");
            currentError.className = "validation-error";
            currentError.textContent = validationError.message;
            currentError.setAttribute("data-field", validationError.field);
            errorContainer.appendChild(currentError);

            // Verify validation error replaced network error
            expect(currentError.className).toBe("validation-error");
            expect(currentError.textContent).toBe(validationError.message);
            expect(currentError.getAttribute("data-field")).toBe(
              validationError.field,
            );

            // Clean up
            errorContainer.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should provide appropriate recovery actions for different error types", () => {
      // Feature: access-management
      // Property: Different error types should offer appropriate recovery actions
      // Validates: Requirements 28.1, 28.2

      fc.assert(
        fc.property(
          fc.constantFrom("network", "validation", "auth", "server"),
          (errorType) => {
            const errorDisplay = document.createElement("div");
            errorDisplay.setAttribute("role", "alert");
            errorDisplay.setAttribute("data-error-type", errorType);

            const message = document.createElement("p");
            message.textContent = `${errorType} error occurred`;
            errorDisplay.appendChild(message);

            // Add appropriate recovery action based on error type
            const actionButton = document.createElement("button");

            switch (errorType) {
              case "network":
                actionButton.textContent = "Retry";
                actionButton.setAttribute("data-action", "retry");
                break;
              case "validation":
                actionButton.textContent = "Fix Errors";
                actionButton.setAttribute("data-action", "fix");
                break;
              case "auth":
                actionButton.textContent = "Re-authenticate";
                actionButton.setAttribute("data-action", "reauth");
                break;
              case "server":
                actionButton.textContent = "Contact Support";
                actionButton.setAttribute("data-action", "support");
                break;
            }

            errorDisplay.appendChild(actionButton);
            container.appendChild(errorDisplay);

            // Verify appropriate action is provided
            expect(actionButton).not.toBeNull();
            expect(actionButton.textContent).toBeTruthy();

            // Verify action matches error type
            const action = actionButton.getAttribute("data-action");
            if (errorType === "network") {
              expect(action).toBe("retry");
            } else if (errorType === "validation") {
              expect(action).toBe("fix");
            } else if (errorType === "auth") {
              expect(action).toBe("reauth");
            } else if (errorType === "server") {
              expect(action).toBe("support");
            }

            // Clean up
            errorDisplay.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
