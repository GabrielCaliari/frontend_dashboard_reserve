import { z } from "zod"

const createCampaignSchema = z.object({
    name: z.string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(50, "O nome deve ter no máximo 50 caracteres")
        .nonempty("O nome da campanha é obrigatório")
})

export type CreateCampaignFormData = z.infer<typeof createCampaignSchema>

export { createCampaignSchema }