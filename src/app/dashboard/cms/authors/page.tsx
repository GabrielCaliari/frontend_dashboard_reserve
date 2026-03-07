"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Spinner,
} from "@nextui-org/react";
import { Plus, Users, AlertCircle } from "lucide-react";
import { AuthorList } from "@/src/components/cms/authors/author-list";
import { AuthorForm } from "@/src/components/cms/authors/author-form";
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
} from "@/src/common/services/cms-author-service";

export default function AuthorsPage() {
  const hasSelectedTenant = useHasSelectedTenant();
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);

  const { data: authors, isLoading } = useGetAuthors();
  const createAuthorMutation = useCreateAuthor();
  const updateAuthorMutation = useUpdateAuthor();
  const deleteAuthorMutation = useDeleteAuthor();

  const handleCreate = () => {
    setSelectedAuthor(null);
    onOpen();
  };

  const handleEdit = (author: Author) => {
    setSelectedAuthor(author);
    onOpen();
  };

  const handleDelete = (author: Author) => {
    if (
      confirm(
        `Are you sure you want to delete "${author.firstName} ${author.lastName}"? This action cannot be undone.`
      )
    ) {
      deleteAuthorMutation.mutate(author.id, {
        onSuccess: () => {
          toast.success("Author deleted", {
            description: `${author.firstName} ${author.lastName} has been deleted successfully.`,
          });
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message || error.message || "Unknown error";
          toast.error("Failed to delete author", {
            description: Array.isArray(message) ? message.join(", ") : message,
          });
        },
      });
    }
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
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || "Unknown error";
      toast.error(
        selectedAuthor ? "Failed to update author" : "Failed to create author",
        {
          description: Array.isArray(message) ? message.join(", ") : message,
        }
      );
    }
  };

  const handleClose = () => {
    setSelectedAuthor(null);
    onClose();
  };

  // No tenant selected
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Authors</h1>
              <p className="text-default-500">
                Manage content authors and contributors
              </p>
            </div>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleCreate}
          >
            Create Author
          </Button>
        </div>

        {/* Authors List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <AuthorList
            authors={authors || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreateClick={handleCreate}
          />
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          size="2xl"
          scrollBehavior="inside"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {selectedAuthor ? "Edit Author" : "Create Author"}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <AuthorForm
                    author={selectedAuthor || undefined}
                    onSubmit={handleSubmit}
                    onCancel={handleClose}
                    isSubmitting={
                      createAuthorMutation.isPending ||
                      updateAuthorMutation.isPending
                    }
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </LayoutScopeRoot>
  );
}
