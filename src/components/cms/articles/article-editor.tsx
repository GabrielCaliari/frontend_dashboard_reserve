"use client";

/**
 * ArticleEditor Component (Fallback)
 *
 * Simple HTML textarea editor for article content.
 * Used as a fallback when the full PlateEditor is not available.
 * For the rich text editor, see PlateEditor at @/src/components/cms/editor/plate-editor.tsx
 *
 * Features:
 * - Basic HTML text editing
 * - Character count display
 * - Auto-save with debounce
 *
 * **Validates: Requirements 17.4, 18.2, 18.7**
 */

import { useCallback, useEffect, useRef, useState } from"react";

interface ArticleEditorProps {
 initialContent: string;
 onChange: (content: string) => void;
 placeholder?: string;
 autoSave?: boolean;
 autoSaveDelay?: number;
}

export default function ArticleEditor({
 initialContent,
 onChange,
 placeholder ="Start writing your article...",
 autoSave = true,
 autoSaveDelay = 2000,
}: ArticleEditorProps) {
 const [content, setContent] = useState(initialContent);
 const [charCount, setCharCount] = useState(initialContent.length);
 const [isSaving, setIsSaving] = useState(false);
 const timeoutRef = useRef<NodeJS.Timeout | null>(null);

 // Handle content changes with debounced auto-save
 const handleChange = useCallback(
 (value: string) => {
 setContent(value);
 setCharCount(value.replace(/<[^>]*>/g,"").length);

 if (autoSave) {
 setIsSaving(true);
 if (timeoutRef.current) clearTimeout(timeoutRef.current);

 timeoutRef.current = setTimeout(() => {
 onChange(value);
 setIsSaving(false);
 }, autoSaveDelay);
 } else {
 onChange(value);
 }
 },
 [onChange, autoSave, autoSaveDelay],
 );

 useEffect(() => {
 return () => {
 if (timeoutRef.current) clearTimeout(timeoutRef.current);
 };
 }, []);

 return (
 <div className="w-full border border-border rounded-lg overflow-hidden bg-card">
 {/* Editor content */}
 <textarea
 value={content}
 onChange={(e) => handleChange(e.target.value)}
 placeholder={placeholder}
 className="w-full min-h-[400px] max-h-[600px] p-4 bg-transparent text-foreground placeholder:text-muted-foreground resize-y focus:outline-none"
 />

 {/* Footer with character count and save status */}
 <div className="flex items-center justify-end gap-3 px-4 py-2 border-t border-border text-sm text-muted-foreground">
 {isSaving && <span className="text-warning">Saving...</span>}
 <span>{charCount.toLocaleString()} characters</span>
 </div>
 </div>
 );
}
