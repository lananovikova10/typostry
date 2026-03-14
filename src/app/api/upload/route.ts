import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

import { uploadFileMetadataSchema } from "@/lib/api-schemas"
import {
  noStoreJson,
  requireRateLimit,
  requireTrustedRequest,
} from "@/lib/api-security"

const MIME_TYPE_TO_EXTENSION = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function detectMimeType(buffer: Buffer): keyof typeof MIME_TYPE_TO_EXTENSION | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png"
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg"
  }

  if (
    buffer.length >= 6 &&
    buffer.subarray(0, 6).toString("ascii") === "GIF87a"
  ) {
    return "image/gif"
  }

  if (
    buffer.length >= 6 &&
    buffer.subarray(0, 6).toString("ascii") === "GIF89a"
  ) {
    return "image/gif"
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp"
  }

  return null
}

export async function POST(request: NextRequest) {
  const trustedRequestError = requireTrustedRequest(request)
  if (trustedRequestError) {
    return trustedRequestError
  }

  const rateLimitError = requireRateLimit(request, {
    key: "upload",
    maxRequests: 10,
    windowMs: 60 * 1000,
    errorMessage: "Too many uploads. Please wait before trying again.",
  })
  if (rateLimitError) {
    return rateLimitError
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return noStoreJson({ error: "No file provided" }, { status: 400 })
    }

    const parsedMetadata = uploadFileMetadataSchema.safeParse({
      name: file.name,
      type: file.type,
      size: file.size,
    })

    if (!parsedMetadata.success) {
      return noStoreJson(
        {
          error: "Invalid upload metadata",
          details: parsedMetadata.error.flatten(),
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return noStoreJson(
        { error: "File is too large" },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const detectedMimeType = detectMimeType(buffer)

    if (!detectedMimeType || detectedMimeType !== parsedMetadata.data.type) {
      return noStoreJson(
        { error: "Unsupported or mismatched image type" },
        { status: 400 }
      )
    }

    const uploadsDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const extension = MIME_TYPE_TO_EXTENSION[detectedMimeType]
    const filename = `${crypto.randomUUID()}.${extension}`
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/${filename}`
    return noStoreJson({ url })
  } catch (error) {
    console.error("Error uploading file:", error)
    return noStoreJson(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
