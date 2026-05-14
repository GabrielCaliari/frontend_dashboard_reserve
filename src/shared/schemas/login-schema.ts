import * as Yup from "yup";

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

export const loginSchema = (t: TranslateFn) =>
  Yup.object({
    email: Yup.string()
      .email(t("validation.invalidEmail"))
      .required(t("validation.emailRequired")),
    password: Yup.string()
      .min(6, t("validation.passwordMinLength", { min: 6 }))
      .required(t("validation.passwordRequired")),
  });
