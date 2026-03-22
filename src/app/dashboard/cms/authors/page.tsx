"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import {
  Button,
  Card,
  CardBody,
  Input,
} from "@heroui/react";
import { Plus, AlertCircle, Search } from "lucide-react";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import { AuthorList } from "@/src/components/cms/authors/author-list";
import { AuthorDrawer } from "@/src/components/cms/authors/author-drawer";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import { useCreateAuthor } from "@/src/common/hooks/cms/use-create-author";
import { useUpdateAuthor } from "@/src/common/hooks/cms/use-update-author";
import { useDeleteAuthor } from "@/src/common/hooks/cms/use-delete-author";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { toast } from "sonner";
import type { Author } from "@/src/common/@types/@cms-author";
import type {
  CreateAuthorDto,
  UpdateAuthorDto,
} from "@/src/common/@types/@cms-author";

export default function AuthorsPage() {
  const hasSelectedTenant = useHasSelectedTenant();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(null);

  const { data: authors, isLoading } = useGetAuthors();
  const createAuthorMutation = useCreateAuthor();
  const updateAuthorMutation = useUpdateAuthor();
  const deleteAuthorMutation = useDeleteAuthor();

  const filteredAuthors = (authors || []).filter((author) =>
    search
      ? `${author.fullName || `${author.firstName} ${author.lastName}`}`
          .toLowerCase()
          .includes(search.toLowerCase())
      : true,
  );

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
          description: Array.isArray(message) ? message.join(", ") : message,
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
          description: Array.isArray(message) ? message.join(", ") : message,
        },
      );
    }
  };

  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="authors">
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
                  Please select a tenant from the sidebar to manage authors.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="authors">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Authors</h1>
            <p className="text-default-500 mt-1">
              Manage content authors and contributors
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleCreate}
          >
            Create Author
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardBody>
            <Input
              placeholder="Search authors..."
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="w-4 h-4 text-default-400" />}
              isClearable
              onClear={() => setSearch("")}
            />
          </CardBody>
        </Card>

        {/* Authors Table */}
        <Card>
          <CardBody className="p-0">
            <AuthorList
              authors={filteredAuthors}
              isLoading={isLoading}
              search={search}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateClick={handleCreate}
            />
          </CardBody>
        </Card>
      </div>

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

      {/* Author Drawer */}
      <AuthorDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        author={selectedAuthor}
        onSubmit={handleSubmit}
        isSubmitting={
          createAuthorMutation.isPending || updateAuthorMutation.isPending
        }
      />
    </LayoutScopeRoot>
  );
}
