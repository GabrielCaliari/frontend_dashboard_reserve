"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
  Button,
  Spinner,
  Chip,
  Pagination,
  Card,
} from "@heroui/react";
import {
  Edit,
  Trash2,
  User as UserIcon,
  Plus,
  Users,
  Search,
} from "lucide-react";
import type { Author } from "@/src/common/@types/@cms-author";
import { CmsPageHeader, CmsTabItem } from "../shared/cms-page-header";

const PAGE_SIZE = 15;

interface AuthorListProps {
  authors: Author[];
  isLoading?: boolean;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
  onCreateClick: () => void;
}

export function AuthorList({
  authors,
  isLoading,
  onEdit,
  onDelete,
  onCreateClick,
}: AuthorListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const getDisplayName = (author: Author) => {
    const fullName = author.fullName?.trim();
    if (fullName) return fullName;
    return (
      [author.firstName, author.lastName].filter(Boolean).join(" ").trim() ||
      "Unnamed author"
    );
  };

  const getAvatarUrl = (author: Author) => {
    return author.avatar_url ?? author.avatar?.url ?? undefined;
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter((author) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && author.active !== false) ||
        (statusFilter === "inactive" && author.active === false);

      if (!matchesStatus) return false;

      if (!search) return true;

      const name = getDisplayName(author).toLowerCase();
      return name.includes(search.toLowerCase());
    });
  }, [authors, search, statusFilter]);

  const summary = useMemo(() => {
    const active = authors.filter((a) => a.active !== false).length;
    const inactive = authors.length - active;
    return {
      all: authors.length,
      active,
      inactive,
    };
  }, [authors]);

  const tabs: CmsTabItem[] = [
    { id: "all", label: "All", count: summary.all },
    { id: "active", label: "Active", count: summary.active, color: "success" },
    {
      id: "inactive",
      label: "Inactive",
      count: summary.inactive,
      color: "warning",
    },
  ];

  const totalPages = Math.ceil(filteredAuthors.length / PAGE_SIZE);
  const pagedAuthors = useMemo(
    () => filteredAuthors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredAuthors, page],
  );

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleTabChange = (key: string) => {
    setStatusFilter(key as any);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Blog Authors"
        description="Manage your content creators, authors, and contributors."
        icon={<Users className="w-6 h-6" />}
        actionLabel="Create Author"
        actionIcon={<Plus size={18} />}
        onActionClick={onCreateClick}
        searchValue={search}
        onSearchChange={handleSearch}
        searchPlaceholder="Search authors by name..."
        tabs={tabs}
        activeTab={statusFilter}
        onTabChange={handleTabChange}
      />

      <Card className="shadow-sm border-none overflow-hidden">
        <Table
          aria-label="Authors table"
          removeWrapper
          classNames={{
            th: "bg-default-50 text-xs font-semibold uppercase tracking-wider py-4",
            tr: "cursor-pointer hover:bg-default-50 transition-colors",
            td: "py-4",
          }}
        >
          <TableHeader>
            <TableColumn>AUTHOR</TableColumn>
            <TableColumn className="hidden sm:table-cell">
              BIOGRAPHY
            </TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn className="hidden md:table-cell">CREATED</TableColumn>
            <TableColumn align="end">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            items={pagedAuthors}
            isLoading={isLoading}
            loadingContent={<Spinner />}
            emptyContent={
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  {search || statusFilter !== "all" ? (
                    <Search className="w-7 h-7 text-muted-foreground opacity-50" />
                  ) : (
                    <UserIcon className="w-7 h-7 text-primary" />
                  )}
                </div>
                <p className="font-medium text-foreground mb-1">
                  {search || statusFilter !== "all"
                    ? "No authors match your filters"
                    : "No Authors Yet"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search term or status filter."
                    : "Create your first author to start publishing articles."}
                </p>
                {!search && statusFilter === "all" && (
                  <Button
                    color="primary"
                    size="sm"
                    onPress={onCreateClick}
                    startContent={<Plus size={16} />}
                  >
                    Create Your First Author
                  </Button>
                )}
              </div>
            }
          >
            {(author) => (
              <TableRow key={author.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={getAvatarUrl(author)}
                      name={getDisplayName(author)}
                      size="sm"
                      fallback={
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      }
                    />
                    <span className="font-medium text-foreground">
                      {getDisplayName(author)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <p className="text-sm text-muted-foreground max-w-xs truncate">
                    {author.biography || (
                      <span className="text-muted-foreground italic">
                        No biography
                      </span>
                    )}
                  </p>
                </TableCell>
                <TableCell>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={author.active !== false ? "success" : "default"}
                  >
                    {author.active !== false ? "Active" : "Inactive"}
                  </Chip>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {author.created_at
                      ? new Date(author.created_at).toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <div
                    className="flex gap-2 justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => onEdit(author)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(author)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            total={totalPages}
            page={page}
            onChange={setPage}
            showControls
            color="primary"
            variant="flat"
          />
        </div>
      )}
    </div>
  );
}
