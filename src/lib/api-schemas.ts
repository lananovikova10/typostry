import { z } from "zod"

const MAX_TEXT_INPUT_LENGTH = 8000

export const nlcCompletionRequestSchema = z.object({
  context: z.string().trim().min(1).max(4000),
  language: z.enum(["en", "de"]),
  profile: z.enum(["Always", "Moderate"]).optional(),
}).strict()

export const summarizeRequestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_INPUT_LENGTH),
  options: z
    .object({
      maxLength: z.number().int().min(20).max(130).optional(),
      minLength: z.number().int().min(10).max(120).optional(),
      doSample: z.boolean().optional(),
    })
    .strict()
    .optional(),
}).strict()

export const unsplashRandomParamsSchema = z.object({
  collections: z.string().trim().max(200).optional(),
  topics: z.string().trim().max(200).optional(),
  username: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  query: z.string().trim().min(1).max(200).optional(),
  orientation: z.enum(["landscape", "portrait", "squarish"]).optional(),
  content_filter: z.enum(["low", "high"]).optional(),
  count: z.coerce.number().int().min(1).max(1).optional(),
}).strict()

export const uploadFileMetadataSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
})
