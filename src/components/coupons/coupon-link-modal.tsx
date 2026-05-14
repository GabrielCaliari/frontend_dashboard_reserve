"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Snippet,
} from "@heroui/react";
import { Link2, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGetCouponLink } from "@/src/common/hooks/useCoupons";
import { toast } from "@/src/common/hooks/use-toast";
import type { DiscountCoupon } from "@/src/common/@types/@coupons";
import { isAxiosError } from "axios";

interface CouponLinkModalProps {
  coupon: DiscountCoupon;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Corrige links gerados com https://localhost para http://localhost.
 * Apenas afeta ambientes de desenvolvimento — em produção localhost nunca aparece.
 */
function sanitizeLink(link: string): string {
  return link.replace(/^https:\/\/(localhost)(:\d+)?/, (_, host, port) =>
    `http://${host}${port ?? ""}`
  );
}

export function CouponLinkModal({ coupon, isOpen, onClose }: CouponLinkModalProps) {
  const t = useTranslations("coupons");
  const tCommon = useTranslations("common");

  const [baseUrl, setBaseUrl] = useState("");
  const [baseUrlError, setBaseUrlError] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { mutateAsync: getLink, isPending } = useGetCouponLink();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBaseUrl("");
      setBaseUrlError("");
      setGeneratedLink(null);
    }
  }, [isOpen]);

  function validateBaseUrl(url: string): string {
    if (!url.trim()) return t("linkModalBaseUrlRequired");
    try {
      new URL(url.trim());
      return "";
    } catch {
      return t("linkModalBaseUrlInvalid");
    }
  }

  async function handleGenerate() {
    const error = validateBaseUrl(baseUrl);
    if (error) {
      setBaseUrlError(error);
      return;
    }
    setBaseUrlError("");

    try {
      const result = await getLink({
        id: coupon.id,
        baseUrl: baseUrl.trim(),
      });
      setGeneratedLink(sanitizeLink(result.link));
    } catch (err) {
      const message = isAxiosError(err)
        ? err.response?.data?.message ?? t("linkGenerateError")
        : t("linkGenerateError");
      toast({ title: message, variant: "destructive" });
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({ title: t("linkCopied"), variant: "default" });
    } catch {
      toast({ title: t("linkCopyError"), variant: "destructive" });
    }
  }

  function handleBaseUrlChange(value: string) {
    setBaseUrl(value);
    if (generatedLink) setGeneratedLink(null);
    if (baseUrlError) setBaseUrlError("");
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          {t("linkModalTitle")}
        </ModalHeader>

        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-400">
            {t("linkModalDescription", { code: coupon.code })}
          </p>

          <Input
            label={t("linkModalBaseUrlLabel")}
            placeholder={t("linkModalBaseUrlPlaceholder")}
            value={baseUrl}
            onValueChange={handleBaseUrlChange}
            description={t("linkModalBaseUrlHint")}
            isInvalid={!!baseUrlError}
            errorMessage={baseUrlError}
            isRequired
            classNames={{
              inputWrapper: "bg-[#0d0d20] border-gray-700",
              input: "text-gray-100",
            }}
            startContent={<ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />}
          />

          {generatedLink && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {t("linkModalResult")}
              </p>
              <Snippet
                symbol=""
                variant="flat"
                classNames={{
                  base: "bg-[#0d0d20] border border-gray-700 w-full",
                  pre: "text-xs text-primary break-all whitespace-pre-wrap",
                }}
                onCopy={handleCopy}
              >
                {generatedLink}
              </Snippet>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isPending}>
            {tCommon("cancel")}
          </Button>
          {generatedLink ? (
            <Button color="primary" onPress={handleCopy}>
              {t("linkCopyBtn")}
            </Button>
          ) : (
            <Button
              color="primary"
              onPress={handleGenerate}
              isLoading={isPending}
              isDisabled={!baseUrl.trim()}
            >
              {t("linkGenerateBtn")}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
