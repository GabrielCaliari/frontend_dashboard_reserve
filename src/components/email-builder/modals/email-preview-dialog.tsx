"use client"

import type { EmailContent } from "@/lib/data"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { useTranslations } from "next-intl"

interface EmailPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  emailContent: EmailContent
  batchNumber: number
}

export function EmailPreviewDialog({ isOpen, onClose, emailContent, batchNumber }: EmailPreviewDialogProps) {
  const [activeTab, setActiveTab] = useState("html")
  const t = useTranslations("emailPreview")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("title")}{batchNumber}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="flex-1 overflow-y-auto border rounded-md p-4 mt-2">
            <div className="text-sm mb-2 text-gray-500">
              <strong>{t("subject")}</strong> {emailContent.subject}
            </div>
            <div className="email-preview" dangerouslySetInnerHTML={{ __html: emailContent.htmlContent }} />
          </TabsContent>
          <TabsContent value="markdown" className="flex-1 overflow-y-auto border rounded-md p-4 mt-2">
            <div className="text-sm mb-2 text-gray-500">
              <strong>{t("subject")}</strong> {emailContent.subject}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm">{emailContent.mdContent}</pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
