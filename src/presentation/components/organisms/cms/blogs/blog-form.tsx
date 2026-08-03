'use client';

import { Controller, useForm } from'react-hook-form';
import { zodResolver } from'@hookform/resolvers/zod';
import { Button, Input, Select, SelectItem, Switch, Textarea } from"@heroui/react";
import type { Blog, CreateBlogDto, UpdateBlogDto } from'@/src/shared/domain/types/@cms-blog';
import { createBlogSchema, updateBlogSchema } from'@/src/shared/schemas/cms-blog-schema';
import { useCollections } from'@/src/shared/hooks/cms/use-collections';

interface BlogFormProps {
 blog?: Blog;
 onSubmit: (data: CreateBlogDto | UpdateBlogDto) => void;
 onCancel: () => void;
 isSubmitting: boolean;
}

export default function BlogForm({
 blog,
 onSubmit,
 onCancel,
 isSubmitting,
}: BlogFormProps) {
 const isEditMode = !!blog;
 const schema = isEditMode ? updateBlogSchema : createBlogSchema;
 const { data: collectionsData } = useCollections({ page: 1, limit: 100 });
 const collections = collectionsData?.data ?? [];

 const normalizePayload = (values: CreateBlogDto | UpdateBlogDto): CreateBlogDto | UpdateBlogDto => {
 const nextName = typeof values.name ==='string' ? values.name.trim() : values.name;
 const nextDescription = typeof values.description ==='string'
 ? values.description.trim()
 : values.description;
 const nextMediaCollectionId = typeof values.mediaCollectionId ==='string'
 ? values.mediaCollectionId.trim()
 : values.mediaCollectionId;

 if (!isEditMode) {
 return {
 name: nextName ??'',
 description: nextDescription || undefined,
 mediaCollectionId: nextMediaCollectionId ??'',
 };
 }

 const payload: UpdateBlogDto = {};

 if (nextName !== undefined && nextName !== blog?.name) {
 payload.name = nextName;
 }

 const currentDescription = blog?.description ??'';
 const normalizedDescription = nextDescription ??'';
 if (normalizedDescription !== currentDescription) {
 payload.description = normalizedDescription || undefined;
 }

 if (
 nextMediaCollectionId !== undefined &&
 nextMediaCollectionId !== (blog?.mediaCollectionId ??'')
 ) {
 payload.mediaCollectionId = nextMediaCollectionId;
 }

 if (values.active !== undefined && values.active !== blog?.active) {
 payload.active = values.active;
 }

 return payload;
 };

 const {
 control,
 register,
 handleSubmit,
 formState: { errors },
 watch,
 } = useForm<CreateBlogDto | UpdateBlogDto>({
 resolver: zodResolver(schema),
 defaultValues: {
 name: blog?.name ||'',
 description: blog?.description ||'',
 mediaCollectionId: blog?.mediaCollectionId ||'',
 active: blog?.active ?? true,
 },
 });

 const nameValue = watch('name');
 const descriptionValue = watch('description');

 return (
 <form onSubmit={handleSubmit((values) => onSubmit(normalizePayload(values)))} className="space-y-6">
 <Input
 label="Blog Name"
 placeholder="Enter blog name"
 isRequired={!isEditMode}
 isInvalid={!!errors.name}
 errorMessage={errors.name?.message}
 {...register('name')}
 description={`${nameValue?.length || 0}/150 characters`}
 maxLength={150}
 />

 <Textarea
 label="Description"
 placeholder="Enter blog description (optional)"
 isInvalid={!!errors.description}
 errorMessage={errors.description?.message}
 {...register('description')}
 description={`${descriptionValue?.length || 0}/500 characters`}
 maxLength={500}
 minRows={3}
 />

 <Controller
 name="mediaCollectionId"
 control={control}
 render={({ field }) => (
 <Select
 label="Media Collection"
 placeholder="Select the media collection for this blog"
 isRequired={!isEditMode}
 isInvalid={!!errors.mediaCollectionId}
 errorMessage={errors.mediaCollectionId?.message}
 selectedKeys={field.value ? [field.value] : []}
 onChange={(e) => field.onChange(e.target.value)}
 >
 {collections.map((collection) => (
 <SelectItem key={collection.id}>
 {collection.name}
 </SelectItem>
 ))}
 </Select>
 )}
 />

 {isEditMode && (
 <Controller
 name="active"
 control={control}
 render={({ field }) => (
 <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
 <div>
 <div className="text-sm font-medium">Blog status</div>
 <div className="text-xs text-muted-foreground">
 Inactive blogs stop being accepted by the public secret API.
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-xs text-muted-foreground">
 {field.value ?'Active' :'Inactive'}
 </span>
 <Switch
 size="sm"
 isSelected={!!field.value}
 onValueChange={field.onChange}
 />
 </div>
 </div>
 )}
 />
 )}

 <div className="flex justify-end gap-3">
 <Button
 variant="flat"
 onPress={onCancel}
 isDisabled={isSubmitting}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 color="primary"
 isLoading={isSubmitting}
 >
 {isEditMode ?'Update Blog' :'Create Blog'}
 </Button>
 </div>
 </form>
 );
}
