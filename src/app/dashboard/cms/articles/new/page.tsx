"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Spinner,
} from "@heroui/react";
import { ArrowLeft, Save, AlertCircle, FileText, PenLine, User } from "lucide-react";
import { useCreateArticle } from "@/src/common/hooks/cms/use-create-article";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { toast } from "sonner";
import { generateSlug } from "@/src/common/utils/slug-generator";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";

export default function NewArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get("blogId");
  const hasSelectedTenant = useHasSelectedTenant();

  const [title, setTitle] = useState("");
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

  const { data: authors, isLoading: isLoadingAuthors } = useGetAuthors();
  const { mutate: createArticle, isPending } = useCreateArticle(blogId || "");

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!metaTitle || metaTitle === title.substring(0, 60)) {
      setMetaTitle(value.substring(0, 60));
    }
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Title required", {
        description: "Please enter a title for the article before saving.",
      });
      return;
    }

    if (!metaTitle.trim()) {
      toast.error("Meta title required", {
        description: "Please enter a meta title for SEO.",
      });
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug required", {
        description: "Please enter a URL slug for the article.",
      });
      return;
    }

    if (!selectedAuthorId) {
      toast.error("Author required", {
        description: "Please select an author for the article.",
      });
      return;
    }

    if (!content.trim()) {
      toast.error("Content required", {
        description: "Please add some content to the article before saving.",
      });
      return;
    }

    if (!blogId) {
      toast.error("Blog not selected", {
        description: "Blog ID is missing. Please go back and select a blog.",
      });
      return;
    }

    createArticle(
      {
        displayTitle: title.trim(),
        metaTitle: metaTitle.trim(),
        slug: slug.trim(),
        authorId: selectedAuthorId,
        blogId: blogId,
        content: content,
      },
      {
        onSuccess: () => {
          toast.success("Article created", {
            description: "Your article has been created as a draft.",
          });
          router.push(`/dashboard/cms/articles?blogId=${blogId}`);
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error.message || "Unknown error";
          toast.error("Failed to create article", {
            description: Array.isArray(message) ? message.join(", ") : message,
          });
        },
      },
    );
  };

  const handleCancel = () => {
    if (title || content || metaTitle || slug || selectedAuthorId) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.push(
          `/dashboard/cms/articles${blogId ? `?blogId=${blogId}` : ""}`,
        );
      }
    } else {
      router.push(
        `/dashboard/cms/articles${blogId ? `?blogId=${blogId}` : ""}`,
      );
    }
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
                  Please select a tenant from the sidebar to create articles.
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
                  Please select a blog before creating an article.
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

  // No authors available
  if (!isLoadingAuthors && (!authors || authors.length === 0)) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-warning/20 bg-warning/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Authors Available
                </h3>
                <p className="text-muted-foreground mb-6">
                  You need to create at least one author before creating articles.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="bordered"
                    onPress={() => router.push("/dashboard/cms/articles")}
                    startContent={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back to Articles
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Page Header -- follows dashboard pattern */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={handleCancel}
              isDisabled={isPending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                New Article
              </h1>
              <p className="text-default-500">Writing a new draft article</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pt-1">
            <Button
              variant="bordered"
              size="sm"
              onPress={handleCancel}
              isDisabled={isPending}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onPress={handleSave}
              isDisabled={
                isPending ||
                !title.trim() ||
                !metaTitle.trim() ||
                !slug.trim() ||
                !selectedAuthorId
              }
              isLoading={isPending}
              startContent={
                !isPending ? <Save className="h-4 w-4" /> : undefined
              }
            >
              {isPending ? "Creating..." : "Create Article"}
            </Button>
          </div>
        </div>

        {/* Article Metadata Card */}
        <Card>
          <CardBody className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Display Title"
                placeholder="Enter article title..."
                value={title}
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
                description={`${title.length}/255 characters`}
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
                isRequired
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
                  setSelectedAuthorId(selected);
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
        <div className="flex gap-6 items-start h-[700px]">
          {/* Editor */}
          <Card className="flex-1 min-w-0 overflow-hidden h-full">
            <CardBody className="p-0 h-full">
              <PlateEditor
                highlightedSection={highlightedSection}
                onContentChange={(stats) => {
                  setContentStats(stats);
                  setContent(stats.content || "");
                }}
                focusKeyword={focusKeyword}
              />
            </CardBody>
          </Card>

          {/* SEO Sidebar */}
          <Card className="w-80 flex-shrink-0">
            <CardBody className="p-0">
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
