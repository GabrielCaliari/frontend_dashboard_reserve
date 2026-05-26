"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { IEmail } from "@/src/common/@types/@email"

export interface EmailMetadata {
  subject: string
  preheader: string
  fromName: string
}

interface EmailSaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: EmailMetadata) => void
  email: string
  primaryCopy: IEmail
}

const createEmailSaveSchema = (t: (key: string, values?: Record<string, unknown>) => string) => z.object({
  subject: z.string().min(1, t("validation.subjectRequired")),
  preheader: z.string().max(100, t("validation.preHeaderMaxLength", { max: 100 })),
  fromName: z.string().min(1, t("validation.senderRequired")),
})

type EmailSaveFormData = z.infer<ReturnType<typeof createEmailSaveSchema>>

export default function EmailSaveModal({ primaryCopy, isOpen, onClose, onSave, email }: EmailSaveModalProps) {
  const t = useTranslations()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<EmailSaveFormData>({
    resolver: zodResolver(createEmailSaveSchema(t)),
    defaultValues: {
      subject: primaryCopy ? primaryCopy.subject : '',
      preheader: primaryCopy ? primaryCopy.pre_header : '',
      fromName: primaryCopy ? primaryCopy.from_name : '',
    }
  })

  const preheader = watch("preheader")
  const MAX_PREHEADER_LENGTH = 100

  const onSubmit = (data: EmailSaveFormData) => {
    onSave({
      subject: data.subject.trim(),
      preheader: data.preheader.trim(),
      fromName: data.fromName.trim(),
    })
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("emailBuilder.saveEmailTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-right">
              {t("emailBuilder.emailSubject")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder={t("emailBuilder.subjectPlaceholder")}
              className="col-span-3"
            />
            {errors.subject && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{errors.subject.message}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="preheader" className="text-right">
                {t("emailBuilder.preHeader")}
              </Label>
              <span className={`text-xs ${preheader.length > MAX_PREHEADER_LENGTH ? "text-red-500" : "text-muted-foreground"}`}>
                {preheader.length}/{MAX_PREHEADER_LENGTH}
              </span>
            </div>
            <Input
              id="preheader"
              {...register("preheader")}
              placeholder={t("emailBuilder.preHeaderPlaceholder")}
              className="col-span-3"
              maxLength={MAX_PREHEADER_LENGTH}
            />
            {errors.preheader && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{errors.preheader.message}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {t("emailBuilder.preHeaderHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName" className="text-right">
              {t("emailBuilder.senderLabel")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fromName"
              {...register("fromName")}
              placeholder={t("emailBuilder.senderPlaceholder")}
              className="col-span-3"
            />
            {errors.fromName && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{errors.fromName.message}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="fromEmail">
              {t("emailBuilder.senderEmail")} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fromEmail"
              className="col-span-3"
              disabled
              value={email}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { onClose(); reset(); }}>
              {t("common.cancel")}
            </Button>
            <Button type="submit">
              {t("emailBuilder.continue")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
