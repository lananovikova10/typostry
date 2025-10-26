# Sample Markdown Documents

This folder contains various markdown documents designed to test and demonstrate the features of the Typostry markdown editor.

## 📁 Contents

### 1. [math-formulas.md](./math-formulas.md)
**Purpose**: Test LaTeX/KaTeX math rendering

**Features tested**:
- Inline math expressions: $E = mc^2$
- Block math equations
- Complex mathematical notation
- Greek letters and symbols
- Matrix notation
- Calculus and linear algebra
- Physics and statistics formulas

**Lines**: ~200
**Best for**: Testing math rendering accuracy and performance

---

### 2. [diagrams-mermaid.md](./diagrams-mermaid.md)
**Purpose**: Test Mermaid diagram rendering

**Features tested**:
- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity relationship diagrams
- Gantt charts
- Pie charts
- Git graphs
- User journeys
- Mind maps
- Timelines

**Lines**: ~400
**Best for**: Testing diagram rendering and interactive features

---

### 3. [nested-headings.md](./nested-headings.md)
**Purpose**: Test deeply nested document structure and navigation

**Features tested**:
- Heading levels H1 through H6
- Deep nesting (up to 6 levels)
- Sidebar/outline navigation
- Jump-to-heading functionality
- Document structure visualization

**Lines**: ~500
**Best for**: Testing outline generation and navigation features

---

### 4. [performance-test-large.md](./performance-test-large.md)
**Purpose**: Test performance with very large documents

**Features tested**:
- Virtual scrolling performance
- Memory efficiency
- Scroll smoothness
- Parsing speed
- Rendering performance
- Navigation with many sections

**Lines**: ~30,000+ (2,000 sections)
**Best for**: Performance testing, stress testing the editor

**⚠️ Warning**: This is a very large file. Use the `OptimizedPreview` or `VirtualizedPreview` component for best performance.

---

### 5. [tables-and-lists.md](./tables-and-lists.md)
**Purpose**: Test table and list rendering

**Features tested**:
- Ordered lists
- Unordered lists
- Nested lists (up to 4 levels)
- Task lists (GFM checkboxes)
- Simple tables
- Complex tables
- Tables with alignment
- Large data tables
- Definition lists
- Mixed content

**Lines**: ~400
**Best for**: Testing list and table rendering accuracy

---

### 6. [code-blocks.md](./code-blocks.md)
**Purpose**: Test syntax highlighting for multiple programming languages

**Features tested**:
- JavaScript/TypeScript
- React/TSX
- Python
- Java
- Go
- Rust
- C++
- Ruby
- SQL
- HTML/CSS
- JSON
- Shell scripts
- Dockerfile

**Lines**: ~600+
**Best for**: Testing syntax highlighting with Shiki

---

## 🎯 Usage Guide

### Testing Specific Features

#### Math Rendering
```bash
# Open in editor
math-formulas.md
```
Verify that:
- Inline formulas render correctly
- Block equations are properly formatted
- Greek letters display properly
- Complex notation is readable

#### Diagram Rendering
```bash
# Open in editor
diagrams-mermaid.md
```
Verify that:
- All diagram types render
- Diagrams are interactive (if applicable)
- Dark/light theme support works

#### Performance Testing
```bash
# Open in editor with optimized components
performance-test-large.md
```
Monitor:
- Initial load time
- Scroll performance (should maintain 60 FPS)
- Memory usage (< 150MB recommended)
- Navigation speed

#### Code Highlighting
```bash
# Open in editor
code-blocks.md
```
Check:
- All languages highlight correctly
- Theme switching works
- Long code blocks don't cause issues

### Performance Recommendations

| Document | Component | Expected Performance |
|----------|-----------|---------------------|
| math-formulas.md | MarkdownPreview | < 200ms load |
| diagrams-mermaid.md | MarkdownPreview | < 500ms load |
| nested-headings.md | OptimizedPreview | < 300ms load |
| performance-test-large.md | VirtualizedPreview | < 1s load |
| tables-and-lists.md | MarkdownPreview | < 200ms load |
| code-blocks.md | OptimizedPreview | < 400ms load |

---

## 📊 Document Statistics

