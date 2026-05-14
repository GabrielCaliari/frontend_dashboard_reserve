import * as Yup from "yup";

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

export const formRegisterSchema = (t: TranslateFn) => [
  Yup.object({
    name: Yup.string()
      .required(t("validation.nameRequired"))
      .matches(
        /^[A-Za-zÀ-ÖØ-öø-ÿÁ-úçÇ]{2,}(?: [A-Za-zÀ-ÖØ-öø-ÿÁ-úçÇ]{2,})*$/,
        t("validation.namePattern"),
      ),
    email: Yup.string()
      .email(t("validation.invalidEmail"))
      .required(t("validation.emailRequired")),
    cpf: Yup.string()
      .required(t("validation.cpfRequired"))
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, t("validation.cpfInvalid")),
  }),
  Yup.object({
    phone: Yup.string()
      .required(t("validation.phoneRequired"))
      .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, t("validation.phoneInvalid")),
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(6, t("validation.passwordMinLength", { min: 6 })),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], t("validation.passwordsMismatch"))
      .required(t("validation.confirmPasswordRequired")),
  }),
];
