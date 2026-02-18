"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { PlateEditor } from "@/src/components/cms/editor/plate-editor";
import { SeoSidebar } from "@/src/components/cms/seo-sidebar";
import type { ContentStats } from "@/src/types/cms";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function ArticleEditorPage() {
  const [contentStats, setContentStats] = useState<ContentStats | undefined>(
    undefined,
  );
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [focusKeyword, setFocusKeyword] = useState("Agentic Workflow");

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Editor Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/cms/articles">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Editing Article</h1>
              <p className="text-xs text-muted-foreground">
                Last saved 2 minutes ago
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Preview
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            <PlateEditor
              highlightedSection={highlightedSection}
              onContentChange={setContentStats}
              focusKeyword={focusKeyword}
            />
          </div>

          {/* SEO Sidebar */}
          <SeoSidebar
            contentStats={contentStats}
            onHighlightEditorSection={setHighlightedSection}
            focusKeyword={focusKeyword}
            onFocusKeywordChange={setFocusKeyword}
          />
        </main>
      </div>
    </LayoutScopeRoot>
  );
}
