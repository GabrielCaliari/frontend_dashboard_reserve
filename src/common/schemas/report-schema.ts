import * as Yup from "yup";

type TranslateFn = (key: string, values?: Record<string, any>) => string;

export const ReportSchema = (t: TranslateFn) =>
  Yup.object({
    phone: Yup.string()
      .required(t("phoneRequired"))
      .max(20, t("phoneMaxLength", { max: 20 })),
    url: Yup.string()
      .required(t("urlRequired"))
      .url(t("urlInvalid")),
    label: Yup.string()
      .max(150, t("labelMaxLength", { max: 150 }))
      .nullable()
      .optional(),
  });
