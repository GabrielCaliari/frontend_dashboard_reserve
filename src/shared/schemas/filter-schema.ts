import * as Yup from "yup";

export const filterSchema = Yup.object({
  cnae: Yup.array().of(Yup.number()).nullable(),
  estado: Yup.string(),
  cidade: Yup.string(),
});
