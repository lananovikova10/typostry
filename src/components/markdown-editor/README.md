# Markdown Editor Component

A fully-featured Markdown editor with real-time preview, toolbar, and grammar checking capabilities.

## Features

- Real-time markdown preview
- Toolbar with common formatting options
- Grammar and spelling checking
- File system access for saving and loading files
- Reading statistics
- Keyboard shortcuts
- Light and dark mode support
- Fully responsive design

## Usage

```jsx
import { MarkdownEditor } from "@/components/markdown-editor"

export default function MyEditor() {
  return (
    <MarkdownEditor
      initialValue="# Hello World"
      onChange={(value) => console.log(value)}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | string | `""` | Initial markdown content |
| `className` | string | `undefined` | Additional CSS classes |
| `onChange` | function | `undefined` | Callback function when content changes |
| `sidebarEnabled` | boolean | `true` | Whether to show the sidebar with document structure |

## Keyboard Shortcuts

See the [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) file for a full list of available keyboard shortcuts.

## Components

The Markdown Editor is composed of several components:

- `MarkdownInput`: The text area where markdown is typed
- `MarkdownPreview`: Real-time rendered preview of the markdown
- `MarkdownToolbar`: Buttons for formatting and file operations
- `MarkdownSidebar`: Document outline and navigation
- `ReadingStats`: Word count and estimated reading time

## Responsive Design

The editor features a fully responsive layout:

- On small screens (≤640px): Editor spans full width with the preview below
- On larger screens (>640px): Editor and preview share horizontal space (side-by-side)
- Minimum editor height of 200px on all screen sizes
- Top and bottom scroll-fade gradients maintain a minimum height of 20px

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --markdown-toolbar-bg: /* toolbar background color */;
  --markdown-toolbar-border: /* toolbar border color */;
  /* ... additional custom properties */
}
```

See the `globals.css` file for a complete list of custom properties.