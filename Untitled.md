# Requirements and Recommendations for Grammar Error Correction (GEC) and Text Completion APIs

This document outlines the technical and integration requirements for exposing Natural Language Processing (NLP) capabilities—specifically Grammar Error Correction (GEC) and Text Completion—through APIs. The goal is to ensure both the robustness of the user experience and the reliability of server-side processing, especially when clients have limited NLP expertise.

---

## Overview

The NLP APIs are designed to be flexible yet powerful components for grammar checking and text completion across a variety of client platforms, including desktop IDEs, web editors, and mobile applications. Seamless integration demands attention to text preprocessing, interaction paradigms, and contextual awareness.




---

## Client-Side Requirements for Grammar Error Correction (GEC)

### A. **Preprocessing & Analysis**

- **Typing Delay & Debouncing**: Initiate analysis only after a pause in typing to prevent excessive requests.
- **Sentence Tokenization**: Tokenize text into sentences client-side using the provided Kotlin/JVM+JS library; submit in batches of 32.
- **Language Detection**: Detect and validate supported languages client-side before sending requests.
- **Intelligent Caching**: Cache results per sentence and per detected language. On text change, reanalyze only the affected sentence(s).
- **Offset Management**: Ensure problem highlights remain correctly positioned even if the underlying text changes post-analysis.

### B. **User Interface Considerations**

- **Highlighting Variants**: Support confidence-level-based and category-based highlighting styles.
- **Display Modes**: Enable both "always visible" and "on-hover" highlight display.
- **Language Consistency**: Avoid mixing languages within popups; messages and actions must follow the text’s language or be icon-based.

### C. **Markup Awareness**

- **Stripping & Restoration**: Remove markup (Markdown, code, images) before analysis, while tracking and restoring positional offsets.
- **Text Styling**: Treat font styles (bold, italic, superscript) as markup elements.
- **Problem Display Mapping**: Ensure server-reported issues align with the styled, user-facing text.
- **Fix Application**: Respect markup boundaries when applying quick fixes.

### D. **Structural Context**

- **Document Layout Awareness**: Use structural metadata (headings, list items, paragraphs) to filter or prioritize suggestions.
- **Full-Text Analysis (Future Support)**: Prepare to submit full document text with structure for advanced use cases.
- **Contextual Exclusions**: Exclude quoted text, configure this in client settings.
- **Table Cell Handling**: Maintain cell independence; avoid merging adjacent cell content into one sentence or paragraph.

### E. **Advanced Features (Recommended)**

- **Suggestion Ignoring**: Allow users to ignore suggestions at various scopes. Maintain dictionaries and user preferences in settings.
- **Feedback Collection**:
  - Report incorrect suggestions with context (sentence, error ID, fix suggestions, markup, user environment).
  - Route feedback through the product’s own pipeline before reaching the GEC backend to account for frontend-induced issues.
- **Customization Settings**: Enable configuration of language variants, rule sets, and writing styles.
- **Quick Fix Customization**: Let users adjust settings directly from suggestion UIs (e.g., disable a rule).
- **Autocorrection**: Apply selected fixes automatically when feasible.
- **Batch Fix UI**: Allow multiple suggestions to be applied at once.
- **Formality Detection**: Indicate tone (formal/informal) as part of the analysis output.
- **Utility Metrics**: Show word count and estimated reading time client-side.

---

## Client-Side Requirements for Text Completion

- **Language Detection**: Validate supported language prior to sending to API.
- **Interaction Profiles**: Support profiles like "Always," "Moderate," and "Never" for auto-completion behavior.
- **Client-Side Caching**: Avoid re-requesting completions for predictable edits (e.g., backspace, retyping).
- **Input Ergonomics**:
  - Ensure shortcut keys (e.g., `Right Arrow`, `End`) do not interfere with expected behaviors or system-level shortcuts.
  - Suggestions should render in the same style (excluding color) as surrounding text.
  - Prevent suggestion overflow outside the visible editor viewport.
- **Feedback Action**: Include a mechanism to report low-quality completions.

---

## Server-Side & On-Premise Considerations

- **TREE Service Deployment**:
  - Requires specific GPU setup (currently I4) with DeepSpeed disabled to maintain rule-checking accuracy.
- **API Variants with Markup Awareness**:
  - Promote the use of enriched API versions that accept contextual and markup data.
  - Enables more accurate grammar detection, style consistency, and better completion outcomes.

---

## Product Integration Challenges & Developer Recommendations

### A. **Variability Across Products**
- Each product (e.g., IDE, Fleet, YouTrack) contains numerous language-specific and usage-specific corner cases.
- Heuristics are often custom (e.g., avoid flagging "cherry-picked" in Git commit dialogs).
- Expectation: unless teams are deeply invested in NLP, they’ll lack the resources to handle edge cases.

### B. **Client-Side Portability**
- Clients should use **Kotlin Multiplatform (KMP)** to enable reuse across platforms (desktop, mobile, web).
- Dependencies (e.g., Lucene, LanguageTool) should ideally be replaced or wrapped to support KMP.
- Favor client libraries that are JVM-independent to ensure compatibility across platforms (including web and embedded devices).

---

## Data Contribution Guidelines for Clients

To improve the quality of GEC and Completion:

- **Event Tracking**:
  - Log and submit when users accept suggestions (along with suggestion type, if applicable).
- **Context Sharing**:
  - Enable the passing of page or session-level context (e.g., previous messages, current conversation thread).
  - Potential APIs can be developed to support this use case.

**Benefits**:
- More relevant suggestions (e.g., maintaining style, handling domain-specific words).
- Reduction in false positives.
- Advanced features like dynamic tone/style matching and multilingual switching.

---

## Conclusion

A successful integration of GEC and Completion APIs hinges on a combination of smart client-side preprocessing, rich contextual metadata, and structured feedback loops. Clients should aim to offload complexity by leveraging shared libraries and configurations, while the backend continues evolving toward better contextual understanding and lightweight integration footprints.
