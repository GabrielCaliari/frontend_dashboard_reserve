import { z } from "zod";
import {
  LeadOrigin,
  LeadStatus,
  CollectionAccessMode,
} from "@/src/shared/domain/types/@lead";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone_number: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  origin: z.nativeEnum(LeadOrigin).optional(),
  origin_font: z.string().optional(),
  description: z.string().optional(),
  data: z.record(z.any()),
});

export const updateLeadStatusSchema = z.object({
  status: z.nativeEnum(LeadStatus),
});

export const createCollectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  source: z.string().min(3, "Source must be at least 3 characters"),
  access_mode: z.nativeEnum(CollectionAccessMode),
  allowed_domains: z.array(z.string().url("Invalid URL")).optional(),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
  source: z.string().min(3, "Source must be at least 3 characters").optional(),
  access_mode: z.nativeEnum(CollectionAccessMode).optional(),
  allowed_domains: z.array(z.string().url("Invalid URL")).optional(),
  active: z.boolean().optional(),
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusFormData = z.infer<typeof updateLeadStatusSchema>;
export type CreateCollectionFormData = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionFormData = z.infer<typeof updateCollectionSchema>;
