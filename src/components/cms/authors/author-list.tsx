"use client";

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
} from "@heroui/react";
import { Edit, Trash2, User as UserIcon } from "lucide-react";
import type { Author } from "@/src/common/@types/@cms-author";

interface AuthorListProps {
  authors: Author[];
  isLoading?: boolean;
  search?: string;
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
  onCreateClick: () => void;
}

export function AuthorList({
  authors,
  isLoading,
  search,
  onEdit,
  onDelete,
  onCreateClick,
}: AuthorListProps) {
  const getDisplayName = (author: Author) => {
    const fullName = author.fullName?.trim();
    if (fullName) {
      return fullName;
    }

    const joinedName = [author.firstName, author.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return joinedName || "Unnamed author";
  };

  const getAvatarUrl = (author: Author) => {
    return author.avatar_url ?? author.avatar?.url ?? undefined;
  };

  return (
    <Table
      aria-label="Authors table"
      removeWrapper
      classNames={{
        th: "bg-default-100",
      }}
    >
      <TableHeader>
        <TableColumn>AUTHOR</TableColumn>
        <TableColumn>BIOGRAPHY</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>CREATED</TableColumn>
        <TableColumn align="center">ACTIONS</TableColumn>
      </TableHeader>
      <TableBody
        items={authors}
        isLoading={isLoading}
        loadingContent={<Spinner />}
        emptyContent={
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <UserIcon className="w-7 h-7 text-primary" />
            </div>
            <p className="font-medium text-foreground mb-1">
              {search ? "No authors match your search" : "No Authors Yet"}
            </p>
            <p className="text-sm text-default-400 mb-4">
              {search
                ? "Try adjusting your search term."
                : "Create your first author to start publishing articles."}
            </p>
            {!search && (
              <Button color="primary" size="sm" onPress={onCreateClick}>
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
                  fallback={<UserIcon className="w-4 h-4 text-default-400" />}
                />
                <span className="font-medium text-foreground">
                  {getDisplayName(author)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm text-default-500 max-w-xs truncate">
                {author.biography || (
                  <span className="text-default-300 italic">No biography</span>
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
            <TableCell>
              <span className="text-sm text-default-400">
                {author.created_at
                  ? new Date(author.created_at).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex gap-2 justify-center">
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
  );
}
