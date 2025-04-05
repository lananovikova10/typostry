# Markdown Editor Component

A Next.js markdown editor component with real-time preview and theme support.

## Features

- Real-time markdown preview
- Emoji support using `:emoji_code:` syntax
- Toolbar with common markdown shortcuts
- Theme support (light/dark)
- Executable JavaScript code blocks in preview mode
- File system operations:
  - Create new files
  - Open existing files directly from the local filesystem
  - Save files directly to the opened file
  - Save As functionality

## Usage

```jsx
import { MarkdownEditor } from "@/components/markdown-editor";

export default function YourComponent() {
  return (
    <MarkdownEditor 
      initialValue="# Hello World\n\nI'm happy :smile: about this editor!"
      onChange={(value) => console.log(value)}
    />
  );
}
```

### Emoji Support

You can use emoji shortcodes like `:smile:` in your markdown, and they will be rendered as actual emoji characters (😄) in the preview.

Examples:
- `:heart:` → ❤️
- `:thumbsup:` → 👍
- `:rocket:` → 🚀

See the [emoji documentation](../../lib/emoji/README.md) for a full list of supported emoji codes.

### JavaScript Code Execution

When in preview mode, JavaScript code blocks will display a run button that allows you to execute the code directly in the browser:

````markdown
```js
console.log('Hello from executable JavaScript!');
alert('This will be executed when you click the run button');
```
````

## Props

| Prop | Type | Description |
|------|------|-------------|
| `initialValue` | `string` | Initial markdown content |
| `className` | `string` | Additional CSS class names |
| `onChange` | `(value: string) => void` | Callback fired when the content changes |

## File System Access API

This component uses the modern File System Access API, which provides the following benefits:

- Access to local file system (e.g., Documents folder)
- Direct saving to the opened file
- Better user experience with native file picker
- Fallback for browsers that don't support the API

Note: The File System Access API is supported in Chrome 86+, Edge 86+, and Opera 72+. For other browsers, the component falls back to traditional file input and download methods.