# Implementation Tasks

## Phase 1: Foundation (Visual Consistency)

### 1.1 Update Editor Background Colors
- [x] Update PlateEditor main container to use `bg-content1`
- [x] Update editor content area to use `bg-content1`
- [x] Update toolbar to use `bg-content1` background
- [x] Update chapter sidebar to use `bg-content1` background
- [x] Remove any hardcoded background colors

### 1.2 Standardize Border and Text Colors
- [x] Replace all border colors with `border-border`
- [x] Replace primary text colors with `text-foreground`
- [x] Replace secondary text colors with `text-muted-foreground`
- [x] Update hover states to use `hover:bg-accent` and `hover:text-accent-foreground`

### 1.3 Test Visual Consistency
- [x] Test editor in light mode
- [x] Test editor in dark mode
- [x] Compare editor styling with other Card components
- [x] Verify consistency across article list, new, edit, and preview pages
- [x] Test on different screen sizes (desktop, tablet)

## Phase 2: Markdown Serialization

### 2.1 Install Dependencies
- [x] Install `remark` package
- [x] Install `remark-parse` package
- [x] Install `remark-gfm` package
- [x] Install `unified` package
- [x] Update package.json and lock file

### 2.2 Create Markdown Serializer
- [x] Create `src/components/cms/editor/markdown-serializer.ts`
- [x] Implement `serializeToMarkdown()` function
- [x] Implement `serializeNode()` helper for block elements
- [x] Implement `serializeChildren()` helper for inline elements
- [x] Handle headings (h1, h2, h3)
- [x] Handle paragraphs
- [x] Handle blockquotes
- [x] Handle lists (ul, ol, li)
- [x] Handle images
- [x] Handle links
- [x] Handle text marks (bold, italic, strikethrough, code)
- [x] Handle code blocks

### 2.3 Create Markdown Deserializer
- [x] Create `src/components/cms/editor/markdown-deserializer.ts`
- [x] Implement `deserializeFromMarkdown()` function
- [x] Implement `convertMdastToSlate()` helper
- [x] Implement `convertInlineNodes()` helper
- [x] Handle headings parsing
- [x] Handle paragraphs parsing
- [x] Handle blockquotes parsing
- [x] Handle lists parsing
- [x] Handle images parsing
- [x] Handle links parsing
- [x] Handle text marks parsing
- [x] Handle code blocks parsing

### 2.4 Test Serialization
- [ ] Write unit tests for heading serialization
- [ ] Write unit tests for paragraph serialization
- [ ] Write unit tests for list serialization
- [ ] Write unit tests for image serialization
- [ ] Write unit tests for link serialization
- [ ] Write unit tests for text marks serialization
- [ ] Test round-trip conversion (Slate → Markdown → Slate)
- [ ] Test edge cases (empty content, special characters)
- [ ] Test with real article content


## Phase 3: Markdown View Component

### 3.1 Install Syntax Highlighting Library
- [x] Research and choose syntax highlighter (`react-syntax-highlighter` or alternative)
- [x] Install chosen library
- [x] Install markdown language support for syntax highlighter

### 3.2 Create MarkdownView Component
- [x] Create `src/components/cms/editor/markdown-view.tsx`
- [x] Define `MarkdownViewProps` interface
- [x] Create component structure with textarea
- [x] Add monospace font styling
- [x] Add proper height and overflow handling

