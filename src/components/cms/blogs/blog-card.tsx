'use client';

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@nextui-org/react';
import { MoreVertical, Edit, Trash2, Key, FileText } from 'lucide-react';
import type { Blog } from '@/src/common/@types/@cms-blog';
import BlogSecretKeyDisplay from './blog-secret-key-display';

interface BlogCardProps {
  blog: Blog;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerateKey: () => void;
  onViewArticles: () => void;
}

export default function BlogCard({
  blog,
  onEdit,
  onDelete,
  onRegenerateKey,
  onViewArticles,
}: BlogCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{blog.name}</h3>
          <p className="text-sm text-default-500 mt-1">/{blog.slug}</p>
        </div>
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light">
              <MoreVertical size={18} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Blog actions">
            <DropdownItem
              key="edit"
              startContent={<Edit size={16} />}
              onPress={onEdit}
            >
              Edit Blog
            </DropdownItem>
            <DropdownItem
              key="articles"
              startContent={<FileText size={16} />}
              onPress={onViewArticles}
            >
              View Articles
            </DropdownItem>
            <DropdownItem
              key="regenerate"
              startContent={<Key size={16} />}
              onPress={onRegenerateKey}
              className="text-warning"
              color="warning"
            >
              Regenerate Key
            </DropdownItem>
            <DropdownItem
              key="delete"
              startContent={<Trash2 size={16} />}
              onPress={onDelete}
              className="text-danger"
              color="danger"
            >
              Delete Blog
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>

      <CardBody className="space-y-4">
        {blog.description && (
          <p className="text-sm text-default-600">{blog.description}</p>
        )}

        <BlogSecretKeyDisplay secretKey={blog.secret_key} />
      </CardBody>

      <CardFooter className="flex justify-between items-center border-t border-border pt-4">
        <div className="text-xs text-default-400">
          Created {new Date(blog.created_at).toLocaleDateString()}
        </div>
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onPress={onViewArticles}
        >
          Manage Articles
        </Button>
      </CardFooter>
    </Card>
  );
}
