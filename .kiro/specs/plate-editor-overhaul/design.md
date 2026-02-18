# Design Document

## Overview

The Plate Editor Overhaul enhances the existing CMS article editor with improved visual consistency, a markdown view mode toggle, and better user experience while maintaining all current functionality. The design leverages NextUI components, Plate.js infrastructure, and React 19 features to create a polished, accessible editing experience.

### Key Design Goals

1. **Visual Consistency**: Align editor appearance with NextUI theme system and dashboard design patterns
2. **Dual View Modes**: Support both WYSIWYG and raw HTML viewing with smooth transitions
3. **Backward Compatibility**: Preserve all existing features (chapter navigation, floating toolbar, image insertion)
4. **Accessibility**: Ensure keyboard navigation, screen reader support, and WCAG AA compliance
5. **Performance**: Maintain fast rendering and smooth interactions even with large documents

## Architecture

### Component Structure

```
PlateEditor (Enhanced)
├── ViewModeToggle (NEW)
│   └── NextUI Switch component
├── ChapterNavigation (Existing)
│   ├── Collapsible sidebar
│   └── Chapter list with hierarchy
├── EditorToolbar (Enhanced)
│   ├── Undo/Redo buttons
│   ├── Insert Image button
│   └── ViewModeToggle integration
├── FloatingToolbar (Existing)
│   └── Text formatting controls
├── ContentArea (Enhanced)
│   ├── WYSIWYGView (Existing PlateContent)
│   └── RawHTMLView (NEW)
│       └── SyntaxHighlightedCode
└── ImageInsertDialog (Existing)
```

### State Management

The editor will manage the following state:

- `viewMode`: 'wysiwyg' | 'raw' - Current view mode
- `content`: Slate Value - Editor content in Slate format
- `rawHtml`: string - Serialized HTML for raw view
- `isTransitioning`: boolean - Flag for mode transition animation
- All existing state (chapters, activeChapter, sidebarCollapsed, etc.)

### Data Flow

```
User Action → State Update → View Re-render
     ↓
Mode Toggle → Serialize/Deserialize → Update Display
     ↓
Content Change → Analyze → Update Stats → Notify Parent
```

## Components and Interfaces

### 1. ViewModeToggle Component

**Purpose**: Provides UI control for switching between WYSIWYG and raw HTML view modes.

**Interface**:
```typescript
interface ViewModeToggleProps {
  mode: 'wysiwyg' | 'raw';
  onModeChange: (mode: 'wysiwyg' | 'raw') => void;
  disabled?: boolean;
  className?: string;
}
```

**Implementation Details**:
- Uses NextUI `Switch` component for consistent styling
- Displays icons: Eye (WYSIWYG) and Code (Raw)
- Shows tooltip with keyboard shortcut (Ctrl+Shift+M)
- Provides ARIA labels for accessibility
- Disabled during save operations

### 2. RawHTMLView Component

**Purpose**: Displays HTML source code with syntax highlighting in read-only mode.

**Interface**:
```typescript
interface RawHTMLViewProps {
  html: string;
  className?: string;
  onCopy?: () => void;
}
```

**Implementation Details**:
- Uses `<pre>` and `<code>` tags for monospace display
- Implements basic syntax highlighting using regex patterns
- Highlights: tags, attributes, strings, comments
- Provides copy-to-clipboard button
- Scrollable with line numbers (optional)
- Uses theme colors for syntax highlighting

### 3. Enhanced PlateEditor Component

**Updated Interface**:
```typescript
interface PlateEditorProps {
  highlightedSection?: string | null;
  onContentChange?: (stats: ContentStats) => void;
  focusKeyword?: string;
  initialContent?: string;
  blogId?: number;
  articleId?: number;
  initialViewMode?: 'wysiwyg' | 'raw'; // NEW
  onViewModeChange?: (mode: 'wysiwyg' | 'raw') => void; // NEW
}
```

**New State**:
```typescript
const [viewMode, setViewMode] = useState<'wysiwyg' | 'raw'>('wysiwyg');
const [isTransitioning, setIsTransitioning] = useState(false);
const [rawHtml, setRawHtml] = useState('');
```

### 4. Enhanced EditorToolbar Component

