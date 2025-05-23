# Unsplash API Integration

This module provides integration with the Unsplash API to fetch random images and insert them into markdown content.

## Setup

1. Create a `.env.local` file in the root of the project with your Unsplash API credentials:

```
UNSPLASH_ACCESS_KEY=your_access_key
UNSPLASH_SECRET_KEY=your_secret_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_access_key
```

Note: The `NEXT_PUBLIC_` prefix is required for client-side access.

2. Make sure `.env.local` is in your `.gitignore` file to avoid committing API credentials.

## Usage

### API Functions

```typescript
import { getRandomPhoto, getRandomPhotoAsMarkdown } from '@/lib/unsplash';

// Get a random photo
const photo = await getRandomPhoto();

// Get a random photo formatted as markdown
const markdown = await getRandomPhotoAsMarkdown();

// Get a random photo with specific parameters
const landscapePhoto = await getRandomPhoto({
  orientation: 'landscape',
  query: 'nature',
});
```

### Parameters

The `getRandomPhoto` and `getRandomPhotoAsMarkdown` functions accept the following optional parameters:

- `collections`: Public collection ID('s) to filter selection. If multiple, comma-separated
- `topics`: Public topic ID('s) to filter selection. If multiple, comma-separated
- `username`: Limit selection to a single user
- `query`: Limit selection to photos matching a search term
- `orientation`: Filter by photo orientation (landscape, portrait, squarish)
- `content_filter`: Limit results by content safety (low, high)
- `count`: The number of photos to return (Default: 1; max: 30)

Note: You can't use the collections or topics filtering with query parameters in the same request.

## Markdown Format

The `getRandomPhotoAsMarkdown` function returns a string in the following format:

```markdown
![Photo description](https://example.com/photo.jpg)

Photo by [Photographer Name](https://unsplash.com/@username) on [Unsplash](https://unsplash.com/photos/id)
```

This includes proper attribution as required by the Unsplash API guidelines.

## UI Integration

The Unsplash integration is available in the markdown editor toolbar as the "Unsplash Image" button, which inserts a random image from Unsplash at the cursor position.

## Attribution Requirements

According to Unsplash's API guidelines, proper attribution is required when using their images. The `formatPhotoAsMarkdown` function automatically includes the required attribution.