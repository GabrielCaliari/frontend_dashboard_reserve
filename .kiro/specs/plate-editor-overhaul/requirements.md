# Requirements Document: Plate Editor Overhaul for Markdown

## 1. Overview

### 1.1 Purpose
Overhaul the Plate editor experience in the CMS article editor to provide a seamless, consistent, and user-friendly markdown editing experience with proper visual consistency, dual view modes (WYSIWYG and raw markdown), and accurate content persistence.

### 1.2 Background
The current Plate editor implementation has several UX issues:
- The editor section has inconsistent background colors compared to other UI sections
- No way to view or edit raw markdown source
- Uncertainty about what markdown content is actually being saved to the database
- Inconsistent styling between article list, edit, and preview pages
- Limited markdown-specific features despite storing markdown in the database
- The editor currently works with HTML internally but should work with markdown natively

### 1.3 Goals
- Provide visual consistency across all CMS article pages
- Enable users to toggle between formatted (WYSIWYG) and raw markdown views
- Ensure WYSIWYG (what you see is what you get) - displayed content matches saved content
- Improve overall user experience and confidence in content editing
- Maintain all existing functionality (chapter navigation, floating toolbar, image insertion)

## 2. User Stories

### 2.1 As a Content Editor
**Story**: I want the editor background to match the rest of the dashboard UI so the interface feels cohesive and professional.

**Acceptance Criteria**:
- 1.1: The editor content area uses the same background color (`bg-content1`) as other Card components in the dashboard
- 1.2: The editor toolbar matches the styling of other toolbars in the application
- 1.3: All borders, shadows, and spacing follow the established design system
- 1.4: Dark mode colors are properly applied throughout the editor
- 1.5: The editor visually integrates with the surrounding Card component without visual breaks

### 2.2 As a Content Editor
**Story**: I want to switch between formatted view and raw markdown view so I can see exactly what markdown is being saved to the database.

**Acceptance Criteria**:
- 2.1: A view mode toggle button is visible in the editor toolbar
- 2.2: The toggle clearly indicates the current mode (Formatted vs Markdown)
- 2.3: Clicking the toggle smoothly transitions between modes without data loss
- 2.4: The raw view displays the actual markdown that will be saved to the database
- 2.5: The toggle is accessible via keyboard shortcut (Ctrl+Shift+M)
- 2.6: The selected view mode persists across page reloads (localStorage)
- 2.7: A tooltip explains what each mode does (e.g., "Switch to Markdown Source")

### 2.3 As a Content Editor
**Story**: I want to view raw markdown with syntax highlighting so I can easily read and understand the source code.