**Updated Interface**:
```typescript
interface EditorToolbarProps {
  onInsertImage: () => void;
  viewMode: 'wysiwyg' | 'raw'; // NEW
  onViewModeChange: (mode: 'wysiwyg' | 'raw') => void; // NEW
  disabled?: boolean; // NEW
}
```

**Layout Changes**:
- Add ViewModeToggle to the right side of toolbar
- Maintain existing undo/redo and insert image buttons
- Disable insert image button in raw mode

## Data Models

### ViewMode Type

```typescript
type ViewMode = 'wysiwyg' | 'raw';
```

### ViewModePreference (localStorage)

```typescript
interface ViewModePreference {
  mode: ViewMode;
  timestamp: number;
  userId?: string; // Optional for multi-user scenarios
}
```

**Storage Key**: `plate-editor-view-mode`

### SyntaxHighlightToken

```typescript
interface SyntaxHighlightToken {
  type: 'tag' | 'attribute' | 'string' | 'comment' | 'text';
  value: string;
  startIndex: number;
  endIndex: number;
}
```

### Enhanced ContentStats

The existing `ContentStats` interface remains unchanged, but the analysis function will be called after mode transitions to ensure stats are up-to-date.

## 

### Theme Integration

**NextUI Theme Colors**:
```typescript
// Background colors
bg-content1: Main editor background
bg-content2: Toolbar and sidebar backgrounds
bg-default: Raw mode background

// Text colors
text-foreground: Primary text
text-foreground/70: Secondary text
text-muted-foreground: Placeholder and hints

// Accent colors
border-border: Borders and dividers
bg-accent: Hover states
text-accent-foreground: Accent text

// Syntax highlighting (Raw mode)
text-primary: HTML tags
text-secondary: Attributes
text-success: String values
text-warning: Comments
```

### Mode Transition Flow

```
User clicks toggle
    ↓
Set isTransitioning = true
    ↓
If switching to Raw:
    - Serialize Slate value to HTML
    - Store in rawHtml state
    - Fade out WYSIWYG view
    - Fade in Raw view
    ↓
If switching to WYSIWYG:
    - Parse rawHtml to Slate value
    - Update editor value
    - Fade out Raw view
    - Fade in WYSIWYG view
    ↓
Set isTransitioning = false
    ↓
Save preference to localStorage
    ↓
Trigger content analysis
```

## Styling and Visual Design

### Color Scheme Implementation

**Editor Container**:
```css
.plate-editor-container {
  background: hsl(var(--nextui-content1));
  border: 1px solid hsl(var(--nextui-border));
  border-radius: var(--nextui-radius-large);
}
```

**Content Area (WYSIWYG)**:
```css
.editor-content-wysiwyg {
  background: hsl(var(--nextui-content1));
  color: hsl(var(--nextui-foreground));
  font-family: var(--font-nunito);
  line-height: 1.75;
  padding: 3rem 2rem;
}
```

**Content Area (Raw)**:
```css
.editor-content-raw {
  background: hsl(var(--nextui-default-100));
  color: hsl(var(--nextui-foreground));
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  line-height: 1.6;
  padding: 1.5rem;
  overflow-x: auto;
}
```

### Typography Scale

```typescript
const typographyScale = {
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-semibold leading-snug',
  h3: 'text-2xl font-medium leading-normal',
  paragraph: 'text-base leading-relaxed',
  code: 'text-sm font-mono',
};
```

### Spacing System

```typescript
const spacing = {
  headingTop: 'mt-8 first:mt-0',
  headingBottom: 'mb-4',
  paragraphVertical: 'my-4',
  blockquoteVertical: 'my-6',
  imageVertical: 'my-8',
  toolbarPadding: 'p-2',
  contentPadding: 'px-8 py-12',
};
```

### Transition Animations

```css
.mode-transition-enter {
  opacity: 0;
  transform: translateY(10px);
}

.mode-transition-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 250ms ease-out, transform 250ms ease-out;
}

.mode-transition-exit {
  opacity: 1;
  transform: translateY(0);
}

.mode-transition-exit-active {
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 200ms ease-in, transform 200ms ease-in;
}
```

## Syntax Highlighting Implementation

### Tokenization Strategy

The raw HTML view will use a simple regex-based tokenizer for syntax highlighting:

```typescript
function tokenizeHtml(html: string): SyntaxHighlightToken[] {
  const tokens: SyntaxHighlightToken[] = [];
  
  // Patterns for different token types
  const patterns = {
    comment: /<!--[\s\S]*?-->/g,
    tag: /<\/?[\w-]+/g,
    attribute: /[\w-]+=(?:"[^"]*"|'[^']*')/g,
    string: /"[^"]*"|'[^']*'/g,
  };
  
  // Process HTML and extract tokens
  // Implementation details in code
  
  return tokens;
}
```

### Syntax Color Mapping

```typescript
const syntaxColors = {
  tag: 'text-primary',           // Blue for tags
  attribute: 'text-secondary',   // Purple for attributes
  string: 'text-success',        // Green for strings
  comment: 'text-warning',       // Orange for comments
  text: 'text-foreground',       // Default for text content
};
```

### Rendering Strategy

```typescript
function renderHighlightedHtml(html: string): React.ReactNode {
  const tokens = tokenizeHtml(html);
  
  return tokens.map((token, index) => (
    <span key={index} className={syntaxColors[token.type]}>
      {token.value}
    </span>
  ));
}
```

## Accessibility Features

### Keyboard Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| Ctrl+Shift+M | Toggle view mode | Global |
| Ctrl+B | Bold text | WYSIWYG mode, text selected |
| Ctrl+I | Italic text | WYSIWYG mode, text selected |
| Ctrl+U | Underline text | WYSIWYG mode, text selected |
| Ctrl+Z | Undo | WYSIWYG mode |
| Ctrl+Shift+Z | Redo | WYSIWYG mode |
| Ctrl+Shift+I | Insert image | WYSIWYG mode |
| Tab | Navigate toolbar | Toolbar focused |
| Escape | Close dialogs | Dialog open |

### ARIA Labels

```typescript
const ariaLabels = {
  viewModeToggle: 'Toggle between formatted and raw HTML view',
  wysiwygMode: 'WYSIWYG editing mode active',
  rawMode: 'Raw HTML view mode active',
  editorContent: 'Article content editor',
  chapterNavigation: 'Document chapter navigation',
  floatingToolbar: 'Text formatting toolbar',
};
```

### Screen Reader Announcements

```typescript
// Announce mode changes
function announceViewModeChange(mode: ViewMode) {
  const message = mode === 'wysiwyg' 
    ? 'Switched to formatted editing view'
    : 'Switched to raw HTML view';
  
  // Use aria-live region
  announceToScreenReader(message);
}
```

### Focus Management

```typescript
// Preserve focus when switching modes
function handleModeSwitch(newMode: ViewMode) {
  const currentFocus = document.activeElement;
  
  // Switch mode
  setViewMode(newMode);
  
  // Restore focus to appropriate element
  if (newMode === 'raw') {
    // Focus on raw view container
    rawViewRef.current?.focus();
  } else {
    // Focus on editor content
    editorRef.current?.focus();
  }
}
```

## Responsive Design Strategy

### Breakpoints

```typescript
const breakpoints = {
  mobile: '0px',      // < 640px
  tablet: '768px',    // 768px - 1023px
  desktop: '1024px',  // >= 1024px
};
```

### Layout Adaptations

**Mobile (< 768px)**:
- Chapter navigation hidden by default
- Toolbar buttons show icons only
- View mode toggle remains visible
- Reduced padding in content area

**Tablet (768px - 1023px)**:
- Chapter navigation collapsible
- Toolbar shows icons with some labels
- Full view mode toggle with labels
- Standard padding

**Desktop (>= 1024px)**:
- Full chapter navigation sidebar
- Complete toolbar with all labels
- Full view mode toggle with descriptions
- Maximum padding for readability

### Touch Targets

All interactive elements will meet minimum touch target size:
- Buttons: 44x44px minimum
- Toggle switches: 48x28px minimum
- Toolbar icons: 40x40px minimum

## Performance Considerations

### Optimization Strategies

1. **Lazy Syntax Highlighting**: Only highlight visible portions of large HTML documents
2. **Debounced Analysis**: Delay content analysis by 300ms after changes
3. **Memoized Serialization**: Cache HTML serialization results
4. **Virtual Scrolling**: For very long documents in raw mode (future enhancement)
5. **Transition Throttling**: Prevent rapid mode switching

### Performance Metrics

