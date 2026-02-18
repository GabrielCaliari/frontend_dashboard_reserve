# Design Document: Plate Editor Overhaul for Markdown

## 1. Overview

### 1.1 Purpose
This design document outlines the technical architecture and implementation approach for overhauling the Plate editor to provide a seamless markdown editing experience with dual view modes (Formatted and Markdown source), visual consistency, and reliable content persistence.

### 1.2 Design Goals
- **Markdown-First**: Store and work with markdown natively, not HTML
- **Visual Consistency**: Match NextUI theme and dashboard design patterns
- **Dual View Modes**: Seamless switching between formatted and markdown source views
- **Zero Data Loss**: Reliable serialization/deserialization between Slate and markdown
- **Performance**: Responsive editing even with large documents (10,000+ words)
- **Accessibility**: WCAG AA compliant with full keyboard navigation

### 1.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Use `remark` ecosystem for markdown | Industry standard, extensible, supports GFM |
| Store markdown in database | Portability, version control friendly, human-readable |
| Keep Plate.js for formatted view | Proven rich text editing, existing integration |
| Use `react-syntax-highlighter` for markdown view | Lightweight, theme support, good performance |
| Implement custom Slate ↔ Markdown serializers | Full control over conversion, handles edge cases |

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PlateEditor Component                 │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ View Mode    │  │   Editor     │  │   Chapter    │  │
│  │   Toggle     │  │   Toolbar    │  │  Navigation  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │           Content Area (Switchable)                │  │
│  │  ┌─────────────────┐  ┌──────────────────────┐   │  │
│  │  │ Formatted View  │  │  Markdown Source     │   │  │
│  │  │  (Plate.js)     │  │  (Syntax Highlight)  │   │  │
│  │  └─────────────────┘  └──────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Markdown Conversion Layer                  │  │
│  │  ┌──────────────┐         ┌──────────────┐        │  │
│  │  │ Slate → MD   │  ←→     │  MD → Slate  │        │  │
│  │  │ Serializer   │         │ Deserializer │        │  │
│  │  └──────────────┘         └──────────────┘        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Component Structure

```
src/components/cms/editor/
├── plate-editor.tsx              # Main editor component
├── markdown-view.tsx             # NEW: Markdown source view
├── view-mode-toggle.tsx          # NEW: Toggle component
├── markdown-serializer.ts        # NEW: Slate → Markdown
├── markdown-deserializer.ts      # NEW: Markdown → Slate
└── types.ts                      # Shared types
```


## 3. Data Flow

### 3.1 Content Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interaction                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Current View Mode?                        │
├──────────────────────────┬──────────────────────────────────┤
│   Formatted View         │      Markdown View               │
└────────────┬─────────────┴──────────────┬──────────────────┘
             │                             │
             ▼                             ▼
┌────────────────────────┐    ┌───────────────────────────────┐
│  Plate.js Editor       │    │  Markdown Textarea            │
│  (Slate Value)         │    │  (Raw Markdown String)        │
└────────────┬───────────┘    └───────────┬───────────────────┘
             │                             │
             │ onChange                    │ onChange
             ▼                             ▼
┌────────────────────────┐    ┌───────────────────────────────┐
│  Slate → Markdown      │    │  Markdown → Slate             │
│  Serializer            │    │  Deserializer                 │
└────────────┬───────────┘    └───────────┬───────────────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
                ┌───────────────────────┐
                │  Unified Markdown     │
                │  State                │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Content Analysis     │
                │  (Stats, Chapters)    │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Parent Component     │
                │  (onContentChange)    │
                └───────────────────────┘
```

### 3.2 View Mode Switching Flow

```
User clicks toggle
       │
       ▼
┌──────────────────┐
│ Current mode?    │
├──────────────────┤
│ Formatted → MD   │  or  │ MD → Formatted │
└────────┬─────────┘      └────────┬───────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ Serialize Slate    │    │ Parse Markdown     │
│ to Markdown        │    │ to Slate           │
└────────┬───────────┘    └────────┬───────────┘
         │                          │
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ Validate Markdown  │    │ Validate Slate     │
└────────┬───────────┘    └────────┬───────────┘
         │                          │
         │ Valid?                   │ Valid?
         ▼                          ▼
