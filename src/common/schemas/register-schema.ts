import * as Yup from "yup";

export const formRegisterSchema = [
  Yup.object({
    name: Yup.string()
      .required("Nome é obrigatório.")
      .matches(
        /^[A-Za-zÀ-ÖØ-öø-ÿÁ-úçÇ]{2,}(?: [A-Za-zÀ-ÖØ-öø-ÿÁ-úçÇ]{2,})*$/,
        "Nome deve ter pelo menos duas letras por palavra e pode conter acentos."
      ),
    email: Yup.string()
      .email("E-mail inválido.")
      .required("E-mail é obrigatório."),
    cpf: Yup.string()
      .required("CPF é obrigatório.")
      .matches(
        /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
        "Formato de CPF inválido (000.000.000-00)."
      ),
  }),
  Yup.object({
    phone: Yup.string()
      .required("Telefone é obrigatório.")
      .matches(
        /^\(\d{2}\) \d{4,5}-\d{4}$/,
        "Formato de telefone inválido. Exemplo: (XX) XXXXX-XXXX."
      ),
    password: Yup.string()
      .required("Senha é obrigatória.")
      .min(6, "Senha deve ter pelo menos 6 caracteres."),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "As senhas não conferem.")
      .required("Confirmação de senha é obrigatória."),
  }),
];
