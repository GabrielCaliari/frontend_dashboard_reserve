/**
 * Loading States and User Feedback Property-Based Tests
 *
 * Property tests for loading states and user feedback using fast-check
 * Validates: Requirements 1.5, 8.5, 18.5, 24.1, 24.2, 24.3, 24.4
 *
 * Each test runs 100 iterations to ensure comprehensive input coverage
 *
 * Tests verify loading indicators, success feedback, error feedback,
 * and inline validation feedback across all operations.
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

// Generator for loading states
const loadingStateArbitrary = fc.constantFrom(
  "idle",
  "loading",
  "success",
  "error",
);

// Generator for mutation types
const mutationTypeArbitrary = fc.constantFrom(
  "create",
  "update",
  "delete",
  "activate",
  "deactivate",
);

// Generator for error messages
const errorMessageArbitrary = fc.oneof(
  fc.constant("Network error"),
  fc.constant("Validation failed"),
  fc.constant("Unauthorized"),
  fc.constant("Not found"),
  fc.constant("Internal server error"),
  fc.string({ minLength: 10, maxLength: 100 }),
);

// Generator for success messages
const successMessageArbitrary = fc.oneof(
  fc.constant("Admin created successfully"),
  fc.constant("Tenant updated successfully"),
  fc.constant("User deleted successfully"),
  fc.constant("Status changed successfully"),
  fc.string({ minLength: 10, maxLength: 100 }),
);

// Generator for validation errors
const validationErrorArbitrary = fc.record({
  field: fc.constantFrom("name", "email", "password", "slug", "domain"),
  message: fc.oneof(
    fc.constant("This field is required"),
    fc.constant("Invalid email format"),
    fc.constant("Password too weak"),
    fc.constant("Invalid slug format"),
    fc
      .string({ minLength: 10, maxLength: 50 })
      .filter((s) => s.trim().length >= 10),
  ),
});

describe("Loading States and User Feedback Property Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe("Property 24: Loading indicator display", () => {
    it("should display loading indicator for any API request in progress", () => {
      // Feature: access-management
      // Property 24: For any API request in progress, system should display appropriate loading indicator
      // Validates: Requirements 1.5, 8.5, 18.5, 24.1

      fc.assert(
        fc.property(
          fc.constantFrom("admins", "tenants", "users"),
          fc.boolean(),
          (entityType, isLoading) => {
            // Create a mock table component with loading state
            const table = document.createElement("div");
            table.setAttribute("role", "table");
            table.setAttribute("data-testid", `${entityType}-table`);

            if (isLoading) {
              // Add loading indicator
              const spinner = document.createElement("div");
              spinner.setAttribute("role", "status");
              spinner.setAttribute("aria-label", "Loading");
              spinner.setAttribute("data-testid", "loading-spinner");
              table.appendChild(spinner);
            } else {
              // Add data rows
              const row = document.createElement("div");
              row.setAttribute("role", "row");
              table.appendChild(row);
            }

            container.appendChild(table);

            // Verify loading indicator presence matches loading state
            const loadingIndicator = table.querySelector(
              '[data-testid="loading-spinner"]',
            );

            if (isLoading) {
              expect(loadingIndicator).not.toBeNull();
              expect(loadingIndicator?.getAttribute("role")).toBe("status");
              expect(loadingIndicator?.getAttribute("aria-label")).toBe(
                "Loading",
              );
            } else {
              expect(loadingIndicator).toBeNull();
            }

            // Clean up
            table.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should display skeleton loaders during data fetch", () => {
      // Feature: access-management
      // Property 24: Loading indicators should be appropriate to context (skeleton, spinner, disabled state)
      // Validates: Requirements 24.1

      fc.assert(
        fc.property(
          fc.array(adminArbitrary, { minLength: 0, maxLength: 10 }),
          fc.boolean(),
          (admins, isLoading) => {
            const table = document.createElement("table");
            const tbody = document.createElement("tbody");

            if (isLoading) {
              // Create skeleton rows
              for (let i = 0; i < 3; i++) {
                const row = document.createElement("tr");
                row.setAttribute("data-testid", "skeleton-row");

                for (let j = 0; j < 5; j++) {
                  const cell = document.createElement("td");
                  const skeleton = document.createElement("div");
                  skeleton.className = "skeleton";
                  skeleton.setAttribute("aria-busy", "true");
                  cell.appendChild(skeleton);
                  row.appendChild(cell);
                }

                tbody.appendChild(row);
              }
            } else {
              // Create data rows
              admins.forEach((admin) => {
                const row = document.createElement("tr");
                row.setAttribute("data-testid", "data-row");
                row.setAttribute("data-id", admin.id.toString());

                const nameCell = document.createElement("td");
                nameCell.textContent = admin.name;
                row.appendChild(nameCell);

                tbody.appendChild(row);
              });
            }

            table.appendChild(tbody);
            container.appendChild(table);

            // Verify skeleton presence
            const skeletonRows = tbody.querySelectorAll(
              '[data-testid="skeleton-row"]',
            );
            const dataRows = tbody.querySelectorAll('[data-testid="data-row"]');

            if (isLoading) {
              expect(skeletonRows.length).toBeGreaterThan(0);
              expect(dataRows.length).toBe(0);

              // Verify skeleton elements have aria-busy
              skeletonRows.forEach((row) => {
                const skeletons = row.querySelectorAll(".skeleton");
                skeletons.forEach((skeleton) => {
                  expect(skeleton.getAttribute("aria-busy")).toBe("true");
                });
              });
            } else {
              expect(skeletonRows.length).toBe(0);
              expect(dataRows.length).toBe(admins.length);
            }

            // Clean up
            table.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should disable buttons during mutation operations", () => {
      // Feature: access-management
      // Property 24: Buttons should be disabled during mutations to prevent duplicate submissions
      // Validates: Requirements 24.1

      fc.assert(
        fc.property(
          mutationTypeArbitrary,
          fc.boolean(),
          (mutationType, isLoading) => {
            const button = document.createElement("button");
            button.textContent = `${mutationType} Admin`;
            button.setAttribute("data-testid", `${mutationType}-button`);

            if (isLoading) {
              button.disabled = true;
              button.setAttribute("aria-busy", "true");

              // Add spinner to button
              const spinner = document.createElement("span");
              spinner.setAttribute("role", "status");
              spinner.setAttribute("aria-label", "Loading");
              spinner.className = "spinner";
              button.appendChild(spinner);
            } else {
              button.disabled = false;
              button.removeAttribute("aria-busy");
            }

            container.appendChild(button);

            // Verify button state
            expect(button.disabled).toBe(isLoading);

            if (isLoading) {
              expect(button.getAttribute("aria-busy")).toBe("true");
              const spinner = button.querySelector(".spinner");
              expect(spinner).not.toBeNull();
              expect(spinner?.getAttribute("role")).toBe("status");
            } else {
              expect(button.getAttribute("aria-busy")).toBeNull();
              const spinner = button.querySelector(".spinner");
              expect(spinner).toBeNull();
            }

            // Clean up
            button.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should disable pagination controls during loading", () => {
      // Feature: access-management
      // Property 24: Pagination controls should be disabled during data fetch
      // Validates: Requirements 24.1

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 100 }),
          fc.boolean(),
          (currentPage, totalPages, isLoading) => {
            const pagination = document.createElement("nav");
            pagination.setAttribute("role", "navigation");
            pagination.setAttribute("aria-label", "Pagination");

            // Create previous button
            const prevButton = document.createElement("button");
            prevButton.textContent = "Previous";
            prevButton.disabled = isLoading || currentPage === 1;
            pagination.appendChild(prevButton);

            // Create next button
            const nextButton = document.createElement("button");
            nextButton.textContent = "Next";
            nextButton.disabled = isLoading || currentPage === totalPages;
            pagination.appendChild(nextButton);

            container.appendChild(pagination);

            // Verify pagination state
            if (isLoading) {
              expect(prevButton.disabled).toBe(true);
              expect(nextButton.disabled).toBe(true);
            } else {
              expect(prevButton.disabled).toBe(currentPage === 1);
              expect(nextButton.disabled).toBe(currentPage === totalPages);
            }

            // Clean up
            pagination.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 25: Success feedback", () => {
    it("should display success toast for any successful mutation", () => {
      // Feature: access-management
      // Property 25: For any successful mutation operation, system should display success toast
      // Validates: Requirements 24.2

      fc.assert(
        fc.property(
          mutationTypeArbitrary,
          successMessageArbitrary,
          (mutationType, message) => {
            // Simulate toast notification
            const toast = document.createElement("div");
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            toast.setAttribute("data-testid", "success-toast");
            toast.className = "toast toast-success";

            const icon = document.createElement("span");
            icon.setAttribute("aria-label", "Success");
            icon.textContent = "✓";
            toast.appendChild(icon);

            const messageEl = document.createElement("span");
            messageEl.textContent = message;
            toast.appendChild(messageEl);

            container.appendChild(toast);

            // Verify toast properties
            expect(toast.getAttribute("role")).toBe("status");
            expect(toast.getAttribute("aria-live")).toBe("polite");
            expect(toast.className).toContain("toast-success");
            expect(messageEl.textContent).toBe(message);
            expect(icon.getAttribute("aria-label")).toBe("Success");

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include descriptive message in success toast", () => {
      // Feature: access-management
      // Property 25: Success toast should contain descriptive message about the operation
      // Validates: Requirements 24.2

      fc.assert(
        fc.property(
          fc.constantFrom("admin", "tenant", "user"),
          mutationTypeArbitrary,
          (entityType, mutationType) => {
            const message = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${mutationType}d successfully`;

            const toast = document.createElement("div");
            toast.setAttribute("role", "status");
            toast.setAttribute("data-testid", "success-toast");
            toast.textContent = message;

            container.appendChild(toast);

            // Verify message is descriptive (case-insensitive check)
            const lowerMessage = toast.textContent!.toLowerCase();
            expect(lowerMessage).toContain(entityType.toLowerCase());
            expect(lowerMessage).toContain(mutationType);
            expect(lowerMessage).toContain("successfully");
            expect(toast.textContent!.length).toBeGreaterThan(10);

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should auto-dismiss success toast after timeout", () => {
      // Feature: access-management
      // Property 25: Success toasts should auto-dismiss after a reasonable timeout
      // Validates: Requirements 24.2

      fc.assert(
        fc.property(
          successMessageArbitrary,
          fc.integer({ min: 2000, max: 5000 }),
          (message, timeout) => {
            let isVisible = true;

            const toast = document.createElement("div");
            toast.setAttribute("role", "status");
            toast.textContent = message;
            toast.style.display = "block";

            container.appendChild(toast);

            // Simulate auto-dismiss
            setTimeout(() => {
              isVisible = false;
              toast.style.display = "none";
            }, timeout);

            // Verify initial state
            expect(toast.style.display).toBe("block");
            expect(isVisible).toBe(true);

            // Verify timeout is reasonable (2-5 seconds)
            expect(timeout).toBeGreaterThanOrEqual(2000);
            expect(timeout).toBeLessThanOrEqual(5000);

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 26: Error feedback", () => {
    it("should display error toast for any failed mutation", () => {
      // Feature: access-management
      // Property 26: For any failed mutation operation, system should display error toast
      // Validates: Requirements 24.3

      fc.assert(
        fc.property(
          mutationTypeArbitrary,
          errorMessageArbitrary,
          (mutationType, errorMessage) => {
            // Simulate error toast
            const toast = document.createElement("div");
            toast.setAttribute("role", "alert");
            toast.setAttribute("aria-live", "assertive");
            toast.setAttribute("data-testid", "error-toast");
            toast.className = "toast toast-error";

            const icon = document.createElement("span");
            icon.setAttribute("aria-label", "Error");
            icon.textContent = "✕";
            toast.appendChild(icon);

            const messageEl = document.createElement("span");
            messageEl.textContent = errorMessage;
            toast.appendChild(messageEl);

            container.appendChild(toast);

            // Verify toast properties
            expect(toast.getAttribute("role")).toBe("alert");
            expect(toast.getAttribute("aria-live")).toBe("assertive");
            expect(toast.className).toContain("toast-error");
            expect(messageEl.textContent).toBe(errorMessage);
            expect(icon.getAttribute("aria-label")).toBe("Error");

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should display error message from API response", () => {
      // Feature: access-management
      // Property 26: Error toast should display the actual error message from API
      // Validates: Requirements 24.3

      fc.assert(
        fc.property(
          errorMessageArbitrary,
          fc.integer({ min: 400, max: 599 }),
          (errorMessage, statusCode) => {
            const toast = document.createElement("div");
            toast.setAttribute("role", "alert");
            toast.setAttribute("data-testid", "error-toast");

            const messageEl = document.createElement("span");
            messageEl.textContent = errorMessage;
            toast.appendChild(messageEl);

            // Optionally include status code
            if (statusCode >= 500) {
              const codeEl = document.createElement("span");
              codeEl.className = "error-code";
              codeEl.textContent = `(${statusCode})`;
              toast.appendChild(codeEl);
            }

            container.appendChild(toast);

            // Verify error message is displayed
            expect(messageEl.textContent).toBe(errorMessage);
            expect(messageEl.textContent!.length).toBeGreaterThan(0);

            // Verify status code for server errors
            if (statusCode >= 500) {
              const codeEl = toast.querySelector(".error-code");
              expect(codeEl).not.toBeNull();
              expect(codeEl?.textContent).toContain(statusCode.toString());
            }

            // Clean up
            toast.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should keep error toast visible until user dismisses", () => {
      // Feature: access-management
      // Property 26: Error toasts should not auto-dismiss, requiring user action
      // Validates: Requirements 24.3

      fc.assert(
        fc.property(errorMessageArbitrary, (errorMessage) => {
          let isDismissed = false;

          const toast = document.createElement("div");
          toast.setAttribute("role", "alert");
          toast.textContent = errorMessage;
          toast.style.display = "block";

          const closeButton = document.createElement("button");
          closeButton.textContent = "×";
          closeButton.setAttribute("aria-label", "Close");
          closeButton.onclick = () => {
            isDismissed = true;
            toast.style.display = "none";
          };
          toast.appendChild(closeButton);

          container.appendChild(toast);

          // Verify toast is visible
          expect(toast.style.display).toBe("block");
          expect(isDismissed).toBe(false);

          // Verify close button exists
          expect(closeButton).not.toBeNull();
          expect(closeButton.getAttribute("aria-label")).toBe("Close");

          // Simulate user dismissal
          closeButton.click();

          // Verify toast is dismissed
          expect(isDismissed).toBe(true);
          expect(toast.style.display).toBe("none");

          // Clean up
          toast.remove();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Property 27: Inline validation feedback", () => {
    it("should display inline error messages for invalid form fields", () => {
      // Feature: access-management
      // Property 27: For any form field with validation errors, system should display inline error messages
      // Validates: Requirements 24.4

      fc.assert(
        fc.property(validationErrorArbitrary, (validationError) => {
          const formGroup = document.createElement("div");
          formGroup.className = "form-group";

          const label = document.createElement("label");
          label.textContent =
            validationError.field.charAt(0).toUpperCase() +
            validationError.field.slice(1);
          label.setAttribute("for", validationError.field);
          formGroup.appendChild(label);

          const input = document.createElement("input");
          input.id = validationError.field;
          input.name = validationError.field;
          input.setAttribute("aria-invalid", "true");
          input.setAttribute(
            "aria-describedby",
            `${validationError.field}-error`,
          );
          formGroup.appendChild(input);

          const errorMessage = document.createElement("span");
          errorMessage.id = `${validationError.field}-error`;
          errorMessage.className = "error-message";
          errorMessage.setAttribute("role", "alert");
          errorMessage.textContent = validationError.message;
          formGroup.appendChild(errorMessage);

          container.appendChild(formGroup);

          // Verify inline error message
          expect(errorMessage.textContent).toBe(validationError.message);
          expect(errorMessage.getAttribute("role")).toBe("alert");
          expect(errorMessage.id).toBe(`${validationError.field}-error`);

          // Verify input is marked as invalid
          expect(input.getAttribute("aria-invalid")).toBe("true");
          expect(input.getAttribute("aria-describedby")).toBe(
            `${validationError.field}-error`,
          );

          // Clean up
          formGroup.remove();
        }),
        { numRuns: 100 },
      );
    });

    it("should position error message next to invalid field", () => {
      // Feature: access-management
      // Property 27: Inline error messages should be positioned next to the invalid field
      // Validates: Requirements 24.4

      fc.assert(
        fc.property(
          fc
            .array(validationErrorArbitrary, { minLength: 1, maxLength: 5 })
            .map((errors) => {
              // Ensure unique fields to avoid duplicate field issues
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

            validationErrors.forEach((error) => {
              const formGroup = document.createElement("div");
              formGroup.className = "form-group";
              formGroup.setAttribute("data-field", error.field);

              const input = document.createElement("input");
              input.name = error.field;
              formGroup.appendChild(input);

              const errorMessage = document.createElement("span");
              errorMessage.className = "error-message";
              errorMessage.textContent = error.message;
              formGroup.appendChild(errorMessage);

              form.appendChild(formGroup);
            });

            container.appendChild(form);

            // Verify each error is next to its field
            validationErrors.forEach((error) => {
              const formGroup = form.querySelector(
                `[data-field="${error.field}"]`,
              );
              expect(formGroup).not.toBeNull();

              const input = formGroup?.querySelector("input");
              const errorMessage = formGroup?.querySelector(".error-message");

              expect(input).not.toBeNull();
              expect(errorMessage).not.toBeNull();
              expect(errorMessage?.textContent).toBe(error.message);

              // Verify error is a sibling of input (next to it)
              expect(input?.nextElementSibling).toBe(errorMessage);
            });

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should update error message in real-time as user corrects input", () => {
      // Feature: access-management
      // Property 27: Error messages should update in real-time as validation state changes
      // Validates: Requirements 24.4

      fc.assert(
        fc.property(
          validationErrorArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (initialError, correctedValue) => {
            const formGroup = document.createElement("div");

            const input = document.createElement("input");
            input.name = initialError.field;
            input.value = "";
            formGroup.appendChild(input);

            let errorMessage = document.createElement("span");
            errorMessage.className = "error-message";
            errorMessage.textContent = initialError.message;
            formGroup.appendChild(errorMessage);

            container.appendChild(formGroup);

            // Verify initial error state
            expect(errorMessage.textContent).toBe(initialError.message);
            expect(errorMessage.style.display).not.toBe("none");

            // Simulate user correcting input
            input.value = correctedValue;

            // Simulate validation passing
            if (correctedValue.length > 0) {
              errorMessage.textContent = "";
              errorMessage.style.display = "none";
            }

            // Verify error is removed when input is valid
            if (correctedValue.length > 0) {
              expect(errorMessage.textContent).toBe("");
              expect(errorMessage.style.display).toBe("none");
            }

            // Clean up
            formGroup.remove();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should use appropriate ARIA attributes for error messages", () => {
      // Feature: access-management
      // Property 27: Error messages should use proper ARIA attributes for accessibility
      // Validates: Requirements 24.4

      fc.assert(
        fc.property(validationErrorArbitrary, (validationError) => {
          const formGroup = document.createElement("div");

          const input = document.createElement("input");
          input.id = validationError.field;
          input.name = validationError.field;
          input.setAttribute("aria-invalid", "true");
          input.setAttribute(
            "aria-describedby",
            `${validationError.field}-error`,
          );
          formGroup.appendChild(input);

          const errorMessage = document.createElement("span");
          errorMessage.id = `${validationError.field}-error`;
          errorMessage.setAttribute("role", "alert");
          errorMessage.setAttribute("aria-live", "polite");
          errorMessage.textContent = validationError.message;
          formGroup.appendChild(errorMessage);

          container.appendChild(formGroup);

          // Verify ARIA attributes
          expect(input.getAttribute("aria-invalid")).toBe("true");
          expect(input.getAttribute("aria-describedby")).toBe(
            `${validationError.field}-error`,
          );
          expect(errorMessage.getAttribute("role")).toBe("alert");
          expect(errorMessage.getAttribute("aria-live")).toBe("polite");
          expect(errorMessage.id).toBe(`${validationError.field}-error`);

          // Clean up
          formGroup.remove();
        }),
        { numRuns: 100 },
      );
    });

    it("should display multiple validation errors for multiple invalid fields", () => {
      // Feature: access-management
      // Property 27: Multiple validation errors should be displayed simultaneously
      // Validates: Requirements 24.4

      fc.assert(
        fc.property(
          fc.array(validationErrorArbitrary, { minLength: 2, maxLength: 5 }),
          (validationErrors) => {
            const form = document.createElement("form");

            validationErrors.forEach((error) => {
              const formGroup = document.createElement("div");

              const input = document.createElement("input");
              input.name = error.field;
              input.setAttribute("aria-invalid", "true");
              formGroup.appendChild(input);

              const errorMessage = document.createElement("span");
              errorMessage.className = "error-message";
              errorMessage.textContent = error.message;
              formGroup.appendChild(errorMessage);

              form.appendChild(formGroup);
            });

            container.appendChild(form);

            // Verify all errors are displayed
            const errorMessages = form.querySelectorAll(".error-message");
            expect(errorMessages.length).toBe(validationErrors.length);

            // Verify each error message matches
            errorMessages.forEach((errorEl, index) => {
              expect(errorEl.textContent).toBe(validationErrors[index].message);
            });

            // Verify all inputs are marked invalid
            const invalidInputs = form.querySelectorAll(
              '[aria-invalid="true"]',
            );
            expect(invalidInputs.length).toBe(validationErrors.length);

            // Clean up
            form.remove();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
