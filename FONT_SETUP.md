# Xenia Font Setup Instructions

This project uses the [Xenia monospaced font](https://github.com/Loretta1982/xenia) for code blocks and math formulas.

## Installation Steps

1. **Download the Xenia font family:**
   - Visit [https://github.com/Loretta1982/xenia](https://github.com/Loretta1982/xenia)
   - Download the `xenia_family.zip` file
   - Extract the ZIP file

2. **Create the fonts directory:**
   ```bash
   mkdir -p public/fonts/xenia
   ```

3. **Copy the font files:**
   Copy all TTF files from the extracted ZIP to `public/fonts/xenia/`:
   - `xenia-light.ttf`
   - `xenia-regular.ttf`
   - `xenia-medium.ttf`
   - `xenia-semibold.ttf`
   - `xenia-bold.ttf`

   Make sure the file names match exactly as shown above (lowercase with hyphens).

4. **Verify the setup:**
   The fonts should be located at:
   ```
   public/
   └── fonts/
       └── xenia/
           ├── xenia-light.ttf
           ├── xenia-regular.ttf
           ├── xenia-medium.ttf
           ├── xenia-semibold.ttf
           └── xenia-bold.ttf
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

The Xenia font will now be used for:
- Inline code in markdown
- Code blocks with syntax highlighting
- Math formulas (KaTeX)
- PDF exports
- All monospaced text throughout the application

## License Note

Xenia is FREE for personal, educational, and open-source use. For commercial use, please check the licensing information at the [Xenia GitHub repository](https://github.com/Loretta1982/xenia).

## Fallback Fonts

If the Xenia font files are not found, the application will fall back to system monospace fonts in the following order:
1. Xenia (if available)
2. ui-monospace
3. SFMono-Regular
4. Menlo
5. Monaco
6. Consolas
7. Liberation Mono
8. Courier New
9. monospace