┌────────────────────┐    ┌────────────────────┐
│ Switch to MD View  │    │ Switch to Format   │
│ Show in textarea   │    │ Render in Plate    │
└────────────────────┘    └────────────────────┘
```


## 4. Component Specifications

### 4.1 ViewModeToggle Component

**Purpose**: Provides UI control for switching between Formatted and Markdown view modes.

**Interface**:
```typescript
interface ViewModeToggleProps {
  mode: 'formatted' | 'markdown';
  onModeChange: (mode: 'formatted' | 'markdown') => void;
  disabled?: boolean;
  className?: string;
}
```

**Implementation Details**:
- Uses NextUI `Switch` component for consistent styling
- Displays icons: Eye (Formatted) and FileCode (Markdown)
- Shows tooltip with keyboard shortcut (Ctrl+Shift+M)
- Provides ARIA labels for accessibility
- Disabled during save operations
- Smooth transition animation when toggling

**Visual Design**:
```
┌─────────────────────────────────────┐
│  [Eye Icon] Formatted  ○━━━━  Markdown [FileCode Icon]  │
└─────────────────────────────────────┘
```

### 4.2 MarkdownView Component

**Purpose**: Displays and edits markdown source code with syntax highlighting.

**Interface**:
```typescript
interface MarkdownViewProps {
  markdown: string;
  onChange: (markdown: string) => void;
  readOnly?: boolean;
  className?: string;
  onCopy?: () => void;
}
```

**Implementation Details**:
- Uses `react-syntax-highlighter` for syntax highlighting
- Editable textarea with monospace font
- Line numbers displayed on the left
- Copy-to-clipboard button in top-right corner
- Scrollable with proper overflow handling
- Tab key inserts 2 spaces (not focus change)
- Syntax highlighting for:
  - Headers (#, ##, ###)
  - Bold (**text**)
  - Italic (*text*)
  - Links ([text](url))
  - Code blocks (```language)
  - Lists (-, *, 1.)
  - Blockquotes (>)

**Visual Design**:
```
┌─────────────────────────────────────────────────┐
│  Markdown Source                    [Copy] [✓]  │
├─────────────────────────────────────────────────┤
│ 1  │ # Article Title                            │
│ 2  │                                             │
│ 3  │ This is a **bold** paragraph with *italic*.│
│ 4  │                                             │
│ 5  │ ## Section Heading                         │
│ 6  │                                             │
│ 7  │ - List item 1                              │
│ 8  │ - List item 2                              │
└─────────────────────────────────────────────────┘
```


### 4.3 Enhanced PlateEditor Component

**Updated Interface**:
```typescript
interface PlateEditorProps {
  highlightedSection?: string | null;
  onContentChange?: (stats: ContentStats) => void;
  focusKeyword?: string;
  initialContent?: string;
  blogId?: number;
  articleId?: number;
  initialViewMode?: 'formatted' | 'markdown'; // NEW
  onViewModeChange?: (mode: 'formatted' | 'markdown') => void; // NEW
}
```

**New State**:
```typescript
const [viewMode, setViewMode] = useState<'formatted' | 'markdown'>('formatted');
const [isTransitioning, setIsTransitioning] = useState(false);
const [markdownContent, setMarkdownContent] = useState('');
```

**Key Methods**:
```typescript
// Serialize Slate to Markdown
const serializeToMarkdown = (slateValue: Value): string => {
  // Use remark/unified to convert Slate to markdown
};

// Deserialize Markdown to Slate
const deserializeFromMarkdown = (markdown: string): Value => {
  // Use remark/unified to convert markdown to Slate
};

// Handle view mode change
const handleViewModeChange = (newMode: 'formatted' | 'markdown') => {
  setIsTransitioning(true);
  
  if (newMode === 'markdown') {
    // Serialize current Slate value to markdown
    const markdown = serializeToMarkdown(editor.children);
    setMarkdownContent(markdown);
  } else {
    // Deserialize markdown to Slate value
    const slateValue = deserializeFromMarkdown(markdownContent);
    editor.children = slateValue;
  }
  
  setViewMode(newMode);
  setIsTransitioning(false);
  
  // Save preference to localStorage
  localStorage.setItem('plate-editor-view-mode', newMode);
};
```

