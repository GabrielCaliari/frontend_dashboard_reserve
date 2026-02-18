"use client";

import { useState } from "react";
import { useListCollections } from "@/src/common/hooks/leads/use-list-collections";
import { useDeleteCollection } from "@/src/common/hooks/leads/use-delete-collection";
import {
  LeadCollection,
  CollectionAccessMode,
} from "@/src/common/@types/@lead";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@nextui-org/react";
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Key,
  Copy,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

const accessModeLabels: Record<CollectionAccessMode, string> = {
  [CollectionAccessMode.PUBLIC]: "Public",
  [CollectionAccessMode.PRIVATE]: "Private",
  [CollectionAccessMode.RESTRICTED]: "Restricted",
};

const accessModeColors: Record<
  CollectionAccessMode,
  "success" | "warning" | "danger"
> = {
  [CollectionAccessMode.PUBLIC]: "success",
  [CollectionAccessMode.PRIVATE]: "warning",
  [CollectionAccessMode.RESTRICTED]: "danger",
};

export function CollectionsTable() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = useListCollections({ page, limit });
  const deleteCollection = useDeleteCollection();

  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success("Slug copied to clipboard");
  };

  const handleCopyEndpoint = (slug: string) => {
    const endpoint = `${window.location.origin}/api/leads/collect/${slug}`;
    navigator.clipboard.writeText(endpoint);
    toast.success("Endpoint URL copied to clipboard");
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to deactivate this collection?")) {
      deleteCollection.mutate(id);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        Error loading collections: {error.message}
      </div>
    );
  }

  const collections = data?.data?.collections || [];
  const meta = data?.data?.meta;

  return (
    <div className="space-y-4">
      <Table aria-label="Collections table">
        <TableHeader>
          <TableColumn>NAME</TableColumn>
          <TableColumn>SLUG</TableColumn>
          <TableColumn>SOURCE</TableColumn>
          <TableColumn>ACCESS MODE</TableColumn>
          <TableColumn>LEADS</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>CREATED</TableColumn>
          <TableColumn>ACTIONS</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner />}
          emptyContent="No collections found"
        >
          {collections.map((collection) => (
            <TableRow key={collection.id}>
              <TableCell className="font-medium">{collection.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {collection.slug}
                  </code>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => handleCopySlug(collection.slug)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {collection.source}
                </span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={accessModeColors[collection.access_mode]}
                  variant="flat"
                >
                  {accessModeLabels[collection.access_mode]}
                </Chip>
              </TableCell>
              <TableCell>
                <span className="font-medium">{collection.lead_count || 0}</span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={collection.active ? "success" : "default"}
                  variant="flat"
                >
                  {collection.active ? "Active" : "Inactive"}
                </Chip>
              </TableCell>
              <TableCell>
                {format(new Date(collection.created_at), "MMM dd, yyyy")}
              </TableCell>
              <TableCell>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Collection actions">
                    <DropdownItem
                      key="endpoint"
                      startContent={<ExternalLink className="w-4 h-4" />}
                      onPress={() => handleCopyEndpoint(collection.slug)}
                    >
                      Copy Endpoint URL
                    </DropdownItem>
                    <DropdownItem
                      key="view"
                      startContent={<Eye className="w-4 h-4" />}
                    >
                      View Leads
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      startContent={<Edit className="w-4 h-4" />}
                    >
                      Edit
                    </DropdownItem>
                    {collection.access_mode ===
                      CollectionAccessMode.RESTRICTED && (
                      <DropdownItem
                        key="regenerate"
                        startContent={<Key className="w-4 h-4" />}
                      >
                        Regenerate Key
                      </DropdownItem>
                    )}
                    <DropdownItem
                      key="delete"
                      startContent={<Trash2 className="w-4 h-4" />}
                      onPress={() => handleDelete(collection.id)}
                      className="text-danger"
                      color="danger"
                    >
                      Deactivate
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {meta && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {collections.length} of {meta.total} collections
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              isDisabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="flat"
              isDisabled={
                page >= Math.ceil(meta.total / meta.limit)
              }
              onPress={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
