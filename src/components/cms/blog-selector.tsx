"use client";

import { useEffect } from "react";
import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import { Select, SelectItem, Spinner } from "@heroui/react";
import { Globe } from "lucide-react";

interface BlogSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  autoSelect?: boolean;
}

export function BlogSelector({
  value,
  onValueChange,
  placeholder = "Select a blog",
  autoSelect = true,
}: BlogSelectorProps) {
  const { data: blogsData, isLoading } = useListBlogs(1, 50);

  const blogs = blogsData?.data ?? [];

  // Auto-seleciona o primeiro blog quando os dados carregam e nenhum esta selecionado
  useEffect(() => {
    if (autoSelect && !value && blogs.length > 0) {
      onValueChange(blogs[0].id.toString());
    }
  }, [autoSelect, value, blogs, onValueChange]);

  return (
    <Select
      label="Blog"
      placeholder={placeholder}
      selectedKeys={value ? [value] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0];
        if (selected) onValueChange(selected.toString());
      }}
      startContent={<Globe className="w-4 h-4 text-default-400" />}
      isLoading={isLoading}
      classNames={{
        trigger: "bg-default-100 data-[hover=true]:bg-default-200",
        value: "text-foreground",
      }}
    >
      {blogs.map((blog) => (
        <SelectItem key={blog.id.toString()}>
          {blog.name}
        </SelectItem>
      ))}
    </Select>
  );
}
