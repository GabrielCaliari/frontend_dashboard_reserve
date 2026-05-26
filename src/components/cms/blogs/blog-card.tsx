'use client';

import {
 Card,
 CardHeader,
 CardBody,
 CardFooter,
 Button,
 Chip,
 Dropdown,
 DropdownTrigger,
 DropdownMenu,
 DropdownItem,
} from"@heroui/react";
import {
 MoreVertical,
 Edit,
 Trash2,
 Key,
 FileText,
 FolderOpen,
 CalendarDays,
 ShieldCheck,
} from'lucide-react';
import type { Blog } from'@/src/common/@types/@cms-blog';
import BlogSecretKeyDisplay from'./blog-secret-key-display';

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
 const createdAt = new Date(blog.created_at).toLocaleDateString();
 const updatedAt = new Date(blog.updated_at).toLocaleDateString();

 return (
 <Card className="flex h-full w-full flex-col overflow-visible border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(77,171,247,0.14),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] -[0_20px_50px_rgba(0,0,0,0.18)]">
 <CardHeader className="relative flex items-start justify-between gap-4 border-b border-white/10 bg-black/10 px-5 pb-5 pt-5">
 <div className="min-w-0 flex-1 space-y-4">
 <div className="flex flex-wrap items-center gap-2">
 <Chip size="sm" variant="flat" color={blog.active ?"success" :"default"}>
 {blog.active ?'Active' :'Inactive'}
 </Chip>
 <Chip
 size="sm"
 variant="bordered"
 color={blog.mediaCollectionId ?'primary' :'warning'}
 startContent={<FolderOpen size={12} />}
 >
 {blog.mediaCollectionId ?'Collection linked' :'No collection'}
 </Chip>
 </div>

 <div className="space-y-2">
 <h3 className="line-clamp-2 text-xl font-semibold tracking-tight text-foreground">
 {blog.name}
 </h3>
 <div className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-muted-foreground">
 <span className="truncate">Blog ID #{blog.id}</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:max-w-[18rem]">
 <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
 <div className="mb-1 flex items-center gap-2 text-muted-foreground">
 <CalendarDays size={13} />
 Created
 </div>
 <div className="font-medium text-foreground">{createdAt}</div>
 </div>
 <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
 <div className="mb-1 flex items-center gap-2 text-muted-foreground">
 <ShieldCheck size={13} />
 Updated
 </div>
 <div className="font-medium text-foreground">{updatedAt}</div>
 </div>
 </div>
 </div>
 <Dropdown placement="bottom-end" shouldBlockScroll={false}>
 <DropdownTrigger>
 <Button isIconOnly size="sm" variant="light" className="border border-white/10 bg-black/10">
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

 <CardBody className="flex flex-1 flex-col gap-5 px-5 py-5">
 <div className="min-h-[72px] rounded-2xl border border-white/10 bg-black/10 p-4">
 <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
 Description
 </div>
 {blog.description ? (
 <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
 {blog.description}
 </p>
 ) : (
 <p className="text-sm italic text-muted-foreground">
 No description yet. Add one to make this blog easier to identify across the CMS.
 </p>
 )}
 </div>

 <BlogSecretKeyDisplay secretKey={blog.secret_key} />
 </CardBody>

 <CardFooter className="grid gap-2 border-t border-white/10 bg-black/10 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
 <Button
 size="sm"
 variant="flat"
 color="primary"
 onPress={onViewArticles}
 className="w-full sm:w-auto"
 >
 Manage Articles
 </Button>
 <Button
 size="sm"
 variant="light"
 onPress={onEdit}
 startContent={<Edit size={16} />}
 className="w-full border border-white/10 bg-white/5 sm:w-auto"
 >
 Quick Edit
 </Button>
 </CardFooter>
 </Card>
 );
}
