"use client";

import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import { Select, SelectItem, Spinner } from "@nextui-org/react";
import { Globe } from "lucide-react";

interface BlogSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BlogSelector({ value, onValueChange, placeholder = "Select a blog" }: BlogSelectorProps) {
  const { data: blogsData, isLoading } = useListBlogs(1, 50);

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
      {blogsData?.data?.map((blog) => (
        <SelectItem key={blog.id.toString()} value={blog.id.toString()}>
          {blog.name}
        </SelectItem>
      )) || []}
    </Select>
  );
}
