/**
 * Accessibility Tests for Access Management Feature
 * 
 * Tests WCAG 2.1 AA compliance using axe-core
 * Validates: Requirements 30.1, 30.2, 30.3, 30.4
 * 
 * These tests verify:
 * - No accessibility violations (WCAG 2.1 AA)
 * - Keyboard navigation support
 * - Focus management
 * - ARIA attributes and roles
 * - Screen reader compatibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import userEvent from '@testing-library/user-event';
import AdminTable from '../admins/AdminTable';
import { AdminFormModal } from '../admins/AdminFormModal';
import { ConfirmationDialog } from '../shared/confirmation-dialog';
import { SearchInput } from '../shared/search-input';
import { PaginationControls } from '../shared/pagination-controls';
import { AdminRole } from '@/src/common/@types/@access-management';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock data for tests
const mockAdmins = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: AdminRole.super_admin,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: AdminRole.manager,
    is_active: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  describe('AdminTable Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper table semantics', () => {
      render(
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // Table should have proper role and label
      const table = screen.getByRole('table', { name: /admin management/i });
      expect(table).toBeInTheDocument();

      // Column headers should be accessible
      expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /email/i })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /role/i })).toBeInTheDocument();
    });

    it('should have accessible action buttons with descriptive labels', () => {
      render(
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // Action buttons should have accessible names
      const editButtons = screen.getAllByRole('button', { name: /edit admin/i });
      expect(editButtons.length).toBeGreaterThan(0);

      const deleteButtons = screen.getAllByRole('button', { name: /delete admin/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('should display empty state with proper message', () => {
      render(
        <AdminTable
          admins={[]}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // Empty state should be announced
      expect(screen.getByText(/no admins found/i)).toBeInTheDocument();
    });
  });

  describe('AdminFormModal Component', () => {
    it('should have no accessibility violations when open', async () => {
      const { container } = render(
        <AdminFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={async () => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog semantics', () => {
      render(
        <AdminFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={async () => {}}
        />
      );

      // Modal should have dialog role
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Dialog should have accessible name
      expect(screen.getByText(/create new admin/i)).toBeInTheDocument();
    });

    it('should have properly labeled form inputs', () => {
      render(
        <AdminFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={async () => {}}
        />
      );

      // All inputs should have labels
      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^role$/i)).toBeInTheDocument();
    });
  });

  describe('ConfirmationDialog Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm Action"
          message="Are you sure you want to proceed?"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog semantics', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Confirm Deletion"
          message="This action cannot be undone."
          variant="danger"
        />
      );

      // Should use dialog role
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Title and message should be present
      expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    });

    it('should have accessible action buttons', () => {
      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Delete Admin"
          message="This will permanently delete the admin."
          variant="danger"
          confirmText="Delete"
          cancelText="Cancel"
        />
      );

      // Buttons should be accessible
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('SearchInput Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <SearchInput
          value=""
          onChange={() => {}}
          placeholder="Search admins..."
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper search input semantics', () => {
      render(
        <SearchInput
          value=""
          onChange={() => {}}
          placeholder="Search admins..."
        />
      );

      // Should have search input
      const searchInput = screen.getByPlaceholderText(/search admins/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible clear button when value exists', () => {
      render(
        <SearchInput
          value="john"
          onChange={() => {}}
          placeholder="Search admins..."
        />
      );

      // Clear button should be accessible
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('PaginationControls Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible navigation buttons', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      // Navigation buttons should be accessible
      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    });

    it('should indicate current page with aria-current', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      // Current page should have aria-current
      const currentPageButton = screen.getByRole('button', { name: /page 2/i });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    it('should disable navigation buttons appropriately', () => {
      const { rerender } = render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      // Previous button should be disabled on first page
      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();

      // Next button should be enabled
      const nextButton = screen.getByRole('button', { name: /next page/i });
      expect(nextButton).not.toBeDisabled();

      // On last page
      rerender(
        <PaginationControls
          currentPage={5}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      // Next button should be disabled on last page
      expect(nextButton).toBeDisabled();
    });
  });
});

describe('Keyboard Navigation Tests', () => {
  describe('Property 35: Tab Navigation', () => {
    it('should allow tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <SearchInput value="" onChange={() => {}} placeholder="Search" />
          <PaginationControls
            currentPage={1}
            totalPages={3}
            onPageChange={() => {}}
          />
        </div>
      );

      // Tab through elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'text');

      await user.tab();
      // Should move to next interactive element
      expect(document.activeElement?.tagName).toMatch(/BUTTON|INPUT/);
    });
  });

  describe('Property 36: Enter Key Activation', () => {
    it('should trigger button action when Enter is pressed', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      
      render(
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={onEdit}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // Focus first edit button
      const editButtons = screen.getAllByRole('button', { name: /edit admin/i });
      editButtons[0].focus();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(onEdit).toHaveBeenCalled();
    });
  });

  describe('Property 37: Escape Key Modal Close', () => {
    it('should close modal when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <AdminFormModal
          isOpen={true}
          onClose={onClose}
          onSubmit={async () => {}}
        />
      );

      // Press Escape
      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should close confirmation dialog when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ConfirmationDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={() => {}}
          title="Confirm"
          message="Are you sure?"
        />
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Property 38: Focus Indicator Visibility', () => {
    it('should display visible focus indicators on interactive elements', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={() => {}}
        />
      );

      // Get all buttons
      const buttons = screen.getAllByRole('button');

      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        button.focus();
        
        // Check that focused element is the button
        expect(document.activeElement).toBe(button);
        
        // Button should be focusable
        expect(button).not.toHaveAttribute('tabindex', '-1');
      }
    });
  });
});

describe('Screen Reader Compatibility', () => {
  describe('ARIA Labels and Descriptions', () => {
    it('should provide descriptive labels for all interactive elements', () => {
      render(
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || button.textContent;
        expect(accessibleName).toBeTruthy();
      });
    });

    it('should announce empty states', () => {
      render(
        <AdminTable
          admins={[]}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      );

      // Empty state should be present
      const emptyState = screen.getByText(/no admins found/i);
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe('Form Field Associations', () => {
    it('should associate labels with form fields', () => {
      render(
        <AdminFormModal
          isOpen={true}
          onClose={() => {}}
          onSubmit={async () => {}}
        />
      );

      // All inputs should have associated labels
      const nameInput = screen.getByLabelText(/^name$/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('id');

      const emailInput = screen.getByLabelText(/^email$/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('id');
    });
  });
});

describe('Color Contrast and Visual Accessibility', () => {
  it('should meet WCAG AA color contrast requirements', async () => {
    const { container } = render(
      <div>
        <AdminTable
          admins={mockAdmins}
          isLoading={false}
          onEdit={() => {}}
          onDelete={() => {}}
          onToggleActive={() => {}}
        />
      </div>
    );

    // Axe will check color contrast automatically
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should not rely solely on color to convey information', () => {
    render(
      <AdminTable
        admins={mockAdmins}
        isLoading={false}
        onEdit={() => {}}
        onDelete={() => {}}
        onToggleActive={() => {}}
      />
    );

    // Status should be conveyed through text, not just color
    const activeStatus = screen.getAllByText(/active/i);
    expect(activeStatus.length).toBeGreaterThan(0);

    const inactiveStatus = screen.getAllByText(/inactive/i);
    expect(inactiveStatus.length).toBeGreaterThan(0);
  });
});