- Mode switch transition: < 300ms
- Syntax highlighting: < 100ms for typical documents
- Content serialization: < 50ms
- Initial render: < 500ms

## Error Handling

### Error Scenarios

1. **Serialization Failure**: Invalid Slate structure
2. **Deserialization Failure**: Malformed HTML
3. **localStorage Failure**: Quota exceeded or disabled
4. **Image Upload Failure**: Network error or invalid file

### Error Recovery

```typescript
function handleSerializationError(error: Error) {
  console.error('Serialization failed:', error);
  
  // Show user-friendly message
  toast.error('Unable to switch to raw view', {
    description: 'The content structure may be invalid.',
  });
  
  // Revert to WYSIWYG mode
  setViewMode('wysiwyg');
}

function handleDeserializationError(error: Error) {
  console.error('Deserialization failed:', error);
  
  // Show user-friendly message
  toast.error('Unable to parse HTML', {
    description: 'The HTML may contain invalid syntax.',
  });
  
  // Keep in raw mode, don't corrupt content
  // User can fix HTML manually
}
```

## Testing Strategy

### Unit Testing

**Components to Test**:
- ViewModeToggle: rendering, interaction, accessibility
- RawHTMLView: syntax highlighting, rendering, copy functionality
- Enhanced PlateEditor: mode switching, state management
- Serialization functions: HTML generation, parsing

**Test Cases**:
- Toggle switches between modes correctly
- Content is preserved during mode switches
- Syntax highlighting applies correct colors
- localStorage saves and restores preferences
- Keyboard shortcuts work as expected
- ARIA labels are present and correct

### Integration Testing

**Scenarios to Test**:
- Full mode switch workflow (WYSIWYG → Raw → WYSIWYG)
- Content editing in WYSIWYG mode, verify in raw mode
- Image insertion and display in both modes
- Chapter navigation updates after content changes
- Content analysis runs after mode switches
- Theme colors apply correctly in both modes

### Property-Based Testing

Property-based tests will be defined in the Correctness Properties section below.

### Manual Testing Checklist

- [ ] Visual consistency with dashboard theme
- [ ] Smooth transitions between modes
- [ ] All existing features work (chapter nav, floating toolbar, images)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces mode changes
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Dark mode displays correctly
- [ ] Performance is acceptable with large documents

## 
Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Mode Switching Completeness

*For any* editor state and any mode (WYSIWYG or Raw), activating the View_Mode_Toggle should successfully switch to the target mode and update all UI indicators accordingly.

**Validates: Requirements 2.1, 2.8**

### Property 2: Content Preservation Round-Trip

*For any* valid article content, switching from WYSIWYG mode to Raw mode and back to WYSIWYG mode should preserve the content structure and text without data loss.

**Validates: Requirements 2.3**

### Property 3: Theme Color Consistency

*For any* UI element in the editor (toolbar, content area, sidebar, dialogs), the element should use color tokens from the NextUI theme system rather than hardcoded color values.

**Validates: Requirements 1.2, 1.4**

### Property 4: Syntax Highlighting Completeness

*For any* HTML content displayed in Raw mode, all syntax elements (tags, attributes, string values) should be highlighted with distinct colors from the theme system.

**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

### Property 5: Scroll Position Preservation

*For any* scroll position in the editor content area, switching between WYSIWYG and Raw modes should maintain the scroll position within a reasonable tolerance (±50px).

**Validates: Requirements 4.2**

### Property 6: Focus Management Consistency

*For any* focused interactive element in the editor, switching view modes should maintain focus on a logically equivalent element in the new mode (e.g., toggle button remains focused).

**Validates: Requirements 6.4**

### Property 7: Mode Preference Persistence Round-Trip

*For any* view mode selection (WYSIWYG or Raw), saving the preference to localStorage and then reloading the editor should restore the same view mode.

**Validates: Requirements 9.1, 9.2**

### Property 8: Existing Functionality Preservation

*For any* existing editor feature (chapter navigation, floating toolbar, image insertion, text formatting, undo/redo), the feature should continue to work identically after the overhaul implementation.

**Validates: Requirements 5.1-5.10**

## Error Handling

### Serialization Error Handling

