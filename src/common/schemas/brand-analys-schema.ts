import * as Yup from "yup";

export const BrandAnalysSchema = Yup.object({
  brandName: Yup.string().required("O nome da marca é obrigatório"),
  brandNiche: Yup.string()
    .required("O nicho da marca é obrigatório")
    .min(3, "O nicho deve ter pelo menos 3 caracteres"),
  brandDescription: Yup.string()
    .min(10, "A descrição deve ter pelo menos 10 caracteres")
    .required("A descrição da marca é obrigatória"),
});