### 3.3 Implement Syntax Highlighting
- [x] Integrate syntax highlighter library
- [x] Configure markdown language support
- [x] Add syntax highlighting for headers (#, ##, ###)
- [x] Add syntax highlighting for bold (**text**)
- [x] Add syntax highlighting for italic (*text*)
- [x] Add syntax highlighting for links ([text](url))
- [x] Add syntax highlighting for code blocks (```)
- [x] Add syntax highlighting for lists (-, *, 1.)
- [x] Add syntax highlighting for blockquotes (>)
- [x] Configure theme colors for dark mode

### 3.4 Add Line Numbers
- [x] Implement line number display
- [x] Style line numbers with muted colors
- [x] Ensure line numbers align with content
- [x] Update line numbers on content change

### 3.5 Add Copy to Clipboard
- [x] Add copy button to markdown view header
- [x] Implement clipboard copy functionality
- [x] Add success toast notification
- [x] Add icon (Copy/Check) with state transition

### 3.6 Handle Tab Key
- [x] Prevent default tab behavior (focus change)
- [x] Insert 2 spaces on tab key press
- [ ] Handle shift+tab for outdent (if applicable)

### 3.7 Test Markdown View
- [ ] Test with small documents
- [ ] Test with large documents (10,000+ words)
- [ ] Test syntax highlighting accuracy
- [ ] Test copy to clipboard functionality
- [ ] Test tab key behavior
- [ ] Test in light and dark modes

## Phase 4: View Mode Toggle

### 4.1 Create ViewModeToggle Component
- [x] Create `src/components/cms/editor/view-mode-toggle.tsx`
- [x] Define `ViewModeToggleProps` interface
- [x] Use segmented control pattern (radio group) instead of Switch for clearer UX
- [x] Add Eye icon for Formatted mode
- [x] Add FileCode icon for Markdown mode
- [x] Add labels ("Formatted" and "Markdown")
- [x] Style component to match toolbar

### 4.2 Add Tooltip and Accessibility
- [x] Add tooltip with keyboard shortcut (Ctrl+Shift+M)
- [x] Add ARIA labels for screen readers
- [x] Add ARIA radiogroup role for mode selection
- [x] Add ARIA live region for mode switch announcements
- [ ] Test keyboard navigation
- [ ] Test with screen reader

### 4.3 Integrate Toggle into Editor
- [x] Add ViewModeToggle to EditorToolbar component
- [x] Position toggle on right side of toolbar
- [x] Pass view mode state to toggle
- [x] Pass mode change handler to toggle
- [x] Disable toggle during save operations

### 4.4 Implement View Mode State
- [x] Add `viewMode` state to PlateEditor
- [x] Add `isTransitioning` state for animations
- [x] Add `markdownContent` state for markdown view
- [x] Add `markdownWarning` state for validation
- [x] Initialize view mode from localStorage
- [x] Update localStorage on mode change

### 4.5 Implement View Switching Logic
- [x] Create `handleViewModeChange()` function
- [x] Serialize Slate to markdown when switching to markdown view
- [x] Deserialize markdown to Slate when switching to formatted view
- [x] Add validation before switching views
- [x] Show warning banner for invalid markdown (with dismiss button)
- [x] Add transition animation (fade overlay with spinner)
- [x] Update content stats after view switch

### 4.6 Add Keyboard Shortcut
- [x] Add keyboard event listener for Ctrl+Shift+M
- [x] Handle keyboard shortcut on Windows/Linux
- [x] Handle keyboard shortcut on Mac (Cmd+Shift+M)
- [x] Prevent default browser behavior
- [ ] Test keyboard shortcut functionality

### 4.7 Test View Mode Toggle
- [ ] Test switching from formatted to markdown
- [ ] Test switching from markdown to formatted
- [ ] Test with empty content
- [ ] Test with complex content (images, links, lists)
- [ ] Test keyboard shortcut
- [ ] Test localStorage persistence
- [ ] Test disabled state during save


## Phase 5: Integration & Testing

### 5.1 Update Parent Components
- [ ] Update article edit page to handle markdown content
- [ ] Update article new page to handle markdown content
- [ ] Update article preview page to render markdown
- [ ] Update content change handler to work with markdown
- [ ] Ensure unsaved changes detection works with markdown

### 5.2 Update API Integration
- [ ] Verify API accepts markdown content
- [ ] Update article create mutation to send markdown
- [ ] Update article update mutation to send markdown
- [ ] Update article fetch to receive markdown
- [ ] Test API integration with markdown content

### 5.3 Update Content Stats Analysis
- [ ] Update `analyzeContent()` to work with markdown
- [ ] Ensure word count is accurate
- [ ] Ensure heading extraction works
- [ ] Ensure keyword analysis works
- [ ] Ensure image detection works
- [ ] Ensure link detection works
- [ ] Test content stats with markdown

### 5.4 Update Chapter Navigation
- [ ] Ensure chapter extraction works with markdown
- [ ] Test chapter navigation with formatted view
- [ ] Test chapter navigation with markdown view
- [ ] Ensure chapter highlighting works

### 5.5 Test with Existing Articles
- [ ] Load existing articles with HTML content
- [ ] Convert HTML to markdown on load (if needed)
- [ ] Test editing existing articles
- [ ] Test saving edited articles
- [ ] Verify no data loss during conversion

### 5.6 Test Edge Cases
- [ ] Test with empty content
- [ ] Test with very large documents (10,000+ words)
- [ ] Test with special characters (quotes, apostrophes, symbols)
- [ ] Test with escaped markdown characters
- [ ] Test with nested lists
- [ ] Test with multiple images
- [ ] Test with complex link structures
- [ ] Test with code blocks containing markdown

### 5.7 Performance Testing
- [ ] Measure view switching time (should be < 500ms)
- [ ] Test typing performance in formatted view
- [ ] Test typing performance in markdown view
- [ ] Test scrolling performance with large documents
- [ ] Test syntax highlighting performance
- [ ] Profile and optimize if needed

### 5.8 Accessibility Testing
- [ ] Test keyboard navigation through all controls
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Verify ARIA labels are announced correctly
- [ ] Test focus indicators visibility
- [ ] Verify color contrast ratios (WCAG AA)
- [ ] Test with keyboard-only navigation
- [ ] Test with high contrast mode

### 5.9 Cross-Browser Testing
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Fix any browser-specific issues

### 5.10 Responsive Testing
- [ ] Test on desktop (1920x1080)
- [ ] Test on laptop (1366x768)
- [ ] Test on tablet landscape (1024x768)
- [ ] Test on tablet portrait (768x1024)
- [ ] Verify editor is usable on all sizes


## Phase 6: Polish & Documentation

### 6.1 Error Handling
- [ ] Add error boundary for editor component
- [ ] Handle serialization errors gracefully
- [ ] Handle deserialization errors gracefully
- [ ] Show user-friendly error messages
- [ ] Add error recovery mechanisms
- [ ] Log errors for debugging

### 6.2 Loading States
- [ ] Add loading indicator during view switching
- [ ] Add loading indicator during content analysis
- [ ] Add skeleton loader for initial content load
- [ ] Ensure smooth transitions

### 6.3 User Feedback
- [ ] Add success toast when switching views
- [ ] Add warning toast for invalid markdown
- [ ] Add info tooltip for first-time users
- [ ] Add help icon with editor documentation link

### 6.4 Code Documentation
- [ ] Add JSDoc comments to all public functions
- [ ] Add inline comments for complex logic
- [ ] Document markdown conversion rules
- [ ] Document component props and interfaces
- [ ] Add usage examples in comments

### 6.5 User Documentation
- [ ] Create user guide for markdown editing
- [ ] Document keyboard shortcuts
- [ ] Document markdown syntax supported
- [ ] Add troubleshooting section
- [ ] Create video tutorial (optional)

### 6.6 Code Quality
- [ ] Run ESLint and fix all warnings
- [ ] Run TypeScript compiler and fix all errors
- [ ] Ensure all components have proper types
- [ ] Remove console.log statements
- [ ] Remove commented-out code
- [ ] Format code with Prettier

### 6.7 Final Testing
- [ ] Run full test suite
- [ ] Test complete user journey (create → edit → save → preview)
- [ ] Test with multiple users (if applicable)
- [ ] Verify all acceptance criteria are met
- [ ] Get stakeholder approval

### 6.8 Deployment Preparation
- [ ] Update CHANGELOG.md
- [ ] Update version number
- [ ] Create migration guide (if needed)
- [ ] Prepare rollback plan
- [ ] Schedule deployment

## Optional Enhancements (Future Iterations)

### Optional 1: Advanced Markdown Features
- [ ] Add table support
- [ ] Add task list support (- [ ] and - [x])
- [ ] Add footnote support
- [ ] Add definition list support
- [ ] Add emoji support

### Optional 2: Editor Improvements
- [ ] Add markdown shortcuts (auto-formatting)
- [ ] Add markdown preview side-by-side mode
- [ ] Add markdown template library
- [ ] Add markdown export functionality
- [ ] Add markdown import from file

### Optional 3: Collaboration Features
- [ ] Add version history
- [ ] Add diff view for changes
- [ ] Add comments on content
- [ ] Add real-time collaboration

### Optional 4: Performance Optimizations
- [ ] Implement virtual scrolling for large documents
- [ ] Add lazy loading for images
- [ ] Optimize syntax highlighting with web workers
- [ ] Add content caching

## Notes

- Tasks marked with `*` are optional and can be implemented in future iterations
- Each phase should be completed and tested before moving to the next
- Regular code reviews should be conducted after each phase
- User feedback should be gathered after Phase 5 completion
- Performance benchmarks should be documented for future reference
