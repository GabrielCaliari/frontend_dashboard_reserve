"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Pagination,
  Spinner,
} from "@heroui/react";
import {
  useCollections,
  useDeleteCollection,
} from "@/src/common/hooks/cms/use-collections";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import { formatFileSize } from "@/src/common/utils/format-file-size";
import type { CollectionType } from "@/src/common/@types/@cms-media";

const COLLECTION_TYPES: CollectionType[] = ["image", "document", "video", "audio", "mixed"];

const COLLECTION_TYPE_COLORS = {
  image: "success",
  document: "primary",
  video: "secondary",
  audio: "warning",
  mixed: "default",
} as const;

export default function CollectionsPage() {
  const router = useRouter();
  const hasSelectedTenant = useHasSelectedTenant();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CollectionType | "all">("all");

  const { data, isLoading } = useCollections({ page, limit: 20 });
  const deleteCollectionMutation = useDeleteCollection();

  const collections = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  const handleCreateClick = () => {
    router.push("/dashboard/cms/collections/new");
  };

  const handleEditClick = (id: number) => {
    router.push(`/dashboard/cms/collections/${id}`);
  };

  const handleDeleteClick = async (id: number, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will not delete the assets, only the collection.`
      )
    ) {
      try {
        await deleteCollectionMutation.mutateAsync(id);
      } catch (error) {
        // Error is handled by mutation
      }
    }
  };

  // Filter collections by search and type
  const filteredCollections = collections.filter((collection) => {
    const matchesSearch = search
      ? collection.name.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesType = typeFilter === "all" || collection.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="collections">
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
                  Please select a tenant from the sidebar to manage collections.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="collections">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Collections</h1>
            <p className="text-muted-foreground mt-1">
              Organize media assets with collections and validation rules
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={handleCreateClick}
          >
            Create Collection
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex gap-4">
              <Input
                placeholder="Search collections..."
                value={search}
                onValueChange={setSearch}
                startContent={<Search className="w-4 h-4 text-muted-foreground" />}
                className="flex-1"
                isClearable
                onClear={() => setSearch("")}
              />
              <Select
                placeholder="Filter by type"
                selectedKeys={[typeFilter]}
                onChange={(e) => setTypeFilter(e.target.value as CollectionType | "all")}
                className="w-48"
              >
                <SelectItem key="all" value="all">
                  All Types
                </SelectItem>
                {COLLECTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Collections Table */}
        <Card>
          <CardBody className="p-0">
            <Table
              aria-label="Collections table"
              removeWrapper
              classNames={{
                th: "bg-default-100",
              }}
            >
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>MAX FILE SIZE</TableColumn>
                <TableColumn>ALLOWED TYPES</TableColumn>
                <TableColumn>MAX ITEMS</TableColumn>
                <TableColumn align="center">ACTIONS</TableColumn>
              </TableHeader>
              <TableBody
                items={filteredCollections}
                isLoading={isLoading}
                loadingContent={<Spinner />}
                emptyContent={
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {search || typeFilter !== "all"
                        ? "No collections match your filters"
                        : "No collections yet. Create your first collection to get started."}
                    </p>
                  </div>
                }
              >
                {(collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{collection.name}</p>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground">
                            {collection.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={COLLECTION_TYPE_COLORS[collection.type]}
                        variant="flat"
                        size="sm"
                      >
                        {collection.type}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatFileSize(collection.max_file_size)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {collection.allowed_mime_types.join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {collection.max_items || "Unlimited"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 justify-center">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleEditClick(collection.id)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDeleteClick(collection.id, collection.name)}
                          isLoading={deleteCollectionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
            />
          </div>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
