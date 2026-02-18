'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Textarea } from '@nextui-org/react';
import type { Blog, CreateBlogDto, UpdateBlogDto } from '@/src/common/@types/@cms-blog';
import { createBlogSchema, updateBlogSchema } from '@/src/common/schemas/cms-blog-schema';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateBlogDto | UpdateBlogDto>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: blog?.name || '',
      description: blog?.description || '',
    },
  });

  const nameValue = watch('name');
  const descriptionValue = watch('description');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          {isEditMode ? 'Update Blog' : 'Create Blog'}
        </Button>
      </div>
    </form>
  );
}
