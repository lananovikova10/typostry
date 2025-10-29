# Multi-Cursor Support

The Typostry markdown editor now supports multi-cursor editing, allowing you to type on multiple lines simultaneously.

## Features

### 1. Alt+Click to Add Cursors

Hold down the `Alt` (or `Option` on macOS) key and click anywhere in the editor to add additional cursors.

**Usage:**
- `Alt + Click` - Add a cursor at the clicked position
- Multiple cursors can be added by clicking multiple times while holding `Alt`

### 2. Ctrl+D to Select Next Occurrence

Select text and press `Ctrl+D` (or `Cmd+D` on macOS) to select the next occurrence of that text.

**Usage:**
- Place cursor on a word (nothing selected) - `Ctrl+D` selects the word
- With text selected - `Ctrl+D` finds and selects the next occurrence
- Keep pressing `Ctrl+D` to add more occurrences

### 3. Simultaneous Editing

Once you have multiple cursors, everything you type appears at all cursor positions simultaneously:

- **Regular typing** - Characters appear at all cursors
- **Backspace** - Deletes before each cursor
- **Enter** - Inserts newlines at all cursors
- **Tab** - Inserts spaces at all cursors

### 4. Visual Indicators

Active multi-cursors are displayed as animated blue vertical lines, making it easy to see where your edits will be applied.

### 5. Exit Multi-Cursor Mode

Press `Escape` to exit multi-cursor mode and return to normal single-cursor editing.

## Examples

### Example 1: Editing Multiple Lines

```markdown
Line 1: hello
Line 2: hello
Line 3: hello
```

1. Select "hello" on Line 1
2. Press `Ctrl+D` twice to select "hello" on lines 2 and 3
3. Type "world" - all three instances are replaced simultaneously

Result:
```markdown
Line 1: world
Line 2: world
Line 3: world
```

### Example 2: Adding Prefixes

```markdown
Item 1
Item 2
Item 3
```

1. Click at the start of "Item 1"
2. `Alt+Click` at the start of "Item 2"
3. `Alt+Click` at the start of "Item 3"
4. Type "- " to add a dash and space

Result:
```markdown
- Item 1
- Item 2
- Item 3
```

### Example 3: Simultaneous Edits

```markdown
const name = "";
const email = "";
const phone = "";
```

1. Select "const" in the first line
2. Press `Ctrl+D` twice to select all three occurrences
3. Type "let" - all instances are replaced

Result:
```markdown
let name = "";
let email = "";
let phone = "";
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Click` | Add cursor at click position |
| `Ctrl+D` / `Cmd+D` | Select next occurrence |
| `Escape` | Exit multi-cursor mode |
| `Backspace` | Delete at all cursors |
| `Enter` | Insert newline at all cursors |
| `Tab` | Insert spaces at all cursors |

## Implementation Details

The multi-cursor functionality is implemented using:

- **`/src/lib/multi-cursor.ts`** - Core multi-cursor logic and state management
- **`/src/hooks/use-multi-cursor.ts`** - React hook for managing multi-cursor behavior
- **`/src/components/markdown-editor/markdown-input.tsx`** - Integration into the editor

### Architecture

1. **Cursor Tracking** - Each cursor is tracked with a unique ID and position (start/end)
2. **Position Management** - Cursor positions are automatically adjusted after text changes
3. **Text Operations** - All text operations are applied to each cursor position in reverse order to maintain correct positions
4. **Visual Rendering** - Cursor positions are calculated and rendered as overlay elements

## Browser Compatibility

Multi-cursor support works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Known Limitations

1. **Textarea-based** - Uses textarea element, so some advanced editor features may be limited
2. **Click Position** - Click-to-cursor position calculation is approximate and works best with monospace fonts
3. **Undo/Redo** - Multi-cursor edits are treated as single operations in the undo stack
4. **Grammar Check** - Grammar checking works but may not show highlights at secondary cursor positions

## Future Enhancements

Potential improvements for future versions:

- Column selection mode (Alt+Shift+Drag)
- Multi-cursor paste (paste different clipboard items at each cursor)
- Cursor history navigation
- More precise click-to-cursor position calculation
- Custom cursor colors/styles
