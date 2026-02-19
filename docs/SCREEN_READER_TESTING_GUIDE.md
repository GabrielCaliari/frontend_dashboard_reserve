# Screen Reader Testing Guide for Access Management

This guide provides instructions for manual screen reader testing of the Access Management feature to ensure WCAG 2.1 AA compliance and optimal accessibility.

## Overview

Screen reader testing is essential for verifying that users with visual impairments can effectively navigate and use the Access Management interface. While automated tests (axe-core) catch many accessibility issues, manual testing with actual screen readers is necessary to ensure a quality user experience.

## Supported Screen Readers

### Primary Testing Targets

| Screen Reader | Operating System | Browser | Priority |
|--------------|------------------|---------|----------|
| **NVDA** | Windows | Firefox | High |
| **JAWS** | Windows | Chrome | High |
| **VoiceOver** | macOS | Safari | High |
| **VoiceOver** | iOS | Safari | Medium |
| **TalkBack** | Android | Chrome | Medium |

### Recommended Testing Setup

**Minimum Testing**: NVDA + Firefox (free and widely used)
**Comprehensive Testing**: NVDA + JAWS on Windows, VoiceOver on macOS

## Screen Reader Basics

### NVDA (Windows)

**Installation**: Download from [nvaccess.org](https://www.nvaccess.org/)

**Essential Commands**:
- `Ctrl` - Stop reading
- `Insert + Down Arrow` - Read from current position
- `Insert + Space` - Toggle browse/focus mode
- `Tab` - Navigate to next interactive element
- `Shift + Tab` - Navigate to previous interactive element
- `H` - Navigate to next heading
- `T` - Navigate to next table
- `B` - Navigate to next button
- `F` - Navigate to next form field
- `Insert + F7` - List all links
- `Insert + F5` - List all form fields

### JAWS (Windows)

**Installation**: Commercial software from [freedomscientific.com](https://www.freedomscientific.com/products/software/jaws/)

**Essential Commands**:
- `Ctrl` - Stop reading
- `Insert + Down Arrow` - Read from current position
- `Insert + Space` - Toggle virtual cursor/forms mode
- `Tab` - Navigate to next interactive element
- `H` - Navigate to next heading
- `T` - Navigate to next table
- `B` - Navigate to next button
- `F` - Navigate to next form field
- `Insert + F5` - List all form fields
- `Insert + F6` - List all headings
- `Insert + F7` - List all links

### VoiceOver (macOS)

**Activation**: `Cmd + F5`

**Essential Commands**:
- `VO + A` - Read from current position (VO = Ctrl + Option)
- `VO + Right/Left Arrow` - Navigate elements
- `VO + Space` - Activate element
- `VO + Shift + Down Arrow` - Enter interactive element
- `VO + Shift + Up Arrow` - Exit interactive element
- `VO + U` - Open rotor (lists navigation)
- `VO + H` - Next heading
- `VO + J` - Next form control
- `VO + X` - Next list
- `VO + R` - Next table

## Testing Checklist

### 1. Admin Management Pages

#### Admin List Page (`/dashboard/access-management/admins`)

**Test Scenarios**:

- [ ] **Page Load**
  - Screen reader announces page title
  - Main heading is announced correctly
  - Number of admins in list is announced

- [ ] **Table Navigation**
  - Table is identified as a table
  - Column headers are announced when navigating cells
  - Row count is announced
  - Each admin's information is read in logical order

- [ ] **Search Functionality**
  - Search input is identified with proper label
  - Typing in search announces character/word feedback
  - Search results count is announced
  - Empty state is announced when no results

- [ ] **Action Buttons**
  - Edit button announces "Edit [Admin Name]"
  - Delete button announces "Delete [Admin Name]"
  - Activate/Deactivate button announces current state
  - Button purpose is clear from announcement

- [ ] **Pagination**
  - Pagination controls are identified as navigation
  - Current page is announced
  - Total pages is announced
  - Previous/Next buttons announce disabled state appropriately

#### Admin Detail Page (`/dashboard/access-management/admins/[id]`)

**Test Scenarios**:

- [ ] **Page Load**
  - Admin name is announced in page title
  - All admin details are announced in logical order

- [ ] **Assigned Tenants Section**
  - Section heading is announced
  - List of tenants is identified as a list
  - Each tenant relationship is announced with role
  - Empty state is announced if no tenants

- [ ] **Back Navigation**
  - Back button is clearly identified
  - Purpose is announced

#### Admin Form Modal (Create/Edit)

**Test Scenarios**:

- [ ] **Modal Opening**
  - Focus moves to modal when opened
  - Modal title is announced
  - User is informed they're in a dialog

- [ ] **Form Fields**
  - Each field label is announced before the input
  - Required fields are identified as required
  - Field type is announced (text, email, password, select)
  - Current value is announced for edit mode

- [ ] **Validation Errors**
  - Errors are announced immediately when triggered
  - Error message is associated with the field
  - User is informed how to fix the error

- [ ] **Form Submission**
  - Submit button purpose is clear
  - Loading state is announced during submission
  - Success message is announced after submission
  - Error message is announced if submission fails

- [ ] **Modal Closing**
  - Cancel button purpose is clear
  - Escape key closes modal (announced)
  - Focus returns to trigger element after closing

### 2. Tenant Management Pages

#### Tenant List Page (`/dashboard/access-management/tenants`)

**Test Scenarios**:

- [ ] **Table Navigation**
  - Tenant name, slug, domain are announced
  - Status (active/inactive) is announced clearly
  - Status is not conveyed by color alone

- [ ] **Action Buttons**
  - All actions are clearly announced
  - Assign Admin button purpose is clear

#### Tenant Detail Page (`/dashboard/access-management/tenants/[id]`)

**Test Scenarios**:

- [ ] **Assigned Admins Section**
  - List of admins is identified
  - Each admin's name, email, and role are announced
  - Edit role button purpose is clear
  - Remove admin button purpose is clear

#### Assign Admin Modal

**Test Scenarios**:

- [ ] **Admin Selection**
  - Dropdown is identified as a combobox
  - Available admins are announced
  - Selected admin is announced

- [ ] **Role Selection**
  - Role dropdown is properly labeled
  - Available roles are announced
  - Selected role is announced

### 3. User Management Pages

#### User List Page (`/dashboard/access-management/users`)

**Test Scenarios**:

- [ ] **Table Navigation**
  - User information is announced in logical order
  - Status is announced clearly

- [ ] **Action Buttons**
  - Edit, Deactivate, Delete buttons are clearly announced

### 4. Shared Components

#### Confirmation Dialog

**Test Scenarios**:

- [ ] **Dialog Opening**
  - Dialog is identified as an alert dialog for dangerous actions
  - Title is announced
  - Message is announced
  - User understands the consequence

- [ ] **Button Focus**
  - For dangerous actions, focus is on Cancel button
  - For safe actions, focus is on Confirm button
  - Button purposes are clear

- [ ] **Dialog Closing**
  - Escape key closes dialog
  - Focus returns to trigger element

#### Loading States

**Test Scenarios**:

- [ ] **Loading Indicators**
  - Loading state is announced when data is fetching
  - User is informed what is loading
  - Loading completion is announced

#### Toast Notifications

**Test Scenarios**:

- [ ] **Success Messages**
  - Success is announced with polite priority
  - Message content is clear

- [ ] **Error Messages**
  - Error is announced with assertive priority
  - Error message is clear and actionable

## Common Issues to Check

### 1. Missing or Incorrect Labels

**Problem**: Form inputs without labels or with generic labels like "Input"

**How to Test**:
- Navigate to each form field
- Verify the label is announced before the input
- Verify the label is descriptive and unique

**Expected**: "Email address, edit text" not "Input, edit text"

### 2. Unclear Button Purposes

**Problem**: Buttons with generic labels like "Edit" without context

**How to Test**:
- Navigate to action buttons in tables
- Verify the button announces what it will edit

**Expected**: "Edit John Doe" not just "Edit"

### 3. Missing Focus Management

**Problem**: Focus not moving to modal when opened, or not returning after closing

**How to Test**:
- Open a modal and verify focus moves inside
- Close modal and verify focus returns to trigger

**Expected**: Focus is managed automatically

### 4. Inaccessible Dynamic Content

**Problem**: Content changes without announcement (search results, validation errors)

**How to Test**:
- Perform search and verify results count is announced
- Submit invalid form and verify errors are announced

**Expected**: Changes are announced via live regions

### 5. Keyboard Traps

**Problem**: User cannot escape from a component using keyboard

**How to Test**:
- Navigate into modals, dropdowns, and complex components
- Try to navigate out using Tab, Shift+Tab, and Escape

**Expected**: User can always escape using keyboard

### 6. Missing Table Semantics

**Problem**: Data tables not identified as tables, or missing headers

**How to Test**:
- Navigate to data tables
- Verify table is announced as a table
- Navigate cells and verify headers are announced

**Expected**: "Table with 3 columns and 10 rows. Name column header. John Doe."

### 7. Color-Only Information

**Problem**: Status conveyed only through color (red/green)

**How to Test**:
- Navigate to status indicators
- Verify text is announced (Active/Inactive)

**Expected**: Status is conveyed through text, not just color

## Testing Workflow

### Step 1: Preparation

1. Install screen reader (NVDA recommended for beginners)
2. Open browser (Firefox for NVDA, Chrome for JAWS, Safari for VoiceOver)
3. Navigate to Access Management feature
4. Start screen reader
5. Close your eyes or look away from screen (important!)

### Step 2: Initial Navigation

1. Navigate to the page using only keyboard and screen reader
2. Listen to page title and main heading
3. Use heading navigation (H key) to understand page structure
4. Use landmark navigation to find main content

### Step 3: Systematic Testing

1. Work through each section of the checklist above
2. Document any issues found
3. Note the severity (blocker, major, minor)
4. Take notes on the exact announcement heard

### Step 4: Task-Based Testing

Perform realistic tasks using only the screen reader:

**Task 1: Create a New Admin**
1. Navigate to Admin Management
2. Find and activate "Create Admin" button
3. Fill out the form
4. Submit the form
5. Verify success message

**Task 2: Search and Edit an Admin**
1. Use search to find a specific admin
2. Navigate to the admin in results
3. Activate edit button
4. Modify information
5. Save changes

**Task 3: Assign Admin to Tenant**
1. Navigate to Tenant Management
2. Select a tenant
3. Find "Assign Admin" button
4. Select admin and role
5. Confirm assignment

### Step 5: Documentation

For each issue found, document:

- **Component**: Which component has the issue
- **Issue**: What is wrong
- **Severity**: Blocker / Major / Minor
- **Steps to Reproduce**: How to encounter the issue
- **Expected**: What should happen
- **Actual**: What actually happens
- **Screen Reader**: Which screen reader was used

## Issue Severity Guidelines

### Blocker
- User cannot complete critical tasks
- Keyboard trap prevents navigation
- Form cannot be submitted
- Modal cannot be closed

### Major
- Important information not announced
- Confusing or misleading announcements
- Missing labels on form fields
- Unclear button purposes

### Minor
- Verbose announcements
- Suboptimal navigation order
- Missing helpful hints
- Inconsistent patterns

## Reporting Issues

When reporting accessibility issues, include:

1. **Title**: Brief description of the issue
2. **Component**: Which component is affected
3. **Requirement**: Which WCAG criterion is violated (if applicable)
4. **Screen Reader**: Which screen reader was used
5. **Steps to Reproduce**: Detailed steps
6. **Expected Behavior**: What should happen
7. **Actual Behavior**: What actually happens
8. **Severity**: Blocker / Major / Minor
9. **Screenshot/Recording**: If helpful

## Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)

### Screen Reader Documentation
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Documentation](https://www.freedomscientific.com/training/jaws/)
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)

### Testing Tools
- [axe DevTools Browser Extension](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Accessibility Insights](https://accessibilityinsights.io/)

### Learning Resources
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Deque University](https://dequeuniversity.com/)
- [A11ycasts with Rob Dodson](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)

## Continuous Testing

Accessibility testing should be performed:

- **During Development**: Test each component as it's built
- **Before PR Merge**: Run automated tests and spot-check with screen reader
- **Before Release**: Comprehensive manual testing with multiple screen readers
- **After Major Changes**: Re-test affected components
- **Quarterly**: Full accessibility audit

## Success Criteria

The Access Management feature passes screen reader testing when:

1. ✅ All automated axe-core tests pass
2. ✅ All tasks in the checklist can be completed using only a screen reader
3. ✅ No blocker or major severity issues remain
4. ✅ All interactive elements have clear, descriptive labels
5. ✅ All dynamic content changes are announced appropriately
6. ✅ Focus management works correctly in all scenarios
7. ✅ Keyboard navigation is logical and complete
8. ✅ Information is not conveyed by color alone
9. ✅ All form validation errors are announced and associated with fields
10. ✅ Loading states and status changes are announced

## Notes

- Screen reader testing requires practice. Don't be discouraged if it feels awkward at first.
- Close your eyes or look away during testing to experience what blind users experience.
- Test with actual users with disabilities when possible.
- Accessibility is not a one-time task—it requires ongoing attention and testing.