```typescript
try {
  const html = serializeNodesToHtml(editor.children);
  setRawHtml(html);
  setViewMode('raw');
} catch (error) {
  console.error('Serialization failed:', error);
  toast.error('Unable to switch to raw view', {
    description: 'The content structure may be invalid.',
  });
  // Stay in WYSIWYG mode
}
```

### Deserialization Error Handling

```typescript
try {
  const slateValue = parseHtmlToSlate(rawHtml);
  editor.children = slateValue;
  setViewMode('wysiwyg');
} catch (error) {
  console.error('Deserialization failed:', error);
  toast.error('Unable to parse HTML', {
    description: 'The HTML may contain invalid syntax. Please check the markup.',
  });
  // Stay in raw mode, preserve user's HTML
}
```

### localStorage Error Handling

```typescript
function saveViewModePreference(mode: ViewMode) {
  try {
    const preference: ViewModePreference = {
      mode,
      timestamp: Date.now(),
    };
    localStorage.setItem('plate-editor-view-mode', JSON.stringify(preference));
  } catch (error) {
    console.warn('Failed to save view mode preference:', error);
    // Continue without persistence - not critical
  }
}

function loadViewModePreference(): ViewMode {
  try {
    const stored = localStorage.getItem('plate-editor-view-mode');
    if (stored) {
      const preference: ViewModePreference = JSON.parse(stored);
      return preference.mode;
    }
  } catch (error) {
    console.warn('Failed to load view mode preference:', error);
  }
  return 'wysiwyg'; // Default fallback
}
```

### Mode Transition Error Handling

```typescript
async function handleModeSwitch(targetMode: ViewMode) {
  if (isTransitioning) {
    console.warn('Mode switch already in progress');
    return;
  }
  
  if (isSaving) {
    toast.warning('Please wait', {
      description: 'Content is being saved. Try again in a moment.',
    });
    return;
  }
  
  setIsTransitioning(true);
  
  try {
    if (targetMode === 'raw') {
      const html = serializeNodesToHtml(editor.children);
      setRawHtml(html);
    } else {
      const slateValue = parseHtmlToSlate(rawHtml);
      editor.children = slateValue;
    }
    
    setViewMode(targetMode);
    saveViewModePreference(targetMode);
    announceViewModeChange(targetMode);
    
  } catch (error) {
    handleModeTransitionError(error, targetMode);
  } finally {
    setIsTransitioning(false);
  }
}
```

## Implementation Notes

### Migration Strategy

1. **Phase 1**: Add ViewModeToggle component without breaking existing functionality
2. **Phase 2**: Implement RawHTMLView component with syntax highlighting
3. **Phase 3**: Integrate mode switching logic into PlateEditor
4. **Phase 4**: Add localStorage persistence and preferences
5. **Phase 5**: Polish transitions, animations, and accessibility
6. **Phase 6**: Update theme colors and styling for consistency

### Backward Compatibility

- All existing props and interfaces remain unchanged
- New props are optional with sensible defaults
- Existing serialization/deserialization functions are reused
- No breaking changes to parent components

### Future Enhancements

- **Editable Raw Mode**: Allow editing HTML directly in raw view
- **Diff View**: Show differences between WYSIWYG and raw HTML
- **Export Options**: Export to Markdown, plain text, or other formats
- **Code Folding**: Collapse sections in raw view for large documents
- **Line Numbers**: Add line numbers in raw view
- **Search in Raw**: Find and replace in raw HTML view
- **Validation**: Real-time HTML validation with error highlighting

### Dependencies

**New Dependencies**: None (uses existing libraries)

**Existing Dependencies**:
- `@udecode/plate` - Core editor functionality
- `slate` - Editor data model
- `@nextui-org/react` - UI components (Switch, Tooltip, etc.)
- `lucide-react` - Icons
- `sonner` - Toast notifications

### Browser Compatibility

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

### Performance Benchmarks

Target performance metrics:
- Initial render: < 500ms
- Mode switch: < 300ms
- Syntax highlighting: < 100ms for documents up to 10,000 characters
- Content serialization: < 50ms
- localStorage operations: < 10ms

### Security Considerations

- **XSS Prevention**: Raw HTML view is read-only by default
- **Content Sanitization**: Existing HTML parsing already handles sanitization
- **localStorage**: No sensitive data stored, only view mode preference
- **CSP Compliance**: No inline styles or scripts in raw view

