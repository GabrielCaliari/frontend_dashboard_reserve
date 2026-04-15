"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateCampaignFormData,
  createCampaignSchema,
} from "@/src/shared/schemas/create-campaign-dialog";
import { createEmailCampaign } from "@/src/presentation/actions/email-campaign/create-email-campaign";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface CreateCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateCampaignDialog({
  isOpen,
  onClose,
}: CreateCampaignDialogProps) {
  const router = useRouter();
  const t = useTranslations();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema(t)),
  });

  const onSubmit = async (data: CreateCampaignFormData) => {
    setIsSubmitting(true);

    try {
      const response = await createEmailCampaign(data.name);

      if (response?.id) {
        toast.success(t("createCampaign.created"));
        router.refresh();
        onClose();
        reset();
        return;
      }

      if (response?.error) {
        toast.error(response.message);
      } else {
        toast.error(t("createCampaign.createError"));
      }

      onClose();
      reset();
    } catch (err) {
      console.error(t("createCampaign.createErrorLog"), err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("createCampaign.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("createCampaign.nameLabel")}</Label>
            <Input
              id="name"
              placeholder={t("createCampaign.namePlaceholder")}
              {...register("name")}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                reset();
              }}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t("createCampaign.creating")
                : t("createCampaign.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
