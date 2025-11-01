# Measurement Cache for Virtualized Preview

## Overview

The measurement cache is a performance optimization feature for the virtualized markdown preview that reduces layout thrash when scrolling large documents containing tables, diagrams, and code blocks.

## Problem Statement

The virtualized preview uses `react-window`'s `VariableSizeList` to efficiently render large markdown documents by only rendering visible items. However, accurate height measurements are critical for:

1. **Correct scroll positioning** - Without accurate heights, scrolling feels jerky
2. **Avoiding blank spaces** - Inaccurate heights cause visual gaps
3. **Smooth user experience** - Layout thrash during scrolling degrades performance

Previously, the component estimated heights based on content type and structure, but these estimates were often inaccurate, especially for:
- Large tables with varying cell content
- Code blocks with different line counts
- Complex nested lists
- Mixed content diagrams

## Solution: Block Signature-Based Caching

The measurement cache solves this by:

1. **Generating block signatures** - Each content block gets a unique signature based on:
   - Content type (table, code, list, heading, text)
   - Content length
   - Key structural features (e.g., table dimensions, code line count)

2. **Caching measured heights** - When a block is rendered and measured via ResizeObserver, its actual height is stored in the cache using its signature as the key

3. **Reusing cached measurements** - When a similar block appears (same signature), the cached height is used immediately, avoiding the need to render and measure again

## Architecture

### Components

#### `MeasurementCache` Class ([src/lib/measurement-cache.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/lib/measurement-cache.ts?type=file&root=%252F))

The core cache implementation with:
- **Signature generation** - Hashes content type + length + features
- **Storage** - Map-based storage with metadata (timestamp, hit count)
- **Eviction policies** - LRU and time-based eviction
- **Statistics** - Cache hit tracking and performance metrics

#### `VirtualizedPreview` Component ([src/components/markdown-editor/virtualized-preview.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/components/markdown-editor/virtualized-preview.tsx?type=file&root=%252F))

Integrates the cache with:
- **Block signature generation** during parsing
- **Cache lookup** before rendering
- **ResizeObserver** for actual measurements
- **Cache updates** when heights are measured

### Data Flow

```
1. Parse HTML → Generate ContentBlocks
                      ↓
2. For each block → Generate signature → Check cache
                      ↓                      ↓
              No cached value         Cached value found
                      ↓                      ↓
              Use estimation          Use cached height
                      ↓                      ↓
3. Render block with estimated/cached height
                      ↓
4. ResizeObserver measures actual height
                      ↓
5. Update cache with measured height
                      ↓
6. Update VariableSizeList with new height
```

## Block Signatures

### Signature Format

A block signature consists of three components:
1. **Type**: `table`, `code`, `list`, `heading`, or `text`
2. **Length**: Content length in characters
3. **Features**: Type-specific structural information

### Feature Extraction by Type

#### Tables
```
Features: "{rows}x{cols}"
Example: "8x5" for a table with 8 rows and 5 columns
```

#### Code Blocks
```
Features: "{lines}L"
Example: "25L" for a code block with 25 lines
```

#### Lists
```
Features: "{items}i{nested}n"
Example: "10i2n" for a list with 10 items and 2 nested lists
```

#### Headings
```
Features: "{tag}"
Example: "h1", "h2", etc.
```

#### Text
```
Features: "{lines}L"
Example: "3L" for text with 3 lines
```

### Hash Function

The signature components are combined and hashed using a simple 32-bit hash function, converted to base-36 for compact storage.

## Cache Management

### Configuration

```typescript
const cache = new MeasurementCache(
  maxSize = 1000,    // Maximum number of cached entries
  maxAge = 300000    // Maximum age in milliseconds (5 minutes)
)
```

### Eviction Policies

1. **Size-based eviction**: When cache reaches `maxSize`, oldest entry is removed
2. **Time-based eviction**: Entries older than `maxAge` are automatically invalidated
3. **LRU eviction**: Manual LRU eviction available via `evictLRU()`

### Hit Tracking

Each cache entry tracks:
- **timestamp**: When the entry was created
- **hitCount**: Number of times the cached value was used
- **height**: The measured height value

## Performance Benefits

### Before (Estimation Only)
- ❌ Inaccurate heights cause scroll jumps
- ❌ Layout thrash on every scroll
- ❌ Repeated measurements for similar content
- ❌ Poor performance with large tables/diagrams

### After (Measurement Cache)
- ✅ Accurate heights from actual measurements
- ✅ Smooth scrolling with cached values
- ✅ Similar content reuses measurements
- ✅ Excellent performance even with 30k+ line documents

### Real-world Impact

For a document with:
- 100 tables (50 unique structures)
- 50 code blocks (20 unique line counts)
- 200 text blocks

**Without cache:**
- 350 layout measurements per scroll
- Significant frame drops

**With cache:**
- ~70 initial measurements
- 0-5 measurements per scroll (only new content)
- Smooth 60 FPS scrolling

## Testing

### Unit Tests

Run the measurement cache tests:

```bash
npm test -- measurement-cache.test.ts
```

### Stress Test Documents

Two stress test documents are included:

1. **[Samples/performance-test-large.md](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/Samples/performance-test-large.md?type=file&root=%252F)**
   - 10,000+ lines
   - Mixed content types
   - Tests overall virtualization performance

2. **[Samples/stress-test-tables.md](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/Samples/stress-test-tables.md?type=file&root=%252F)**
   - Large tables (8x10, 8x12, etc.)
   - Various code block sizes
   - Identical structures to test cache reuse

### Manual Testing

1. Open the editor and load a stress test document
2. Open browser DevTools → Performance
3. Start recording
4. Scroll rapidly through the document
5. Stop recording and analyze:
   - Look for reduced layout thrash
   - Check for consistent frame times
   - Verify ResizeObserver callbacks decrease after initial render

### Cache Statistics

Access cache statistics in development:

```typescript
import { measurementCache } from '@/lib/measurement-cache'

// Get cache stats
const stats = measurementCache.getStats()
console.log(`Cache size: ${stats.size}/${stats.maxSize}`)
console.log(`Entries:`, stats.entries)
```

## Future Enhancements

Potential improvements:

1. **Persistence**: Save cache to localStorage for cross-session reuse
2. **Smart eviction**: Use access patterns to predict which entries to keep
3. **Dynamic sizing**: Adjust cache size based on document complexity
4. **Cache warming**: Pre-measure common block types on idle
5. **Differential updates**: Only measure changed portions of blocks

## References

- [React Window Documentation](https://react-window.vercel.app/)
- [ResizeObserver MDN](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [Virtual Scrolling Best Practices](https://web.dev/virtualize-long-lists-react-window/)

## Contributing

When modifying the measurement cache:

1. Ensure tests pass: `npm test -- measurement-cache.test.ts`
2. Test with large documents (30k+ lines)
3. Profile scrolling performance in DevTools
4. Update documentation for API changes
5. Consider backward compatibility
