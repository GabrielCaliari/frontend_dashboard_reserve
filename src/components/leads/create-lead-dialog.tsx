"use client";

import { useForm, Controller } from "react-hook-form";
import { Button, Input, Textarea, Select, SelectItem } from "@heroui/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import { useCreateLead } from "@/src/common/hooks/leads/use-create-lead";
import type { CreateLeadDto } from "@/src/shared/domain/types/@lead";
import { EOriginLead } from "@/src/shared/domain/types/@lead";

const ORIGIN_OPTIONS = [
  { value: String(EOriginLead.seo_tool), label: "SEO Tool" },
  { value: String(EOriginLead.seo_archive), label: "SEO Archive" },
  { value: String(EOriginLead.email), label: "Email" },
  { value: String(EOriginLead.facebook_ads), label: "Facebook Ads" },
  { value: String(EOriginLead.google_ads), label: "Google Ads" },
  { value: String(EOriginLead.page), label: "Landing Page" },
];

interface CreateLeadDialogProps {
  open: boolean;
  onClose: () => void;
  collectionId?: string;
}

type FormValues = {
  name: string;
  email: string;
  phone_number: string;
  origin: string;
  origin_font: string;
  description: string;
};

export function CreateLeadDialog({
  open,
  onClose,
  collectionId,
}: CreateLeadDialogProps) {
  const createLead = useCreateLead();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      phone_number: "",
      origin: "",
      origin_font: "",
      description: "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (values: FormValues) => {
    const payload: CreateLeadDto = {};
    if (values.name) payload.name = values.name;
    if (values.email) payload.email = values.email;
    if (values.phone_number) payload.phone_number = values.phone_number;
    if (values.origin) payload.origin = Number(values.origin) as EOriginLead;
    if (values.origin_font) payload.origin_font = values.origin_font;
    if (values.description) payload.description = values.description;
    if (collectionId) payload.collection_id = collectionId;

    createLead.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Name"
              size="sm"
              variant="bordered"
              classNames={{ inputWrapper: "border-border bg-default-100" }}
              {...register("name")}
            />
            <Input
              label="Email"
              size="sm"
              variant="bordered"
              type="email"
              classNames={{ inputWrapper: "border-border bg-default-100" }}
              {...register("email")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone"
              size="sm"
              variant="bordered"
              classNames={{ inputWrapper: "border-border bg-default-100" }}
              {...register("phone_number")}
            />
            <Input
              label="Source (origin_font)"
              size="sm"
              variant="bordered"
              classNames={{ inputWrapper: "border-border bg-default-100" }}
              {...register("origin_font")}
            />
          </div>

          <Controller
            name="origin"
            control={control}
            render={({ field }) => (
              <Select
                label="Origin"
                size="sm"
                variant="bordered"
                selectedKeys={field.value ? [field.value] : []}
                onChange={(e) => field.onChange(e.target.value)}
                classNames={{ trigger: "border-border bg-default-100" }}
                aria-label="Lead origin"
              >
                {ORIGIN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            )}
          />

          <Textarea
            label="Description"
            size="sm"
            variant="bordered"
            rows={3}
            classNames={{ inputWrapper: "border-border bg-default-100" }}
            {...register("description")}
          />

          <div className="flex gap-2 justify-end pt-1">
            <Button
              size="sm"
              variant="flat"
              type="button"
              onPress={handleClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              color="primary"
              type="submit"
              isLoading={createLead.isPending}
            >
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
