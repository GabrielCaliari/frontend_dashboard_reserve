import { z } from "zod"

type TranslateFn = (key: string, values?: Record<string, unknown>) => string

const createCampaignSchema = (t: TranslateFn) => z.object({
    name: z.string()
        .min(3, t("validation.nameMinLength", { min: 3 }))
        .max(50, t("validation.nameMaxLength", { max: 50 }))
        .nonempty(t("validation.campaignNameRequired"))
})

export type CreateCampaignFormData = z.infer<ReturnType<typeof createCampaignSchema>>

export { createCampaignSchema }