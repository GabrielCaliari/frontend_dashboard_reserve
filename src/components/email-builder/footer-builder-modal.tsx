"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import FooterBuilder, { type FooterConfig } from "./footer-builder"

interface FooterBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  config: FooterConfig
  onSave: (config: FooterConfig) => void
}

export default function FooterBuilderModal({ isOpen, onClose, config, onSave }: FooterBuilderModalProps) {
  const [localConfig, setLocalConfig] = useState<FooterConfig>({ ...config })

  const handleSave = () => {
    onSave(localConfig)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Construtor de Rodapé</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <FooterBuilder config={localConfig} onChange={setLocalConfig} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
