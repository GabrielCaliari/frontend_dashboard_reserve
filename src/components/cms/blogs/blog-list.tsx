'use client';

import { Button, Spinner } from '@nextui-org/react';
import { Plus } from 'lucide-react';
import type { Blog } from '@/src/common/@types/@cms-blog';
import BlogCard from './blog-card';

interface BlogListProps {
  blogs: Blog[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (blog: Blog) => void;
  onDeleteClick: (blog: Blog) => void;
  onRegenerateKeyClick: (blog: Blog) => void;
}

export default function BlogList({
  blogs,
  isLoading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onRegenerateKeyClick,
}: BlogListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" label="Loading blogs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Blogs</h1>
          <p className="text-default-500 mt-1">
            Manage your content blogs and articles
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus size={20} />}
          onPress={onCreateClick}
        >
          Create Blog
        </Button>
      </div>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-default-300 rounded-lg">
          <p className="text-default-500 text-lg mb-4">No blogs yet</p>
          <Button
            color="primary"
            startContent={<Plus size={20} />}
            onPress={onCreateClick}
          >
            Create Your First Blog
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onEdit={() => onEditClick(blog)}
              onDelete={() => onDeleteClick(blog)}
              onRegenerateKey={() => onRegenerateKeyClick(blog)}
              onViewArticles={() => {
                window.location.href = `/dashboard/cms/blogs/${blog.id}/articles`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
