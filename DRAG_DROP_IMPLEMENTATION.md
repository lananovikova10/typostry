# Drag-and-Drop Image Implementation

## Overview
Implemented drag-and-drop functionality for local images in the MarkdownInput component. Users can now drag image files directly into the editor, and they will be automatically converted to inline markdown images using base64 encoding.

## Features Implemented

### 1. Drag-and-Drop Handler
- **Location**: `src/components/markdown-editor/markdown-input.tsx`
- Handles drag enter, drag over, drag leave, and drop events
- Filters for image files only (ignores other file types)
- Supports multiple images dropped at once

### 2. Visual Feedback
- Shows a highlighted border with dashed outline when dragging files over the editor
- Updates placeholder text to indicate drag-and-drop support: "Write your markdown here... (or drag & drop images)"
- Provides smooth visual transitions

### 3. Image Processing
- Converts dropped images to base64 data URLs
- Generates markdown syntax: `![alt-text](data:image/...)`
- Uses filename (without extension) as alt text
- Inserts images at current cursor position
- Handles multiple images with proper spacing

### 4. Supported Image Formats
All standard image formats are supported:
- PNG
- JPEG/JPG
- GIF
- WebP
- SVG
- BMP
- ICO

## Usage

### Basic Usage
1. Open the markdown editor
2. Drag one or more image files from your file system
3. Drop them onto the editor textarea
4. Images will be automatically inserted as markdown with base64-encoded data

### Example Output
When you drop an image named "screenshot.png", it will insert:
```markdown
![screenshot](data:image/png;base64,iVBORw0KGgoAAAANS...)
```

For multiple images:
```markdown
![image1](data:image/png;base64,...)

![image2](data:image/jpeg;base64,...)
```

## Implementation Details

### State Management
- `isDragOver`: Tracks whether files are being dragged over the editor

### Event Handlers
1. **handleDragEnter**: Activates visual feedback when files enter the drop zone
2. **handleDragOver**: Maintains drag state and sets proper cursor
3. **handleDragLeave**: Removes visual feedback when files leave the drop zone
4. **handleDrop**: Processes dropped files and inserts markdown

### Helper Functions
- `readFileAsDataURL`: Async function to convert File objects to base64 data URLs
- Preserves cursor position and scroll state during insertion

## Technical Considerations

### Base64 Encoding
- Images are embedded directly in markdown as data URLs
- This makes the markdown files self-contained (no external dependencies)
- Large images will increase markdown file size significantly
- Consider file size limits for production use

### Performance
- Async file reading prevents UI blocking
- Multiple images processed sequentially
- Maintains scroll position during insertion

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard File API and FileReader
- No external dependencies required

## Testing

### Manual Testing Steps
1. Start the development server: `npm run dev`
2. Navigate to the markdown editor page
3. Prepare test images on your desktop
4. Drag and drop test scenarios:
   - Single image
   - Multiple images at once
   - Mix of image and non-image files (only images should be inserted)
   - Different image formats

### Expected Behavior
- Visual feedback appears when dragging files over editor
- Only image files are processed
- Images inserted at cursor position
- Cursor moves to end of inserted content
- Multiple images separated by blank lines

## Future Enhancements

Possible improvements:
1. **Image Optimization**: Compress images before encoding
2. **Size Limits**: Add warnings for large images
3. **Upload to CDN**: Option to upload images to external storage instead of base64
4. **Progress Indicator**: Show progress for multiple/large images
5. **Drag Position**: Insert at exact drop location in textarea
6. **Image Preview**: Show thumbnail before inserting
7. **Undo/Redo**: Integrate with editor's undo stack

## Related Files
- Implementation: `src/components/markdown-editor/markdown-input.tsx`
- Parent component: `src/components/markdown-editor/index.tsx`
- Tests: `src/components/markdown-editor/__tests__/drag-drop-image.test.tsx` (note: requires JSDOM enhancements for drag events)
