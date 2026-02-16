import * as Yup from "yup";

type TranslateFn = (key: string, values?: Record<string, unknown>) => string

export const BrandAnalysSchema = (t: TranslateFn) => Yup.object({
  brandName: Yup.string().required(t("validation.brandNameRequired")),
  brandNiche: Yup.string()
    .required(t("validation.brandNicheRequired"))
    .min(3, t("validation.brandNicheMinLength", { min: 3 })),
  brandDescription: Yup.string()
    .min(10, t("validation.brandDescriptionMinLength", { min: 10 }))
    .required(t("validation.brandDescriptionRequired")),
});
