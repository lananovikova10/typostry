/**
 * Types for the Unsplash API
 */

export interface UnsplashRandomPhotoParams {
  collections?: string
  topics?: string
  username?: string
  query?: string
  orientation?: "landscape" | "portrait" | "squarish"
  content_filter?: "low" | "high"
  count?: number
}

export interface UnsplashPhotoExif {
  make?: string
  model?: string
  exposure_time?: string
  aperture?: string
  focal_length?: string
  iso?: number
}

export interface UnsplashPhotoLocation {
  name?: string
  city?: string
  country?: string
  position?: {
    latitude?: number
    longitude?: number
  }
}

export interface UnsplashCollection {
  id: number
  title: string
  published_at?: string
  last_collected_at?: string
  updated_at?: string
  cover_photo?: any
  user?: any
}

export interface UnsplashPhotoUrls {
  raw: string
  full: string
  regular: string
  small: string
  thumb: string
}

export interface UnsplashPhotoLinks {
  self: string
  html: string
  download: string
  download_location: string
}

export interface UnsplashUser {
  id: string
  updated_at?: string
  username: string
  name: string
  portfolio_url?: string
  bio?: string
  location?: string
  total_likes?: number
  total_photos?: number
  total_collections?: number
  instagram_username?: string
  twitter_username?: string
  links?: {
    self?: string
    html?: string
    photos?: string
    likes?: string
    portfolio?: string
  }
}

export interface UnsplashPhoto {
  id: string
  created_at?: string
  updated_at?: string
  width: number
  height: number
  color?: string
  blur_hash?: string
  downloads?: number
  likes?: number
  liked_by_user?: boolean
  description?: string
  exif?: UnsplashPhotoExif
  location?: UnsplashPhotoLocation
  current_user_collections?: UnsplashCollection[]
  urls: UnsplashPhotoUrls
  links: UnsplashPhotoLinks
  user: UnsplashUser
}

export type UnsplashRandomPhotoResponse = UnsplashPhoto | UnsplashPhoto[]
