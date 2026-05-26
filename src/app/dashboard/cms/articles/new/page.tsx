"use client";

import { useRouter, useSearchParams } from"next/navigation";
import { LayoutScopeEditor } from"@/src/layout/root-layout";
import { Button } from"@heroui/react";
import { Save, AlertCircle, FileText, User } from"lucide-react";
import { useCreateArticle } from"@/src/common/hooks/cms/use-create-article";
import { useGetAuthors } from"@/src/common/hooks/cms/use-get-authors";
import { useHasSelectedTenant } from"@/src/common/stores/tenant-store";
import { useArticleEditorState } from"@/src/common/hooks/cms/use-article-editor-state";
import { articleLanguagePattern } from"@/src/common/schemas/cms-article-schema";
import { ArticleEditorShell } from"@/src/components/cms/articles/article-editor-shell";
import { ArticleEditorGuard } from"@/src/components/cms/articles/article-editor-guard";
import { toast } from"sonner";

export default function NewArticlePage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const blogId = searchParams.get("blogId");
 const hasSelectedTenant = useHasSelectedTenant();

 const { data: authors, isLoading: isLoadingAuthors } = useGetAuthors();
 const { mutate: createArticle, isPending } = useCreateArticle(blogId ||"");

 const editorState = useArticleEditorState();

 const handleSave = () => {
 if (!editorState.displayTitle.trim()) {
 toast.error("Title required", { description:"Please enter a title before saving." });
 return;
 }
 if (!editorState.metaTitle.trim()) {
 toast.error("Meta title required", { description:"Please enter a meta title for SEO." });
 return;
 }
 if (!editorState.slug.trim()) {
 toast.error("Slug required", { description:"Please enter a URL slug." });
 return;
 }
 if (!editorState.selectedAuthorId) {
 toast.error("Author required", { description:"Please select an author." });
 return;
 }
 if (!editorState.content.trim()) {
 toast.error("Content required", { description:"Please add some content before saving." });
 return;
 }
 if (!articleLanguagePattern.test(editorState.language.trim().toLowerCase())) {
 toast.error("Invalid language", {
 description:"Use the lowercase locale format, for example en_us or pt_br.",
 });
 return;
 }
 if (!blogId) {
 toast.error("Blog not selected", {
 description:"Blog ID is missing. Please go back and select a blog.",
 });
 return;
 }

 createArticle(
 {
 displayTitle: editorState.displayTitle.trim(),
 metaTitle: editorState.metaTitle.trim(),
 metaDescription: editorState.metaDescription.trim() || undefined,
 slug: editorState.slug.trim(),
 authorId: editorState.selectedAuthorId,
 blogId,
 content: editorState.content,
 focusKeyword: editorState.focusKeyword || undefined,
 coverImageId: editorState.coverImageId || undefined,
 language: editorState.language.trim().toLowerCase(),
 },
 {
 onSuccess: () => {
 toast.success("Article created", { description:"Your article has been created as a draft." });
 router.push(`/dashboard/cms/articles?blogId=${blogId}`);
 },
 onError: (error: any) => {
 const message = error?.response?.data?.message || error.message ||"Unknown error";
 toast.error("Failed to create article", {
 description: Array.isArray(message) ? message.join(",") : message,
 });
 },
 },
 );
 };

 const handleBack = () => {
 const hasChanges =
 editorState.displayTitle ||
 editorState.content ||
 editorState.metaTitle ||
 editorState.slug ||
 editorState.language !=="en_us" ||
 editorState.selectedAuthorId ||
 editorState.coverImageId;
 if (hasChanges) {
 if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
 router.push(`/dashboard/cms/articles${blogId ?`?blogId=${blogId}` :""}`);
 }
 } else {
 router.push(`/dashboard/cms/articles${blogId ?`?blogId=${blogId}` :""}`);
 }
 };

 // Guards
 if (!hasSelectedTenant) {
 return (
 <ArticleEditorGuard
 icon={<AlertCircle className="w-8 h-8 text-warning" />}
 iconColor="warning"
 title="No Tenant Selected"
 description="Please select a tenant from the sidebar to create articles."
 />
 );
 }

 if (!blogId) {
 return (
 <ArticleEditorGuard
 icon={<FileText className="w-8 h-8 text-destructive" />}
 iconColor="destructive"
 title="Blog Not Selected"
 description="Please select a blog before creating an article."
 backHref="/dashboard/cms/articles"
 />
 );
 }

 if (!isLoadingAuthors && (!authors || authors.length === 0)) {
 return (
 <ArticleEditorGuard
 icon={<User className="w-8 h-8 text-warning" />}
 iconColor="warning"
 title="No Authors Available"
 description="You need to create at least one author before creating articles."
 backHref="/dashboard/cms/articles"
 />
 );
 }

 const actions = (
 <>
 <Button
 variant="bordered"
 size="sm"
 onPress={handleBack}
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
 !editorState.displayTitle.trim() ||
 !editorState.slug.trim() ||
 !editorState.selectedAuthorId
 }
 isLoading={isPending}
 startContent={!isPending ? <Save className="h-4 w-4" /> : undefined}
 >
 {isPending ?"Creating..." :"Create Article"}
 </Button>
 </>
 );

 return (
 <LayoutScopeEditor routeActive="articles">
 <ArticleEditorShell
 pageTitle="New Article"
 pageSubtitle={<span>Writing a new draft article</span>}
 actions={actions}
 onBack={handleBack}
 isBackDisabled={isPending}
 highlightedSection={editorState.highlightedSection}
 onContentChange={(stats) => {
 editorState.setContentStats(stats);
 editorState.setContent(stats.content ||"");
 }}
 focusKeyword={editorState.focusKeyword}
 blogId={blogId}
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
 language={editorState.language}
 onLanguageChange={editorState.setLanguage}
 selectedAuthorId={editorState.selectedAuthorId}
 onAuthorChange={editorState.setSelectedAuthorId}
 coverImageId={editorState.coverImageId}
 onCoverImageChange={editorState.setCoverImageId}
 authors={authors ?? []}
 isLoadingAuthors={isLoadingAuthors}
 isDisabled={isPending}
 />
 </LayoutScopeEditor>
 );
}
