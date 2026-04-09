"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Copy, Check, Link } from "lucide-react";
import { b2bPaymentsService } from "@/src/common/services/b2b-payments-service";
import type { B2BProduct } from "@/src/common/@types/@b2b-payments";

interface GenerateCheckoutLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: B2BProduct | null;
}

export function GenerateCheckoutLinkModal({
  isOpen,
  onClose,
  product,
}: GenerateCheckoutLinkModalProps) {
  const t = useTranslations("payments.productsPage.generateLinkModal");
  const tCommon = useTranslations("common");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [form, setForm] = useState({
    customerEmail: "",
    customerName: "",
    customerPhone: "",
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setForm({ customerEmail: "", customerName: "", customerPhone: "" });
      setError(null);
      setCheckoutUrl(null);
      setLinkCopied(false);
    }
  }, [isOpen]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.customerEmail.trim()) {
      setError(t("errorRequired"));
      return;
    }

    if (!product) return;

    setIsLoading(true);
    try {
      const result = await b2bPaymentsService.createCheckoutLink({
        productId: product.id,
        customerEmail: form.customerEmail.trim(),
        customerName: form.customerName.trim() || undefined,
        customerPhone: form.customerPhone.trim() || undefined,
      });
      setCheckoutUrl(result.checkoutUrl);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || t("errorGeneric"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = useCallback(async () => {
    if (!checkoutUrl) return;
    try {
      await navigator.clipboard.writeText(checkoutUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = checkoutUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }, [checkoutUrl]);

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      classNames={{
        base: "bg-background border border-border",
        header: "border-b border-border",
        footer: "border-t border-border",
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-primary" />
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("title")}
                </h3>
                {product && (
                  <p className="text-xs text-muted-foreground font-normal mt-0.5">
                    {product.name}
                  </p>
                )}
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="gap-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success state — show the generated link */}
            {checkoutUrl ? (
              <div className="space-y-4">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                  {t("successMessage")}
                </div>

                <div className="p-3 rounded-xl bg-default-100 border border-[#2a2a3e] space-y-2">
                  <p className="text-xs text-muted-foreground">Checkout URL</p>
                  <p className="text-xs font-mono text-foreground break-all">
                    {checkoutUrl}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    color="primary"
                    startContent={<ExternalLink className="w-4 h-4" />}
                    onPress={() => window.open(checkoutUrl, "_blank")}
                  >
                    {t("openCheckout")}
                  </Button>
                  <Button
                    variant="flat"
                    startContent={
                      linkCopied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )
                    }
                    onPress={handleCopyLink}
                  >
                    {linkCopied ? t("linkCopied") : t("copyLink")}
                  </Button>
                </div>
              </div>
            ) : (
              /* Form state */
              <>
                <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

                <Input
                  type="email"
                  label={t("emailLabel")}
                  placeholder={t("emailPlaceholder")}
                  value={form.customerEmail}
                  onValueChange={(v) => set("customerEmail", v)}
                  isRequired
                  isDisabled={isLoading}
                  classNames={{
                    inputWrapper: "bg-default-100 border-[#2a2a3e]",
                  }}
                />

                <Input
                  label={t("nameLabel")}
                  placeholder={t("namePlaceholder")}
                  value={form.customerName}
                  onValueChange={(v) => set("customerName", v)}
                  isDisabled={isLoading}
                  classNames={{
                    inputWrapper: "bg-default-100 border-[#2a2a3e]",
                  }}
                />

                <Input
                  label={t("phoneLabel")}
                  placeholder={t("phonePlaceholder")}
                  value={form.customerPhone}
                  onValueChange={(v) => set("customerPhone", v)}
                  isDisabled={isLoading}
                  classNames={{
                    inputWrapper: "bg-default-100 border-[#2a2a3e]",
                  }}
                />
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={handleClose} isDisabled={isLoading}>
              {checkoutUrl ? tCommon("close") : tCommon("cancel")}
            </Button>
            {!checkoutUrl && (
              <Button
                color="primary"
                type="submit"
                isLoading={isLoading}
                startContent={!isLoading && <Link className="w-4 h-4" />}
              >
                {isLoading ? t("generating") : t("generate")}
              </Button>
            )}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
