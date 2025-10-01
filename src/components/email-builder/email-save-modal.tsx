"use client"

import { useState } from "react"
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

const emailSaveSchema = z.object({
  subject: z.string().min(1, "O assunto é obrigatório"),
  preheader: z.string().max(100, "O pré-header deve ter no máximo 100 caracteres"),
  fromName: z.string().min(1, "O remetente é obrigatório"),
})

type EmailSaveFormData = z.infer<typeof emailSaveSchema>

export default function EmailSaveModal({ primaryCopy, isOpen, onClose, onSave, email }: EmailSaveModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<EmailSaveFormData>({
    resolver: zodResolver(emailSaveSchema),
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
          <DialogTitle>Salvar Email</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-right">
              Assunto do Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="Digite o assunto do email"
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
                Pré-header
              </Label>
              <span className={`text-xs ${preheader.length > MAX_PREHEADER_LENGTH ? "text-red-500" : "text-gray-500"}`}>
                {preheader.length}/{MAX_PREHEADER_LENGTH}
              </span>
            </div>
            <Input
              id="preheader"
              {...register("preheader")}
              placeholder="Breve descrição que aparece após o assunto em alguns clientes de email"
              className="col-span-3"
              maxLength={MAX_PREHEADER_LENGTH}
            />
            {errors.preheader && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle size={14} />
                <span>{errors.preheader.message}</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              O pré-header é um texto curto que aparece após o assunto em muitos clientes de email. Use-o para
              complementar o assunto e incentivar a abertura do email.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromName" className="text-right">
              Remetente <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fromName"
              {...register("fromName")}
              placeholder="Nome do remetente"
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
              E-mail do Remetente <span className="text-red-500">*</span>
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
              Cancelar
            </Button>
            <Button type="submit">
              Continuar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
