"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { PlateEditor } from "@/src/components/cms/editor/plate-editor";
import { SeoSidebar } from "@/src/components/cms/seo-sidebar";
import type { ContentStats } from "@/src/types/cms";
import {
  Button,
  Card,
  CardBody,
  Input,
  Select,
  SelectItem,
  Chip,
  Spinner,
} from "@heroui/react";
import {
  ArrowLeft,
  Save,
  Eye,
  AlertCircle,
  FileText,
  PenLine,
  User,
} from "lucide-react";
import { useGetArticle } from "@/src/common/hooks/cms/use-get-article";
import { useUpdateArticle } from "@/src/common/hooks/cms/use-update-article";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { toast } from "sonner";
import { generateSlug } from "@/src/common/utils/slug-generator";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";

export default function ArticleEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = Number(params.id);
  const blogId = searchParams.get("blogId");
  const hasSelectedTenant = useHasSelectedTenant();

  const [displayTitle, setDisplayTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [content, setContent] = useState("");
  const [contentStats, setContentStats] = useState<ContentStats | undefined>(
    undefined,
  );
  const [highlightedSection, setHighlightedSection] = useState<string | null>(
    null,
  );
  const [focusKeyword, setFocusKeyword] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { data: article, isLoading } = useGetArticle(
    blogId ? parseInt(blogId) : 0,
    articleId,
  );
  const { data: authors, isLoading: isLoadingAuthors } = useGetAuthors();
  const { mutate: updateArticle, isPending } = useUpdateArticle(blogId || "");

  // Initialize form with article data
  useEffect(() => {
    if (article) {
      setDisplayTitle(article.displayTitle || article.title || "");
      setMetaTitle(article.metaTitle || "");
      setSlug(article.slug || "");
      setSelectedAuthorId(article.authorId || "");
      setContent(article.content || "");
      setFocusKeyword(article.focusKeyword || "");
      setHasUnsavedChanges(false);
    }
  }, [article]);

  // Track changes
  useEffect(() => {
    if (
      article &&
      (displayTitle !== (article.displayTitle || article.title || "") ||
        metaTitle !== (article.metaTitle || "") ||
        slug !== (article.slug || "") ||
        selectedAuthorId !== (article.authorId || "") ||
        content !== (article.content || ""))
    ) {
      setHasUnsavedChanges(true);
    }
  }, [displayTitle, metaTitle, slug, selectedAuthorId, content, article]);

  const handleTitleChange = (value: string) => {
    setDisplayTitle(value);
    if (!metaTitle || metaTitle === (article?.metaTitle || "")) {
      setMetaTitle(value.substring(0, 60));
    }
    if (!slug || slug === (article?.slug || "")) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = () => {
    if (!displayTitle.trim()) {
      toast.error("Title required", {
        description: "Please enter a title for the article before saving.",
      });
      return;
    }

    if (!selectedAuthorId) {
      toast.error("Author required", {
        description: "Please select an author for the article.",
      });
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug required", {
        description: "Please enter a URL slug for the article.",
      });
      return;
    }

    updateArticle(
      {
        id: articleId,
        displayTitle: displayTitle.trim(),
        metaTitle: metaTitle.trim() || displayTitle.trim().substring(0, 60),
        slug: slug.trim(),
        authorId: selectedAuthorId,
        content: content || "",
        focusKeyword: focusKeyword || undefined,
      },
      {
        onSuccess: () => {
          setHasUnsavedChanges(false);
          setLastSaved(new Date());
          toast.success("Article saved", {
            description: "Your changes have been saved successfully.",
          });
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error.message || "Unknown error";
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
            router.push(
              `/dashboard/cms/articles/${articleId}/preview?blogId=${blogId}`,
            );
          },
        },
      });
      return;
    }
    router.push(
      `/dashboard/cms/articles/${articleId}/preview?blogId=${blogId}`,
    );
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.push(`/dashboard/cms/articles?blogId=${blogId}`);
      }
    } else {
      router.push(`/dashboard/cms/articles?blogId=${blogId}`);
    }
  };

  // Format last saved time
  const getLastSavedText = () => {
    if (lastSaved) {
      const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
      if (minutes < 1) return "Saved just now";
      return `Last saved ${minutes} min ago`;
    }
    if (hasUnsavedChanges) return "Unsaved changes";
    return "All changes saved";
  };

  // No tenant selected
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-warning/20 bg-warning/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-muted-foreground">
                  Please select a tenant from the sidebar to edit articles.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // No blog selected
  if (!blogId) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-destructive/20 bg-destructive/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Blog Not Selected
                </h3>
                <p className="text-muted-foreground mb-6">
                  Blog ID is missing from the URL.
                </p>
                <Button
                  variant="bordered"
                  onPress={() => router.push("/dashboard/cms/articles")}
                  startContent={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Articles
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Spinner color="primary" size="lg" />
          <p className="text-sm text-muted-foreground">Loading article...</p>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Article not found
  if (!article) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-destructive/20 bg-destructive/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Article Not Found
                </h3>
                <p className="text-muted-foreground mb-6">
                  The article you&apos;re looking for doesn&apos;t exist or has
                  been deleted.
                </p>
                <Button
                  variant="bordered"
                  onPress={() =>
                    router.push(`/dashboard/cms/articles?blogId=${blogId}`)
                  }
                  startContent={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Articles
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="px-6 py-4 space-y-4 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={handleCancel}
              isDisabled={isPending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <PenLine className="w-4 h-4 text-white" />
                </div>
                Edit Article
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-default-500 text-xs">{getLastSavedText()}</p>
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
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    className="h-5"
                  >
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                      Modified
                    </span>
                  </Chip>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
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
              isDisabled={isPending || !hasUnsavedChanges || !displayTitle.trim() || !selectedAuthorId}
              isLoading={isPending}
              startContent={
                !isPending ? <Save className="h-4 w-4" /> : undefined
              }
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Article Metadata Card */}
        <Card>
          <CardBody className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Display Title"
                placeholder="Enter article title..."
                value={displayTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                isDisabled={isPending}
                maxLength={255}
                variant="bordered"
                size="lg"
                isRequired
                classNames={{
                  input: "text-lg font-semibold",
                  inputWrapper:
                    "border-border data-[hover=true]:border-primary/50",
                  label: "text-muted-foreground",
                }}
                description={`${displayTitle.length}/255 characters`}
              />

              <Input
                label="Meta Title (SEO)"
                placeholder="SEO-optimized title..."
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                isDisabled={isPending}
                maxLength={60}
                variant="bordered"
                size="lg"
                classNames={{
                  inputWrapper:
                    "border-border data-[hover=true]:border-primary/50",
                  label: "text-muted-foreground",
                }}
                description={`${metaTitle.length}/60 characters`}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="URL Slug"
                placeholder="article-url-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                isDisabled={isPending}
                maxLength={255}
                variant="bordered"
                isRequired
                classNames={{
                  inputWrapper:
                    "border-border data-[hover=true]:border-primary/50",
                  label: "text-muted-foreground",
                }}
                description={`${slug.length}/255 characters`}
              />

              <Select
                label="Author"
                placeholder="Select an author"
                selectedKeys={selectedAuthorId ? [selectedAuthorId] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  if (selected) setSelectedAuthorId(selected);
                }}
                isDisabled={isPending || isLoadingAuthors}
                variant="bordered"
                isRequired
                isLoading={isLoadingAuthors}
                startContent={<User className="w-4 h-4 text-default-400" />}
                classNames={{
                  trigger:
                    "border-border data-[hover=true]:border-primary/50",
                  label: "text-muted-foreground",
                }}
              >
                {authors && authors.length > 0 ? (
                  authors.map((author) => (
                    <SelectItem key={author.id}>
                      {author.firstName} {author.lastName}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem key="no-authors" isDisabled>
                    No authors available
                  </SelectItem>
                )}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Editor + SEO Sidebar */}
        <div
          className="flex gap-4 items-stretch"
          style={{ height: "calc(100vh - 340px)", minHeight: "500px" }}
        >
          {/* Editor */}
          <Card className="flex-1 min-w-0 overflow-hidden">
            <CardBody className="p-0 h-full overflow-hidden">
              <PlateEditor
                highlightedSection={highlightedSection}
                onContentChange={(stats) => {
                  setContentStats(stats);
                  setContent(stats.content || "");
                }}
                focusKeyword={focusKeyword}
                initialContent={article.content}
                blogId={blogId ? Number(blogId) : undefined}
                articleId={articleId}
              />
            </CardBody>
          </Card>

          {/* SEO Sidebar */}
          <Card className="w-72 flex-shrink-0 overflow-hidden hidden xl:flex">
            <CardBody className="p-0 overflow-y-auto">
              <SeoSidebar
                contentStats={contentStats}
                onHighlightEditorSection={setHighlightedSection}
                focusKeyword={focusKeyword}
                onFocusKeywordChange={setFocusKeyword}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
