/**
 * Markdown preprocessing utilities for grammar checking
 */
import { PositionMapping } from "./types"

/**
 * Strip markdown syntax from text while maintaining position mapping
 * This allows us to check grammar without markdown syntax confusing the API
 * but still map errors back to the original text
 */
export function stripMarkdownForGrammarCheck(markdown: string): {
  stripped: string
  mapping: PositionMapping
} {
  // Initialize mapping structures
  const originalToStripped = new Map<number, number>()
  const strippedToOriginal = new Map<number, number>()

  let stripped = ""
  let inCodeBlock = false
  let inLink = false
  let inImage = false

  // Loop through each character in the markdown
  for (let i = 0, j = 0; i < markdown.length; i++) {
    const char = markdown[i]
    const nextChar = markdown[i + 1]
    const prevChar = i > 0 ? markdown[i - 1] : ""

    // Check for code block markers
    if (char === "`" && nextChar === "`" && markdown[i + 2] === "`") {
      inCodeBlock = !inCodeBlock
      i += 2 // Skip the other two backticks
      continue
    }

    // Skip content inside code blocks
    if (inCodeBlock) {
      continue
    }

    // Check for inline code
    if (char === "`") {
      // Skip until we find the closing backtick
      const startPos = i
      i++
      while (i < markdown.length && markdown[i] !== "`") {
        i++
      }
      continue
    }

    // Check for links [text](url)
    if (char === "[" && !inLink) {
      inLink = true
    } else if (char === "]" && inLink && nextChar === "(") {
      // Skip the URL portion
      i += 2 // Skip "]("
      while (i < markdown.length && markdown[i] !== ")") {
        i++
      }
      inLink = false
      continue
    }

    // Check for images ![alt](url)
    if (char === "!" && nextChar === "[") {
      inImage = true
      i++ // Skip the '['

      // Add a placeholder character for the image to maintain text length
      stripped += "⁂" // Using a special character as placeholder
      originalToStripped.set(i - 1, j) // Map the '!' position
      strippedToOriginal.set(j, i - 1)
      j++
    } else if (char === "]" && inImage && nextChar === "(") {
      // Skip the URL portion
      i += 2 // Skip "]("

      // Find the closing parenthesis
      const startUrlPos = i
      while (i < markdown.length && markdown[i] !== ")") {
        i++
      }

      // Add another placeholder character for the URL part
      stripped += "⁂" // Using a special character as placeholder
      originalToStripped.set(startUrlPos, j) // Map the URL start position
      strippedToOriginal.set(j, startUrlPos)
      j++

      inImage = false
      continue
    }

    // Don't skip headers (# Header) - we want to preserve them for grammar checking
    // if (char === '#' && (prevChar === '' || prevChar === '\n')) {
    //   while (i < markdown.length && markdown[i] === '#') {
    //     i++;
    //   }
    //   // Skip the space after the last #
    //   if (i < markdown.length && markdown[i] === ' ') {
    //     i++;
    //   }
    //   continue;
    // }

    // Skip emphasis markers (* and _)
    if (
      (char === "*" || char === "_") &&
      (nextChar === "*" ||
        nextChar === "_" ||
        /\w/.test(nextChar) ||
        /\w/.test(prevChar))
    ) {
      continue
    }

    // Skip HTML tags
    if (char === "<" && (nextChar === "/" || /[a-zA-Z]/.test(nextChar))) {
      // Find the closing >
      while (i < markdown.length && markdown[i] !== ">") {
        i++
      }
      continue
    }

    // Add character to stripped text and maintain position mapping
    stripped += char
    originalToStripped.set(i, j)
    strippedToOriginal.set(j, i)
    j++
  }

  return {
    stripped,
    mapping: {
      originalToStripped,
      strippedToOriginal,
    },
  }
}

/**
 * Maps a position in the stripped text back to the original text
 */
export function mapStrippedToOriginal(
  position: number,
  mapping: PositionMapping
): number {
  // Start with the exact mapping if available
  if (mapping.strippedToOriginal.has(position)) {
    return mapping.strippedToOriginal.get(position)!
  }

  // Find the closest position
  let maxLessThan = -1
  const entries = Array.from(mapping.strippedToOriginal.entries())

  for (let i = 0; i < entries.length; i++) {
    const [stripped, original] = entries[i]
    if (stripped <= position && stripped > maxLessThan) {
      maxLessThan = stripped
    }
  }

  if (maxLessThan !== -1) {
    const diff = position - maxLessThan
    return mapping.strippedToOriginal.get(maxLessThan)! + diff
  }

  return position // Fallback
}

/**
 * Check if a position in the original text is inside a code block
 */
export function isInsideCodeBlock(position: number, markdown: string): boolean {
  let codeBlockState = false

  for (let i = 0; i < position && i < markdown.length; i++) {
    // Check for code block markers
    if (
      markdown[i] === "`" &&
      i + 1 < markdown.length &&
      markdown[i + 1] === "`" &&
      i + 2 < markdown.length &&
      markdown[i + 2] === "`"
    ) {
      codeBlockState = !codeBlockState
      i += 2 // Skip the other backticks
    }

    // Check for inline code
    if (markdown[i] === "`" && !codeBlockState) {
      let inlineCodeState = true
      i++
      while (i < position && i < markdown.length) {
        if (markdown[i] === "`") {
          inlineCodeState = false
          break
        }
        i++
      }
      if (inlineCodeState && i >= position) {
        return true
      }
    }
  }

  return codeBlockState
}
