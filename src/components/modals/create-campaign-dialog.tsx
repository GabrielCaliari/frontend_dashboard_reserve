"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/src/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreateCampaignFormData, createCampaignSchema } from "@/src/common/schemas/create-campaign-dialog"
import { createEmailCampaign } from "@/src/common/actions/email-campaign/create-email-campaign"
import toast from "react-hot-toast"

interface CreateCampaignDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCampaignDialog({ isOpen, onClose }: CreateCampaignDialogProps) {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateCampaignFormData>({
    resolver: zodResolver(createCampaignSchema)
  })

  const onSubmit = async (data: CreateCampaignFormData) => {
    setIsSubmitting(true)

    try {
      const response = await createEmailCampaign(data.name)

      if (response?.id) {
        toast.success('Campanha criada com sucesso.')
        router.refresh()
        onClose()
        reset()
        return;
      }

      if (response?.error) {
        toast.error(response.message)
      } else {
        toast.error('Não foi possível criar a campanha.')
      }

      onClose()
      reset()
    } catch (err) {
      console.error("Erro ao criar campanha:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Campanha</Label>
            <Input
              id="name"
              placeholder="Digite o nome da campanha"
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
                onClose()
                reset()
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Campanha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