### 4.4 Enhanced EditorToolbar Component

**Updated Interface**:
```typescript
interface EditorToolbarProps {
  onInsertImage: () => void;
  viewMode: 'formatted' | 'markdown'; // NEW
  onViewModeChange: (mode: 'formatted' | 'markdown') => void; // NEW
  disabled?: boolean; // NEW
}
```

**Layout Changes**:
- Add ViewModeToggle to the right side of toolbar
- Maintain existing undo/redo and insert image buttons
- Disable insert image button in markdown mode
- Show markdown-specific help in markdown mode


## 5. Data Models

### 5.1 ViewMode Type

```typescript
type ViewMode = 'formatted' | 'markdown';
```

### 5.2 ViewModePreference (localStorage)

```typescript
interface ViewModePreference {
  mode: ViewMode;
  timestamp: number;
  userId?: string; // Optional for multi-user scenarios
}
```

**Storage Key**: `plate-editor-view-mode`

### 5.3 Enhanced ContentStats

The existing `ContentStats` interface remains unchanged, but the analysis function will be called after mode transitions to ensure stats are up-to-date.

```typescript
interface ContentStats {
  wordCount: number;
  headings: Array<{ type: string; text: string }>;
  hasImages: boolean;
  hasExternalLinks: boolean;
  hasInternalLinks: boolean;
  keywordCount: number;
  keywordDensity: number;
  keywordInFirstTenPercent: boolean;
  keywordInSubheadings: boolean;
  keywordInImageAlt: boolean;
  shortParagraphs: boolean;
  plainText: string;
  metaDescription: string;
  content: string; // Markdown content
}
```

## 6. Markdown Conversion

### 6.1 Slate to Markdown Serialization

**Library**: `remark` + `remark-gfm`

**Conversion Rules**:

| Slate Node Type | Markdown Output |
|----------------|-----------------|
| `h1` | `# Heading` |
| `h2` | `## Heading` |
| `h3` | `### Heading` |
| `p` | Plain paragraph |
| `blockquote` | `> Quote` |
| `ul` | `- Item` or `* Item` |
| `ol` | `1. Item` |
| `img` | `![alt](url)` |
| `a` | `[text](url)` |
| `code` (inline) | `` `code` `` |
| `code_block` | ` ```language\ncode\n``` ` |

**Text Marks**:

| Mark | Markdown |
|------|----------|
| `bold` | `**text**` |
| `italic` | `*text*` |
| `underline` | `<u>text</u>` (HTML fallback) |
| `strikethrough` | `~~text~~` (GFM) |
| `code` | `` `text` `` |


### 6.2 Markdown to Slate Deserialization

**Library**: `remark-parse` + `mdast-util-to-hast` + custom transformer

**Conversion Rules**:

| Markdown Syntax | Slate Node Type |
|----------------|-----------------|
| `# Heading` | `{ type: 'h1', children: [...] }` |
| `## Heading` | `{ type: 'h2', children: [...] }` |
| `### Heading` | `{ type: 'h3', children: [...] }` |
| Plain paragraph | `{ type: 'p', children: [...] }` |
| `> Quote` | `{ type: 'blockquote', children: [...] }` |
| `- Item` or `* Item` | `{ type: 'ul', children: [{ type: 'li', ... }] }` |
| `1. Item` | `{ type: 'ol', children: [{ type: 'li', ... }] }` |
| `![alt](url)` | `{ type: 'img', url, alt, children: [{ text: '' }] }` |
| `[text](url)` | `{ type: 'a', url, children: [...] }` |
| `` `code` `` | `{ text: 'code', code: true }` |
| ` ```language\ncode\n``` ` | `{ type: 'code_block', language, children: [...] }` |

**Text Marks**:

| Markdown | Slate Mark |
|----------|-----------|
| `**text**` | `{ text: 'text', bold: true }` |
| `*text*` | `{ text: 'text', italic: true }` |
| `<u>text</u>` | `{ text: 'text', underline: true }` |
| `~~text~~` | `{ text: 'text', strikethrough: true }` |
| `` `text` `` | `{ text: 'text', code: true }` |

### 6.3 Serialization Implementation

```typescript
// src/components/cms/editor/markdown-serializer.ts
import { Value } from 'platejs';

export function serializeToMarkdown(nodes: Value): string {
  return nodes.map(node => serializeNode(node)).join('\n\n');
}

function serializeNode(node: any): string {
  // Handle block nodes
  if (node.type === 'h1') {
    return `# ${serializeChildren(node.children)}`;
  }
  if (node.type === 'h2') {
    return `## ${serializeChildren(node.children)}`;
  }
  if (node.type === 'h3') {
    return `### ${serializeChildren(node.children)}`;
  }
  if (node.type === 'blockquote') {
    return `> ${serializeChildren(node.children)}`;
  }
  if (node.type === 'img') {
    return `![${node.alt || ''}](${node.url})`;
  }
  if (node.type === 'p') {
    return serializeChildren(node.children);
  }
  
  // Default paragraph
  return serializeChildren(node.children);
}

function serializeChildren(children: any[]): string {
  return children.map(child => {
    if (child.text !== undefined) {
      let text = child.text;
      if (child.bold) text = `**${text}**`;
      if (child.italic) text = `*${text}*`;
      if (child.strikethrough) text = `~~${text}~~`;
      if (child.code) text = `\`${text}\``;
      return text;
    }
    return serializeNode(child);
  }).join('');
}
```


### 6.4 Deserialization Implementation

```typescript
// src/components/cms/editor/markdown-deserializer.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { Value } from 'platejs';

export function deserializeFromMarkdown(markdown: string): Value {
  if (!markdown || !markdown.trim()) {
    return [{ type: 'p', children: [{ text: '' }] }];
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm);

  const tree = processor.parse(markdown);
  const slateNodes = convertMdastToSlate(tree);

  return slateNodes.length > 0 
    ? slateNodes 
    : [{ type: 'p', children: [{ text: '' }] }];
}

function convertMdastToSlate(node: any): any[] {
  if (node.type === 'root') {
    return node.children.flatMap(convertMdastToSlate);
  }

  if (node.type === 'heading') {
    return [{
      type: `h${node.depth}`,
      children: convertInlineNodes(node.children)
    }];
  }

  if (node.type === 'paragraph') {
    return [{
      type: 'p',
      children: convertInlineNodes(node.children)
    }];
  }

  if (node.type === 'blockquote') {
    return [{
      type: 'blockquote',
      children: node.children.flatMap(convertMdastToSlate)
    }];
  }

  if (node.type === 'list') {
    return [{
      type: node.ordered ? 'ol' : 'ul',
      children: node.children.map((item: any) => ({
        type: 'li',
        children: item.children.flatMap(convertMdastToSlate)
      }))
    }];
  }

  if (node.type === 'image') {
    return [{
      type: 'img',
      url: node.url,
      alt: node.alt || '',
      children: [{ text: '' }]
    }];
  }

  if (node.type === 'code') {
    return [{
      type: 'code_block',
      language: node.lang || 'text',
      children: [{ text: node.value }]
    }];
  }

  return [];
}

function convertInlineNodes(nodes: any[]): any[] {
  return nodes.flatMap(node => {
    if (node.type === 'text') {
      return [{ text: node.value }];
    }

    if (node.type === 'strong') {
      return convertInlineNodes(node.children).map(child => ({
        ...child,
        bold: true
      }));
    }

    if (node.type === 'emphasis') {
      return convertInlineNodes(node.children).map(child => ({
        ...child,
        italic: true
      }));
    }

    if (node.type === 'delete') {
      return convertInlineNodes(node.children).map(child => ({
        ...child,
        strikethrough: true
      }));
    }

    if (node.type === 'inlineCode') {
      return [{ text: node.value, code: true }];
    }

    if (node.type === 'link') {
      return [{
        type: 'a',
        url: node.url,
        children: convertInlineNodes(node.children)
      }];
    }

    return [{ text: '' }];
  });
}
```


## 7. Visual Consistency

### 7.1 Color Scheme Alignment

**Current Issue**: The editor content area has a different background color than other Card components.

**Solution**:
- Use `bg-content1` for the editor content area (matches NextUI Card default)
- Use `bg-content1` for the toolbar background
- Use `border-border` for all borders
- Use `text-foreground` for primary text
- Use `text-muted-foreground` for secondary text

**Before**:
```tsx
<div className="bg-background"> {/* Wrong - doesn't match cards */}
  <PlateContent />
