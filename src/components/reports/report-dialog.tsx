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

// Simple US phone formatter: input: 1234567890 -> output: (123) 456-7890
const formatUSPhone = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
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
      onSubmit({
        phone: values.phone,
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