**Acceptance Criteria**:
- 3.1: Raw view displays markdown with syntax highlighting (headers, bold, italic, links, code blocks)
- 3.2: The raw view uses a monospace font for code readability
- 3.3: Line numbers are displayed for easy reference
- 3.4: The syntax highlighting uses theme-appropriate colors (dark mode compatible)
- 3.5: Long lines wrap appropriately without breaking the layout
- 3.6: A "Copy to Clipboard" button is available in raw view
- 3.7: The raw view is scrollable independently
- 3.8: Markdown syntax elements (**, *, #, [], etc.) are visually distinguished

### 2.4 As a Content Editor
**Story**: I want to edit raw markdown directly so I can make precise changes or paste markdown from external sources.

**Acceptance Criteria**:
- 4.1: Raw view includes an editable textarea for direct markdown editing
- 4.2: Changes in raw view are reflected in formatted view when switching back
- 4.3: Invalid markdown shows a validation warning before switching views
- 4.4: The textarea has proper syntax highlighting while editing
- 4.5: Undo/redo works in raw edit mode
- 4.6: Tab key inserts spaces (not focus change) in raw edit mode
- 4.7: Line numbers update as content is edited
- 4.8: Common markdown patterns are auto-completed (e.g., closing brackets, quotes)

### 2.5 As a Content Editor
**Story**: I want confidence that what I see in the editor is exactly what will be saved and displayed so I don't encounter surprises after publishing.

**Acceptance Criteria**:
- 5.1: The formatted view renders markdown exactly as it will appear in the preview
- 5.2: Switching between views and back produces identical content (no data loss)
- 5.3: The save operation stores the exact markdown shown in raw view
- 5.4: A visual indicator shows when content has been modified but not saved
- 5.5: Preview mode displays content identically to the formatted editor view
- 5.6: Image URLs, links, and formatting are preserved accurately in markdown format
- 5.7: Special characters and escape sequences are handled correctly

### 2.6 As a Content Editor
**Story**: I want consistent styling across all article pages (list, new, edit, preview) so the interface feels unified and predictable.

**Acceptance Criteria**:
- 6.1: All article pages use the same Card component styling
- 6.2: Headers, buttons, and spacing are consistent across pages
- 6.3: The color scheme matches across list, edit, and preview pages
- 6.4: Typography (fonts, sizes, weights) is consistent
- 6.5: Loading states and error messages follow the same patterns
- 6.6: Responsive behavior is consistent across all pages

### 2.7 As a Content Editor
**Story**: I want markdown-specific editing features so I can efficiently create well-formatted content.

**Acceptance Criteria**:
- 7.1: Markdown shortcuts work (e.g., `**bold**`, `*italic*`, `# heading`, `[link](url)`)
- 7.2: Pasting markdown text preserves markdown syntax
- 7.3: The floating toolbar includes markdown-relevant formatting options
- 7.4: Code blocks are properly formatted with triple backticks and language support
- 7.5: Tables can be inserted using markdown table syntax
- 7.6: Markdown preview matches GitHub-flavored markdown rendering
- 7.7: Automatic list continuation (pressing Enter in a list creates a new list item)
- 7.8: Smart quotes and dashes are converted to markdown-safe equivalents

### 2.8 As a Content Editor
**Story**: I want the editor to be accessible so all users can create content regardless of ability.

**Acceptance Criteria**:
- 8.1: All interactive elements are keyboard accessible
- 8.2: Screen readers can announce editor state and content
- 8.3: Focus indicators are clearly visible
- 8.4: Color contrast meets WCAG AA standards
- 8.5: ARIA labels are present on all controls
- 8.6: Keyboard shortcuts are documented and discoverable

### 2.9 As a Content Editor
**Story**: I want the editor to perform well even with large documents so I can work efficiently.

**Acceptance Criteria**:
- 9.1: Editor remains responsive with documents up to 10,000 words
- 9.2: View mode switching completes in under 500ms
- 9.3: Typing has no noticeable lag
- 9.4: Syntax highlighting doesn't block the UI thread
- 9.5: Chapter navigation updates smoothly as content changes
- 9.6: Image loading doesn't freeze the editor

### 2.10 As a Content Editor
**Story**: I want helpful feedback and guidance so I can use the editor effectively.

**Acceptance Criteria**:
- 10.1: Tooltips explain all toolbar buttons and shortcuts
- 10.2: Error messages are clear and actionable
- 10.3: A help icon provides quick access to editor documentation
- 10.4: First-time users see a brief onboarding tooltip
- 10.5: Validation errors highlight the specific issue
- 10.6: Success messages confirm save operations

## 3. Functional Requirements

### 3.1 View Mode Toggle
- **FR-1.1**: The editor shall provide a toggle control to switch between Formatted and Markdown source views
- **FR-1.2**: The toggle shall be positioned in the editor toolbar, right-aligned
- **FR-1.3**: The toggle shall use NextUI Switch component for consistency
- **FR-1.4**: The toggle shall display icons: Eye (Formatted) and FileCode (Markdown)
- **FR-1.5**: The toggle shall be disabled during save operations
- **FR-1.6**: The toggle shall support keyboard shortcut Ctrl+Shift+M
- **FR-1.7**: The toggle shall show clear labels: "Formatted" and "Markdown"

### 3.2 Markdown Source View
- **FR-2.1**: Markdown view shall display the raw markdown source code
- **FR-2.2**: Markdown view shall include syntax highlighting for markdown elements (headers, bold, italic, links, code, lists)
- **FR-2.3**: Markdown view shall be editable via a textarea component
- **FR-2.4**: Markdown view shall include line numbers
- **FR-2.5**: Markdown view shall include a "Copy to Clipboard" button
- **FR-2.6**: Markdown view shall validate markdown syntax before allowing view switch
- **FR-2.7**: Markdown view shall preserve formatting (indentation, line breaks)
- **FR-2.8**: Markdown view shall support standard markdown syntax (CommonMark/GFM)

### 3.3 Formatted View
- **FR-3.1**: Formatted view shall render markdown as formatted content
- **FR-3.2**: Formatted view shall support all existing Plate editor features
- **FR-3.3**: Formatted view shall maintain chapter navigation functionality
- **FR-3.4**: Formatted view shall maintain floating toolbar functionality
- **FR-3.5**: Formatted view shall maintain image insertion functionality
- **FR-3.6**: Formatted view shall render content identically to preview mode
- **FR-3.7**: Formatted view shall support inline markdown editing (e.g., typing `**text**` converts to bold)

### 3.4 Content Synchronization
- **FR-4.1**: Content changes in Formatted view shall be serialized to markdown
- **FR-4.2**: Content changes in Markdown view shall be parsed to Slate format
- **FR-4.3**: Switching views shall preserve all content without data loss
- **FR-4.4**: The system shall detect and warn about invalid markdown syntax
- **FR-4.5**: The system shall maintain content stats (word count, headings, etc.) across view changes
- **FR-4.6**: The system shall use a markdown parser library (e.g., remark, unified) for reliable conversion
- **FR-4.7**: The system shall support GitHub-flavored markdown (GFM) extensions

### 3.5 Visual Consistency
- **FR-5.1**: The editor content area shall use `bg-content1` background color
- **FR-5.2**: The editor shall match Card component styling (borders, shadows, padding)
- **FR-5.3**: The editor toolbar shall match other dashboard toolbars
- **FR-5.4**: All text shall use theme-appropriate colors (foreground, muted-foreground)
- **FR-5.5**: Dark mode shall be fully supported with appropriate color adjustments

### 3.6 Persistence
- **FR-6.1**: The selected view mode shall be saved to localStorage
- **FR-6.2**: The view mode preference shall be restored on page load
- **FR-6.3**: Content shall be saved as markdown to the database
- **FR-6.4**: The save operation shall use the current markdown content regardless of view mode
- **FR-6.5**: The system shall maintain markdown formatting (line breaks, indentation) on save

### 3.7 Markdown Features
- **FR-7.1**: The editor shall support markdown shortcuts (**, *, #, [], (), ```, etc.)
- **FR-7.2**: The editor shall preserve markdown syntax when pasting from external sources
- **FR-7.3**: The editor shall support code blocks with language specification (```language)
- **FR-7.4**: The editor shall support blockquotes, ordered/unordered lists, and tables
- **FR-7.5**: The editor shall support image insertion using markdown syntax ![alt](url)
- **FR-7.6**: The editor shall support link insertion using markdown syntax [text](url)
- **FR-7.7**: The editor shall support inline code using backticks `code`
- **FR-7.8**: The editor shall support horizontal rules using --- or ***
- **FR-7.9**: The editor shall support task lists using - [ ] and - [x] (GFM extension)

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1**: View mode switching shall complete in under 500ms
- **NFR-1.2**: The editor shall remain responsive with documents up to 10,000 words
- **NFR-1.3**: Syntax highlighting shall not block the UI thread
- **NFR-1.4**: Content analysis shall be debounced to avoid excessive computation

### 4.2 Accessibility
- **NFR-2.1**: All interactive elements shall be keyboard accessible
- **NFR-2.2**: Color contrast shall meet WCAG AA standards (4.5:1 for normal text)
- **NFR-2.3**: ARIA labels shall be present on all controls
- **NFR-2.4**: Focus indicators shall be clearly visible
- **NFR-2.5**: Screen readers shall announce editor state changes

### 4.3 Compatibility
- **NFR-3.1**: The editor shall work in Chrome, Firefox, Safari, and Edge (latest versions)
- **NFR-3.2**: The editor shall work on desktop and tablet devices (min width: 768px)
- **NFR-3.3**: The editor shall support dark and light themes
- **NFR-3.4**: The editor shall be compatible with React 19 and Next.js 16

### 4.4 Maintainability
- **NFR-4.1**: Code shall follow the project's TypeScript and React conventions
- **NFR-4.2**: Components shall be modular and reusable
- **NFR-4.3**: State management shall be clear and predictable
- **NFR-4.4**: The codebase shall include TypeScript interfaces for all props and state

### 4.5 Usability
- **NFR-5.1**: The editor shall provide clear visual feedback for all actions
- **NFR-5.2**: Error messages shall be user-friendly and actionable
- **NFR-5.3**: The interface shall follow established dashboard design patterns
- **NFR-5.4**: Tooltips shall provide helpful context for all controls

## 5. Technical Constraints

### 5.1 Technology Stack
- **TC-1.1**: Must use React 19 and Next.js 16
- **TC-1.2**: Must use Plate.js for WYSIWYG editing
- **TC-1.3**: Must use NextUI for UI components
- **TC-1.4**: Must use Tailwind CSS for styling
- **TC-1.5**: Must use TypeScript with strict mode

### 5.2 Data Format
- **TC-2.1**: Content must be stored as markdown in the database
- **TC-2.2**: Content must be serializable to/from Slate format
- **TC-2.3**: Content must support standard markdown syntax (CommonMark specification)
- **TC-2.4**: Content must support GitHub-flavored markdown (GFM) extensions
- **TC-2.5**: Content must handle special characters and escape sequences correctly

### 5.3 Integration
- **TC-3.1**: Must integrate with existing CMS API endpoints
- **TC-3.2**: Must work with existing image upload functionality
- **TC-3.3**: Must maintain compatibility with SEO sidebar
- **TC-3.4**: Must maintain compatibility with content stats analysis

## 6. Dependencies

### 6.1 External Dependencies
- Plate.js (existing)
- NextUI components (existing)
- Tailwind CSS (existing)
- Lucide React icons (existing)
- React Hook Form (existing)
- Zustand (existing)
- **remark** or **unified** (NEW - for markdown parsing)
- **remark-gfm** (NEW - for GitHub-flavored markdown support)
- **react-markdown** or **@udecode/plate-markdown** (NEW - for markdown rendering)

### 6.2 Internal Dependencies
- CMS API client (`src/common/config/cms-api-client.ts`)
- Image upload hooks (`src/common/hooks/cms/useImageMutations.ts`)
- Article hooks (`src/common/hooks/cms/use-get-article.ts`, `use-update-article.ts`, `use-create-article.ts`)
- SEO Sidebar component (`src/components/cms/seo-sidebar.tsx`)
- Content stats types (`src/types/cms.ts`)

## 7. Success Metrics

### 7.1 User Experience
- Users can successfully toggle between views without confusion
- Users report increased confidence in content accuracy
- Users find the interface visually consistent and professional

### 7.2 Technical
- Zero data loss incidents during view switching
- View mode switching completes in under 500ms
- No accessibility violations in automated testing
- Code coverage above 80% for new components

### 7.3 Adoption
- 100% of content editors use the new editor without issues
- Reduced support tickets related to content formatting
- Positive feedback on editor usability

## 8. Out of Scope

### 8.1 Explicitly Excluded
- Real-time collaborative editing
- Version history and rollback (beyond browser undo/redo)
- Advanced markdown features (footnotes, definition lists, task lists)
- WYSIWYG table editing (tables can be added in raw mode)
- Mobile phone support (tablet and desktop only)
- Markdown export/import functionality
- AI-powered content suggestions
- Grammar and spell checking (browser native only)

### 8.2 Future Considerations
- Collaborative editing with presence indicators
- Version history with diff view
- Advanced markdown extensions
- Custom markdown shortcuts
- Template library for common content structures
- Content reuse and snippets

## 9. Assumptions

### 9.1 User Assumptions
- Users have basic understanding of markdown syntax
- Users are working on desktop or tablet devices
- Users have modern browsers with JavaScript enabled
- Users have sufficient permissions to edit articles

### 9.2 Technical Assumptions
- The database can store markdown content up to 1MB
- The API supports markdown content in article payloads
- The existing Plate.js serialization can be adapted for markdown
- Browser localStorage is available and persistent
- A reliable markdown parser library is available and compatible with the stack

### 9.3 Business Assumptions
- Content editors need both formatted and raw markdown editing capabilities
- Visual consistency is important for user trust and adoption
- The current markdown storage format will not change
- Performance is acceptable with documents up to 10,000 words
- Markdown is the preferred format for content portability and version control

## 10. Risks and Mitigations

### 10.1 Technical Risks

**Risk**: Content corruption during view switching
- **Impact**: High - Data loss
- **Probability**: Medium
- **Mitigation**: Implement robust serialization/deserialization with validation and error handling

**Risk**: Performance degradation with large documents
- **Impact**: Medium - Poor UX
- **Probability**: Medium
- **Mitigation**: Implement debouncing, lazy loading, and performance monitoring

**Risk**: Browser compatibility issues
- **Impact**: Medium - Limited user base
- **Probability**: Low
- **Mitigation**: Test on all major browsers, use polyfills where needed

### 10.2 UX Risks

**Risk**: Users confused by dual view modes
- **Impact**: Medium - Reduced adoption
- **Probability**: Low
- **Mitigation**: Clear labeling, tooltips, and onboarding guidance

**Risk**: Inconsistent rendering between views
- **Impact**: High - Loss of trust
- **Probability**: Medium
- **Mitigation**: Extensive testing, visual regression testing, preview mode validation

### 10.3 Project Risks

**Risk**: Scope creep with additional markdown features
- **Impact**: Medium - Delayed delivery
- **Probability**: High
- **Mitigation**: Strict adherence to requirements, clear out-of-scope list

**Risk**: Breaking existing functionality
- **Impact**: High - User disruption
- **Probability**: Low
- **Mitigation**: Comprehensive testing, feature flags, gradual rollout

## 11. Glossary

- **Formatted View**: Visual editing mode that renders markdown as formatted content (previously called WYSIWYG)
- **Markdown View**: Source code view showing raw markdown syntax
- **Markdown**: Lightweight markup language for formatting text using plain text syntax
- **CommonMark**: Standardized markdown specification
- **GFM (GitHub-Flavored Markdown)**: Extended markdown syntax with tables, task lists, strikethrough, etc.
- **Slate**: The data model used by Plate.js for rich text editing
- **Serialization**: Converting Slate format to markdown
- **Deserialization**: Converting markdown to Slate format
- **Content Stats**: Metrics about the content (word count, headings, keyword density, etc.)
- **Chapter Navigation**: Sidebar showing document outline based on headings
- **Floating Toolbar**: Context-sensitive formatting toolbar that appears on text selection
- **Syntax Highlighting**: Color-coding of markdown syntax elements for readability
