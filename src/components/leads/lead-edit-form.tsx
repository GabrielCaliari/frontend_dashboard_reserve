"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Textarea, Select, SelectItem } from "@nextui-org/react";
import { useUpdateLead } from "@/src/common/hooks/leads/use-update-lead";
import type { Lead, UpdateLeadDto, EOriginLead } from "@/src/common/@types/@lead";

const ORIGIN_OPTIONS = [
  { value: "1", label: "SEO Tool" },
  { value: "2", label: "SEO Archive" },
  { value: "3", label: "Email" },
  { value: "4", label: "Facebook Ads" },
  { value: "5", label: "Google Ads" },
  { value: "6", label: "Landing Page" },
];

interface LeadEditFormProps {
  lead: Lead;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LeadEditForm({ lead, onSuccess, onCancel }: LeadEditFormProps) {
  const updateLead = useUpdateLead();

  const { register, handleSubmit, watch, reset, setValue, formState: { isDirty } } = useForm<UpdateLeadDto>({
    defaultValues: {
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone_number: lead.phone_number ?? "",
      origin_font: lead.origin_font ?? "",
      description: lead.description ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone_number: lead.phone_number ?? "",
      origin_font: lead.origin_font ?? "",
      description: lead.description ?? "",
    });
  }, [lead.id]);

  const onSubmit = (values: UpdateLeadDto) => {
    // Only send non-empty fields
    const payload: UpdateLeadDto = {};
    if (values.name !== undefined && values.name !== "") payload.name = values.name;
    if (values.email !== undefined && values.email !== "") payload.email = values.email;
    if (values.phone_number !== undefined && values.phone_number !== "") payload.phone_number = values.phone_number;
    if (values.origin_font !== undefined && values.origin_font !== "") payload.origin_font = values.origin_font;
    if (values.description !== undefined && values.description !== "") payload.description = values.description;

    updateLead.mutate(
      { id: lead.id, data: payload },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        size="sm"
        variant="bordered"
        {...register("name")}
        classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
      />
      <Input
        label="Email"
        size="sm"
        variant="bordered"
        type="email"
        {...register("email")}
        classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
      />
      <Input
        label="Phone"
        size="sm"
        variant="bordered"
        {...register("phone_number")}
        classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
      />
      <Input
        label="Source (origin_font)"
        size="sm"
        variant="bordered"
        {...register("origin_font")}
        classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
      />
      <Textarea
        label="Description"
        size="sm"
        variant="bordered"
        rows={3}
        {...register("description")}
        classNames={{ inputWrapper: "border-gray-700 bg-gray-900" }}
      />

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button size="sm" variant="flat" onPress={onCancel} type="button">
            Cancel
          </Button>
        )}
        <Button
          size="sm"
          color="primary"
          type="submit"
          isDisabled={!isDirty}
          isLoading={updateLead.isPending}
        >
          {isDirty ? "Save Changes" : "No Changes"}
        </Button>
      </div>
    </form>
  );
}
