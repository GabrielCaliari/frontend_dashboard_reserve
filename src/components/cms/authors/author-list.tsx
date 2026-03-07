"use client";

import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Avatar,
  Chip,
} from "@nextui-org/react";
import { Edit, Trash2, User as UserIcon } from "lucide-react";
import type { Author } from "@/src/common/@types/@cms-author";

interface AuthorListProps {
  authors: Author[];
  onEdit: (author: Author) => void;
  onDelete: (author: Author) => void;
  onCreateClick: () => void;
}

export function AuthorList({
  authors,
  onEdit,
  onDelete,
  onCreateClick,
}: AuthorListProps) {
  if (authors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card className="max-w-md border-dashed border-2">
          <CardBody className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Authors Yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first author to start publishing articles.
            </p>
            <Button
              color="primary"
              onPress={onCreateClick}
            >
              Create Your First Author
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {authors.map((author) => (
        <Card key={author.id} className="border border-border">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <Avatar
                name={`${author.firstName} ${author.lastName}`}
                size="lg"
                className="flex-shrink-0"
                fallback={
                  <UserIcon className="w-6 h-6 text-default-400" />
                }
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {author.firstName} {author.lastName}
                </h3>
                {author.biography && (
                  <p className="text-sm text-default-600 mt-2 line-clamp-2">
                    {author.biography}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
          <CardFooter className="flex justify-between items-center border-t border-border pt-4">
            <div className="text-xs text-default-400">
              {author.created_at
                ? `Created ${new Date(author.created_at).toLocaleDateString()}`
                : ""}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="flat"
                color="primary"
                isIconOnly
                onPress={() => onEdit(author)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                isIconOnly
                onPress={() => onDelete(author)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
