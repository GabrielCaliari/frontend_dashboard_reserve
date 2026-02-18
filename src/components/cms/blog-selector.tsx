"use client";

import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2 } from "lucide-react";

interface BlogSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function BlogSelector({ value, onValueChange, placeholder = "Select a blog" }: BlogSelectorProps) {
  const { data: blogsData, isLoading } = useListBlogs(1, 50);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-700 rounded-md bg-[#0f0f1a]">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading blogs...</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-[#0f0f1a] border-gray-700 text-gray-200">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {blogsData?.data.map((blog) => (
          <SelectItem key={blog.id} value={blog.id.toString()}>
            {blog.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
