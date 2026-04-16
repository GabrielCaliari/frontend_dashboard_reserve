"use client";

import { CmsPageLayout } from "@/src/presentation/components/organisms/cms/shared/cms-page-layout";
import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { AlertCircle } from "lucide-react";
import { ConfirmationDialog } from "@/src/presentation/components/organisms/access-management/shared/confirmation-dialog";
import { AuthorList } from "@/src/presentation/components/organisms/cms/authors/author-list";
import { AuthorDrawer } from "@/src/presentation/components/organisms/cms/authors/author-drawer";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import { useCreateAuthor } from "@/src/common/hooks/cms/use-create-author";
import { useUpdateAuthor } from "@/src/common/hooks/cms/use-update-author";
import { useDeleteAuthor } from "@/src/common/hooks/cms/use-delete-author";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";
import { toast } from "sonner";
import type { Author } from "@/src/shared/domain/types/@cms-author";
import type {
  CreateAuthorDto,
  UpdateAuthorDto,
} from "@/src/shared/domain/types/@cms-author";

export default function AuthorsPage() {
  const hasSelectedTenant = useHasSelectedTenant();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);

  const { data: authors, isLoading } = useGetAuthors();
  const createAuthorMutation = useCreateAuthor();
  const updateAuthorMutation = useUpdateAuthor();
  const deleteAuthorMutation = useDeleteAuthor();

  const handleCreate = () => {
    setSelectedAuthor(null);
    setDrawerOpen(true);
  };

  const handleEdit = (author: Author) => {
    setSelectedAuthor(author);
    setDrawerOpen(true);
  };

  const handleDelete = (author: Author) => {
    setDeleteTarget(author);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteAuthorMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Author deleted", {
          description: `${deleteTarget.firstName} ${deleteTarget.lastName} has been deleted successfully.`,
        });
        setDeleteTarget(null);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || error.message || "Unknown error";
        toast.error("Failed to delete author", {
          description: Array.isArray(message) ? message.join(",") : message,
        });
        setDeleteTarget(null);
      },
    });
  };

  const handleSubmit = async (data: CreateAuthorDto | UpdateAuthorDto) => {
    try {
      if (selectedAuthor) {
        await updateAuthorMutation.mutateAsync({
          authorId: selectedAuthor.id,
          data: data as UpdateAuthorDto,
        });
        toast.success("Author updated", {
          description: "The author has been updated successfully.",
        });
      } else {
        await createAuthorMutation.mutateAsync(data as CreateAuthorDto);
        toast.success("Author created", {
          description: "The author has been created successfully.",
        });
      }
      setDrawerOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || "Unknown error";
      toast.error(
        selectedAuthor ? "Failed to update author" : "Failed to create author",
        {
          description: Array.isArray(message) ? message.join(",") : message,
        },
      );
    }
  };

  if (!hasSelectedTenant) {
    return (
      <CmsPageLayout routeActive="authors">
        <div className="flex flex-col items-center justify-center py-16">
          <Card className="max-w-md border-warning/20 bg-warning/5 shadow-none">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Tenant Selected
              </h3>
              <p className="text-muted-foreground">
                Please select a tenant from the sidebar to manage authors.
              </p>
            </CardBody>
          </Card>
        </div>
      </CmsPageLayout>
    );
  }

  return (
    <CmsPageLayout routeActive="authors">
      <AuthorList
        authors={authors || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreateClick={handleCreate}
      />

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Author"
        message={`Are you sure you want to delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteAuthorMutation.isPending}
      />

      <AuthorDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        author={selectedAuthor}
        onSubmit={handleSubmit}
        isSubmitting={
          createAuthorMutation.isPending || updateAuthorMutation.isPending
        }
      />
    </CmsPageLayout>
  );
}
