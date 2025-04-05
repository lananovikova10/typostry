# Key Implementation Details

- The editor makes POST requests to a LanguageTool API endpoint (v2/check)
- Grammar and spelling errors are visually distinguished using different colors
- The system supports both grammar and spelling error detection
- Error highlighting uses wavy underlines with CSS text-decoration properties
- The API returns detailed information including:
  - Error message
  - Suggested replacements
  - Error context
  - Rule descriptions
  - Error positions (offset and length)