</div>
```

**After**:
```tsx
<div className="bg-content1"> {/* Correct - matches cards */}
  <PlateContent />
</div>
```

### 7.2 Component Styling Standards

All editor components must follow these styling rules:

```typescript
// Editor Container
className="flex h-full bg-content1"

// Toolbar
className="sticky top-0 z-40 flex items-center gap-1.5 p-2 border-b border-border bg-content1"

// Content Area (Formatted View)
className="flex-1 overflow-y-auto bg-content1"

// Content Area (Markdown View)
className="flex-1 overflow-y-auto bg-content1 font-mono"

// Chapter Sidebar
className="w-64 shrink-0 border-r border-border bg-content1"

// Buttons
className="hover:bg-accent hover:text-accent-foreground"
```

### 7.3 Dark Mode Support

All components must support dark mode using Tailwind's theme system:

- Use semantic color tokens (foreground, background, muted, etc.)
- Avoid hardcoded colors
- Test in both light and dark modes
- Ensure proper contrast ratios (WCAG AA)


## 8. Implementation Strategy

### 8.1 Phase 1: Foundation (Visual Consistency)
**Goal**: Fix background colors and styling inconsistencies

**Tasks**:
1. Update PlateEditor component to use `bg-content1`
2. Update toolbar styling to match dashboard patterns
3. Update chapter sidebar styling
4. Test in both light and dark modes
5. Verify consistency across all article pages

**Acceptance**: Editor visually matches other Card components in the dashboard

### 8.2 Phase 2: Markdown Serialization
**Goal**: Implement reliable Slate ↔ Markdown conversion

**Tasks**:
1. Install dependencies: `remark`, `remark-parse`, `remark-gfm`, `unified`
2. Create `markdown-serializer.ts` with Slate → Markdown conversion
3. Create `markdown-deserializer.ts` with Markdown → Slate conversion
4. Write unit tests for serialization/deserialization
5. Test with various markdown patterns (headings, lists, code, images, links)
6. Ensure round-trip conversion preserves content

**Acceptance**: Content can be converted between Slate and Markdown without data loss

### 8.3 Phase 3: Markdown View Component
**Goal**: Create markdown source view with syntax highlighting

**Tasks**:
1. Install `react-syntax-highlighter` or similar library
2. Create `MarkdownView` component with textarea
3. Implement syntax highlighting for markdown
4. Add line numbers
5. Add copy-to-clipboard functionality
6. Handle tab key for indentation
7. Test with large documents

**Acceptance**: Users can view and edit raw markdown with syntax highlighting

### 8.4 Phase 4: View Mode Toggle
**Goal**: Enable switching between formatted and markdown views

**Tasks**:
1. Create `ViewModeToggle` component using NextUI Switch
2. Add toggle to editor toolbar
3. Implement view mode state management
4. Implement view switching logic with serialization/deserialization
5. Add keyboard shortcut (Ctrl+Shift+M)
6. Save preference to localStorage
7. Add transition animations

**Acceptance**: Users can seamlessly switch between formatted and markdown views

### 8.5 Phase 5: Integration & Testing
**Goal**: Integrate all components and ensure reliability

**Tasks**:
1. Update parent components to handle markdown content
2. Update API calls to send/receive markdown
3. Update content stats analysis for markdown
4. Test with existing articles
5. Test edge cases (empty content, special characters, large documents)
6. Performance testing
7. Accessibility testing

**Acceptance**: Complete editor works end-to-end with markdown storage

