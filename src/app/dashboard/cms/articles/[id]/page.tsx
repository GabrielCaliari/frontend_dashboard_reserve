"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LayoutScopeEditor } from "@/src/layout/root-layout";
import { Button, Chip, Spinner } from "@heroui/react";
import { Eye, Save, AlertCircle, FileText } from "lucide-react";
import { useGetArticle } from "@/src/common/hooks/cms/use-get-article";
import { useUpdateArticle } from "@/src/common/hooks/cms/use-update-article";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { useArticleEditorState } from "@/src/common/hooks/cms/use-article-editor-state";
import { ArticleEditorShell } from "@/src/components/cms/articles/article-editor-shell";
import { ArticleEditorGuard } from "@/src/components/cms/articles/article-editor-guard";
import { toast } from "sonner";

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const blogId = searchParams.get("blogId");
  const hasSelectedTenant = useHasSelectedTenant();

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: article, isLoading } = useGetArticle(articleId, blogId ?? undefined);
  const { data: authors, isLoading: isLoadingAuthors } = useGetAuthors();
  const { mutate: updateArticle, isPending } = useUpdateArticle(blogId || "");

  const editorState = useArticleEditorState();

  // Initialize form when article loads
  useEffect(() => {
    if (article) {
      editorState.reset({
        displayTitle: article.displayTitle || article.title || "",
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
        slug: article.slug || "",
        selectedAuthorId: article.authorId || "",
        content: article.content || "",
        focusKeyword: article.focusKeyword || "",
      });
      setHasUnsavedChanges(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  // Track unsaved changes
  useEffect(() => {
    if (!article) return;
    const isDirty =
      editorState.displayTitle !== (article.displayTitle || article.title || "") ||
      editorState.metaTitle !== (article.metaTitle || "") ||
      editorState.metaDescription !== (article.metaDescription || "") ||
      editorState.slug !== (article.slug || "") ||
      editorState.selectedAuthorId !== (article.authorId || "") ||
      editorState.content !== (article.content || "");
    setHasUnsavedChanges(isDirty);
  }, [
    editorState.displayTitle,
    editorState.metaTitle,
    editorState.metaDescription,
    editorState.slug,
    editorState.selectedAuthorId,
    editorState.content,
    article,
  ]);

  const getLastSavedText = () => {
    if (lastSaved) {
      const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
      return minutes < 1 ? "Saved just now" : `Last saved ${minutes} min ago`;
    }
    return hasUnsavedChanges ? "Unsaved changes" : "All changes saved";
  };

  const handleSave = () => {
    if (!editorState.displayTitle.trim()) {
      toast.error("Title required", { description: "Please enter a title before saving." });
      return;
    }
    if (!editorState.selectedAuthorId) {
      toast.error("Author required", { description: "Please select an author." });
      return;
    }
    if (!editorState.slug.trim()) {
      toast.error("Slug required", { description: "Please enter a URL slug." });
      return;
    }

    updateArticle(
      {
        id: articleId,
        displayTitle: editorState.displayTitle.trim(),
        metaTitle: editorState.metaTitle.trim() || editorState.displayTitle.trim().substring(0, 60),
        metaDescription: editorState.metaDescription.trim() || undefined,
        slug: editorState.slug.trim(),
        authorId: editorState.selectedAuthorId,
        content: editorState.content || "",
        focusKeyword: editorState.focusKeyword || undefined,
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
          toast.success("Article saved", { description: "Your changes have been saved." });
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message || error.message || "Unknown error";
          toast.error("Failed to save article", {
            description: Array.isArray(message) ? message.join(", ") : message,
          });
        },
      },
    );
  };

  const handlePreview = () => {
    if (hasUnsavedChanges) {
      toast.info("You have unsaved changes", {
        description: "Consider saving before previewing.",
        action: {
          label: "Save & Preview",
          onClick: () => {
            handleSave();
            router.push(`/dashboard/cms/articles/${articleId}/preview?blogId=${blogId}`);
          },
        },
      });
      return;
    }
    router.push(`/dashboard/cms/articles/${articleId}/preview?blogId=${blogId}`);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push(`/dashboard/cms/articles?blogId=${blogId}`);
      }
    } else {
      router.push(`/dashboard/cms/articles?blogId=${blogId}`);
    }
  };

  // Guards
  if (!hasSelectedTenant) {
    return (
      <ArticleEditorGuard
        icon={<AlertCircle className="w-8 h-8 text-warning" />}
        iconColor="warning"
        title="No Tenant Selected"
        description="Please select a tenant from the sidebar to edit articles."
      />
    );
  }

  if (!blogId) {
    return (
      <ArticleEditorGuard
        icon={<FileText className="w-8 h-8 text-destructive" />}
        iconColor="destructive"
        title="Blog Not Selected"
        description="Blog ID is missing from the URL."
        backHref="/dashboard/cms/articles"
      />
    );
  }

  if (isLoading) {
    return (
      <LayoutScopeEditor routeActive="articles">
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-sm text-muted-foreground">Loading article...</p>
        </div>
      </LayoutScopeEditor>
    );
  }

  if (!article) {
    return (
      <ArticleEditorGuard
        icon={<AlertCircle className="w-8 h-8 text-destructive" />}
        iconColor="destructive"
        title="Article Not Found"
        description="The article you're looking for doesn't exist or has been deleted."
        backHref={`/dashboard/cms/articles?blogId=${blogId}`}
      />
    );
  }

  const subtitle = (
    <>
      <span>Editing draft article</span>
      <span className="text-default-300">·</span>
      <span>{getLastSavedText()}</span>
      {article.status && (
        <Chip
          size="sm"
          variant="flat"
          color={
            article.status === "published"
              ? "success"
              : article.status === "archived"
                ? "default"
                : "warning"
          }
          className="h-5 capitalize"
        >
          {article.status}
        </Chip>
      )}
      {hasUnsavedChanges && (
        <Chip size="sm" variant="flat" color="warning" className="h-5">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            Modified
          </span>
        </Chip>
      )}
    </>
  );

  const actions = (
    <>
      <Button
        variant="bordered"
        size="sm"
        onPress={handlePreview}
        isDisabled={isPending}
        startContent={<Eye className="h-4 w-4" />}
      >
        Preview
      </Button>
      <Button
        color="primary"
        size="sm"
        onPress={handleSave}
        isDisabled={
          isPending ||
          !hasUnsavedChanges ||
          !editorState.displayTitle.trim() ||
          !editorState.selectedAuthorId
        }
        isLoading={isPending}
        startContent={!isPending ? <Save className="h-4 w-4" /> : undefined}
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </>
  );

  return (
    <LayoutScopeEditor routeActive="articles">
      <ArticleEditorShell
        pageTitle="Edit Article"
        pageSubtitle={subtitle}
        actions={actions}
        onBack={handleBack}
        isBackDisabled={isPending}
        highlightedSection={editorState.highlightedSection}
        onContentChange={(stats) => {
          editorState.setContentStats(stats);
          editorState.setContent(stats.content || "");
        }}
        focusKeyword={editorState.focusKeyword}
        initialContent={article.content}
        blogId={blogId ? Number(blogId) : undefined}
        articleId={Number(articleId)}
        contentStats={editorState.contentStats}
        onHighlightEditorSection={editorState.setHighlightedSection}
        onFocusKeywordChange={editorState.setFocusKeyword}
        metaTitle={editorState.metaTitle}
        onMetaTitleChange={editorState.setMetaTitle}
        metaDescription={editorState.metaDescription}
        onMetaDescriptionChange={editorState.setMetaDescription}
        displayTitle={editorState.displayTitle}
        onDisplayTitleChange={editorState.handleTitleChange}
        slug={editorState.slug}
        onSlugChange={editorState.setSlug}
        selectedAuthorId={editorState.selectedAuthorId}
        onAuthorChange={editorState.setSelectedAuthorId}
        authors={authors ?? []}
        isLoadingAuthors={isLoadingAuthors}
        isDisabled={isPending}
      />
    </LayoutScopeEditor>
  );
}
