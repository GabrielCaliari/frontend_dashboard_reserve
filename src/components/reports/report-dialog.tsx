"use client";

import { useEffect, ChangeEvent } from "react";
import { Button, Input } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useFormik } from "formik";
import { ReportSchema } from "@/src/common/schemas/report-schema";
import type { Report } from "@/src/common/@types/@report";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null; // null = create mode
  onSubmit: (values: { phone: string; url: string; label?: string }) => void;
  isSubmitting: boolean;
}

// Strips all non-digit characters and removes leading country code (1 for US/CA)
const stripToDigits = (value: string) => value.replace(/\D/g, "").replace(/^1/, "");

// Formats 10-digit string to (XXX) XXX-XXXX for display
const formatUSPhone = (value: string) => {
  const digits = stripToDigits(value);
  if (digits.length < 4) return digits;
  if (digits.length < 7) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

export function ReportDialog({
  isOpen,
  onClose,
  report,
  onSubmit,
  isSubmitting,
}: ReportDialogProps) {
  const t = useTranslations("reports");
  const isEditing = !!report;

  const formik = useFormik({
    initialValues: {
      phone: report?.phone ? formatUSPhone(report.phone) : "",
      url: report?.url ?? "",
      label: report?.label ?? "",
    },
    validationSchema: ReportSchema(t),
    enableReinitialize: true,
    onSubmit: (values) => {
      const digits = stripToDigits(values.phone);
      onSubmit({
        phone: `1${digits}`,
        url: values.url,
        label: values.label || undefined,
      });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      formik.resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUSPhone(e.target.value);
    formik.setFieldValue("phone", formatted);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 py-4 border-b border-gray-800">
          <SheetTitle>{isEditing ? t("editReport") : t("newReport")}</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={formik.handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <Input
              label={t("phoneLabel")}
              placeholder={t("phonePlaceholder")}
              name="phone"
              value={formik.values.phone}
              onChange={handlePhoneChange}
              onBlur={formik.handleBlur}
              isInvalid={!!(formik.touched.phone && formik.errors.phone)}
              errorMessage={
                formik.touched.phone && formik.errors.phone
                  ? formik.errors.phone as string
                  : undefined
              }
              maxLength={14} // (XXX) XXX-XXXX is 14 chars
              isRequired
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Input
              label={t("urlLabel")}
              placeholder={t("urlPlaceholder")}
              name="url"
              type="url"
              value={formik.values.url}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={!!(formik.touched.url && formik.errors.url)}
              errorMessage={
                formik.touched.url && formik.errors.url
                  ? formik.errors.url as string
                  : undefined
              }
              isRequired
              classNames={{ inputWrapper: "bg-default-100" }}
            />
            <Input
              label={t("labelLabel")}
              placeholder={t("labelPlaceholder")}
              name="label"
              value={formik.values.label}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              isInvalid={!!(formik.touched.label && formik.errors.label)}
              errorMessage={
                formik.touched.label && formik.errors.label
                  ? formik.errors.label as string
                  : undefined
              }
              maxLength={150}
              classNames={{ inputWrapper: "bg-default-100" }}
            />
          </div>
          
          <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-2 bg-[#16162a] mt-auto">
            <Button variant="light" onPress={onClose}>
              {t("cancel")}
            </Button>
            <Button color="primary" type="submit" isLoading={isSubmitting}>
              {isSubmitting ? (isEditing ? t("saving") : t("creating")) : t("save")}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
