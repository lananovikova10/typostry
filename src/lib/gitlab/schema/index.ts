import { z } from "zod"

// Zod schema for GitLab template file
export const templateFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  type: z.enum(["blob", "tree"]),
  mode: z.string().optional(),
})

// Zod schema for GitLab tree response
export const gitLabTreeResponseSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(["blob", "tree"]),
    path: z.string(),
    mode: z.string().optional(),
  })
)

// Zod schema for template content response
export const templateContentSchema = z.object({
  content: z.string(),
  encoding: z.string().optional(),
})

// Type definitions based on Zod schemas
export type TemplateFile = z.infer<typeof templateFileSchema>
export type GitLabTreeResponse = z.infer<typeof gitLabTreeResponseSchema>
export type TemplateContent = z.infer<typeof templateContentSchema>