| Document | Lines | Words | Size | Complexity |
|----------|-------|-------|------|------------|
| math-formulas.md | ~200 | ~1,200 | ~12 KB | High |
| diagrams-mermaid.md | ~400 | ~2,000 | ~25 KB | High |
| nested-headings.md | ~500 | ~3,000 | ~30 KB | Medium |
| performance-test-large.md | ~30,000 | ~150,000 | ~1.5 MB | Low |
| tables-and-lists.md | ~400 | ~2,500 | ~28 KB | Medium |
| code-blocks.md | ~600 | ~4,000 | ~45 KB | High |

---

## 🧪 Testing Checklist

### Basic Features
- [ ] All documents open without errors
- [ ] Syntax highlighting works for all languages
- [ ] Math formulas render correctly
- [ ] Mermaid diagrams display properly
- [ ] Tables format correctly
- [ ] Lists (ordered/unordered/nested) work

### Navigation
- [ ] Sidebar outline generates correctly
- [ ] Clicking headings navigates properly
- [ ] Scroll sync works in split view
- [ ] Search functionality works

### Performance
- [ ] Large document loads in < 1 second
- [ ] Scrolling is smooth (60 FPS)
- [ ] Memory usage stays reasonable
- [ ] No lag while typing
- [ ] Preview updates smoothly

### Theme Support
- [ ] All documents look good in light theme
- [ ] All documents look good in dark theme
- [ ] Theme switching is smooth
- [ ] Code highlighting themes switch properly
- [ ] Math formulas readable in both themes

### Export/Save
- [ ] Can save all documents
- [ ] Can export to various formats
- [ ] Auto-save works correctly
- [ ] Recovery works after crash

---

## 🐛 Known Issues

### Math Formulas
- Very complex nested formulas may take longer to render
- Some LaTeX commands might not be supported by KaTeX

### Mermaid Diagrams
- Extremely large diagrams may exceed SVG size limits
- Some advanced Mermaid features may not be supported

### Performance
- Documents over 50,000 lines may require virtual scrolling
- Many complex code blocks can slow down rendering

---

## 💡 Tips for Testing

1. **Start Small**: Begin with math-formulas.md and work up to larger documents
2. **Monitor Performance**: Use browser DevTools to monitor memory and FPS
3. **Test Theme Switching**: Switch themes while viewing each document
4. **Try Navigation**: Use the sidebar extensively with nested-headings.md
5. **Stress Test**: Open performance-test-large.md to test limits
6. **Compare Components**: Try different preview components with the same document

---

## 🔧 Troubleshooting

### Document Won't Load
- Check browser console for errors
- Try refreshing the page
- Clear browser cache
- Reduce browser extensions

### Slow Performance
- Use `VirtualizedPreview` for large documents
- Increase debounce time to 500ms
- Close other browser tabs
- Check if Web Worker is working

### Math/Diagrams Not Rendering
- Wait a few seconds for initialization
- Check browser console for errors
- Verify KaTeX/Mermaid are loaded
- Try refreshing the page

### Memory Issues
- Close unnecessary documents
- Use `VirtualizedPreview` for large files
- Restart the browser
- Check for memory leaks in DevTools

---

## 📝 Creating New Test Documents

When creating new test documents:

1. **Name clearly**: Use descriptive filenames
2. **Add to README**: Document the purpose and features tested
3. **Include statistics**: Document size, lines, complexity
4. **Test thoroughly**: Verify all features work
5. **Update checklist**: Add new items to test

### Template for New Samples

```markdown
# Document Title

Brief description of what this document tests.

## Feature Category 1

Content that tests specific features...

## Feature Category 2

More content...

---

**End Notes**: Summary of what was tested
```

---

## 📚 Additional Resources

- [Performance Documentation](../docs/PERFORMANCE.md)
- [Quick Start Guide](../docs/PERFORMANCE_QUICK_START.md)
- [Implementation Summary](../PERFORMANCE_IMPLEMENTATION_SUMMARY.md)

---

## 🤝 Contributing

To add new sample documents:

1. Create a new `.md` file in the Samples folder
2. Add comprehensive test cases for your feature
3. Update this README with document details
4. Test with all preview components
5. Document any performance considerations

---

**Last Updated**: 2025-10-26
**Total Documents**: 6
**Total Lines**: ~32,000+
**Purpose**: Comprehensive feature testing
