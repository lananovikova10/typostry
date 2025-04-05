# Emoji Support for Markdown Editor

This module adds support for emoji shortcodes in the markdown editor. It allows users to type emoji codes using the `:emoji_code:` syntax and have them replaced with actual emoji characters in the preview.

## Usage

To include an emoji in your markdown, use the following syntax:

```
:smile: :heart: :thumbsup:
```

Which will be rendered as:

😄 ❤️ 👍

## Available Emoji Codes

The module includes a wide range of common emojis, including:

- Facial expressions (`:smile:`, `:wink:`, `:laughing:`, etc.)
- Hand gestures (`:thumbsup:`, `:clap:`, `:wave:`, etc.)
- Hearts and symbols (`:heart:`, `:blue_heart:`, `:fire:`, etc.)
- Animals (`:dog:`, `:cat:`, `:panda:`, etc.)
- Food (`:pizza:`, `:apple:`, `:cake:`, etc.)
- Activities (`:soccer:`, `:guitar:`, `:running:`, etc.)
- Travel and places (`:car:`, `:rocket:`, `:house:`, etc.)
- Objects (`:book:`, `:computer:`, `:camera:`, etc.)

For a complete list of supported emoji codes, refer to the `emojiMap` in `src/lib/emoji/index.ts`.

## Implementation Details

The emoji processing happens in the markdown preview component. When the markdown is converted to HTML, the emoji shortcodes are replaced with their corresponding Unicode emoji characters.

The processing flow works as follows:

1. User types `:emoji_code:` in the markdown editor
2. When the preview is rendered, the `replaceEmojis` function scans the text for emoji codes
3. Each found emoji code is looked up in the emoji map
4. The emoji code is replaced with its Unicode character
5. The transformed text is then processed by the markdown parser