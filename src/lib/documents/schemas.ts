import { z } from "zod"

export const MAX_TITLE_LENGTH = 200

export const documentIdSchema = z.string().uuid()

export const documentTitleSchema = z.string().trim().min(1).max(MAX_TITLE_LENGTH)
