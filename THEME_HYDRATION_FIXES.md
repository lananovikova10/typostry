# Theme Hydration Mismatch Fixes

## Issues Fixed

### 1. useTheme() Returns Undefined During SSR
**Problem**: The `useTheme()` hook from next-themes returns undefined during server-side rendering, causing hydration errors when components try to render theme-dependent content.

**Solution**:
- Created `useThemeSafe()` hook that properly handles the mounting state
- Returns undefined values during hydration to prevent mismatches
- Only returns actual theme values after client-side hydration is complete

### 2. Flash of Unstyled Content (FOUC)
**Problem**: Users see a brief flash of the wrong theme (usually light theme) before the correct theme is applied.

**Solution**:
- Added inline script in `layout.tsx` that runs before hydration
- Script reads theme from localStorage and applies it immediately to `document.documentElement`
- Prevents FOUC by setting correct theme class before React hydration

### 3. Server-Side Theme Detection
**Problem**: No server-side awareness of user's theme preference, leading to hydration mismatches.

**Solution**:
- Created `getServerSideTheme()` function to read theme from cookies
- Added `getThemeScript()` to generate optimized inline scripts
- Server and client now sync theme state properly

## Files Modified

### Core Theme Components
- **[src/components/theme-provider.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/components/theme-provider.tsx?type=file&root=%252F)**: Added mounting state and suppressHydrationWarning
- **[src/components/mode-toggle.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/components/mode-toggle.tsx?type=file&root=%252F)**: Refactored to use safe theme hooks, added loading state
- **[src/app/layout.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/app/layout.tsx?type=file&root=%252F)**: Added theme script and suppressHydrationWarning attributes

### New Utility Files
- **[src/lib/theme-utils.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/lib/theme-utils.ts?type=file&root=%252F)**: Server-side theme detection and script generation
- **[src/hooks/use-theme-safe.ts](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/hooks/use-theme-safe.ts?type=file&root=%252F)**: Safe theme hooks with proper hydration handling
- **[src/components/theme-aware.tsx](fleet-file://hgco6mma04bqlg75j4ic/Users/Svetlana.Novikova/typostry/src/components/theme-aware.tsx?type=file&root=%252F)**: Components for theme-dependent rendering

## Key Implementation Details

### 1. Mounting Strategy
```typescript
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <LoadingState />
}
```

### 2. suppressHydrationWarning Usage
Applied to elements that may differ between server and client:
- Theme-dependent icons
- Dynamic content based on theme state
- Root HTML elements

### 3. Theme Script Optimization
```typescript
export function getThemeScript(serverTheme: Theme = "system") {
  return `
    (function() {
      try {
        var storedTheme = localStorage.getItem('typostry-theme');
        var theme = storedTheme || '${serverTheme}';
        // ... theme resolution logic
        document.documentElement.classList.add(resolvedTheme);
      } catch (e) {
        document.documentElement.classList.add('light');
      }
    })();
  `;
}
```

## Usage Examples

### Safe Theme Hook
```typescript
import { useThemeSafe } from "@/hooks/use-theme-safe"

function MyComponent() {
  const { theme, mounted } = useThemeSafe()

  if (!mounted) {
    return <Skeleton />
  }

  return <div>Current theme: {theme}</div>
}
```

### Theme-Aware Component
```typescript
import { ThemeAware } from "@/components/theme-aware"

function App() {
  return (
    <ThemeAware fallback={<Loading />}>
      {(themeInfo) => (
        <div>
          {themeInfo.isDark ? <DarkIcon /> : <LightIcon />}
        </div>
      )}
    </ThemeAware>
  )
}
```

### Conditional Theme Rendering
```typescript
import { ConditionalTheme } from "@/components/theme-aware"

function SpecialFeature() {
  return (
    <ConditionalTheme when="isHighContrast" fallback={<DefaultView />}>
      <HighContrastView />
    </ConditionalTheme>
  )
}
```

## Testing the Fix

To verify the hydration issues are resolved:

1. **Check Browser Console**: No hydration mismatch warnings
2. **Test Theme Switching**: No flash of wrong theme on page load
3. **SSR Verification**: View page source shows correct initial theme class
4. **Performance**: No layout shifts during theme loading

## Migration Guide

### For Existing Components Using useTheme()

**Before:**
```typescript
import { useTheme } from "next-themes"

function Component() {
  const { theme } = useTheme()
  return <div>Theme: {theme}</div> // May cause hydration mismatch
}
```

**After:**
```typescript
import { useThemeSafe } from "@/hooks/use-theme-safe"

function Component() {
  const { theme, mounted } = useThemeSafe()

  if (!mounted) {
    return <div>Loading...</div>
  }

  return <div>Theme: {theme}</div>
}
```

### For Components Needing Theme State

**Before:**
```typescript
function ThemeIcon() {
  const { theme } = useTheme()
  return theme === 'dark' ? <MoonIcon /> : <SunIcon />
}
```

**After:**
```typescript
import { useIsTheme } from "@/hooks/use-theme-safe"

function ThemeIcon() {
  const { isDark, mounted } = useIsTheme()

  if (!mounted) {
    return <SunIcon /> // Fallback icon
  }

  return isDark ? <MoonIcon /> : <SunIcon />
}
```

## Benefits

1. **No More Hydration Errors**: Proper server/client state synchronization
2. **Eliminated FOUC**: Theme applied before React hydration
3. **Better Performance**: Reduced layout shifts and rendering delays
4. **Type Safety**: Strong TypeScript types for theme states
5. **Developer Experience**: Clear patterns for theme-dependent components

## Supported Themes

The implementation supports all theme variants:
- `light`
- `dark`
- `system`
- `high-contrast-light`
- `high-contrast-dark`
- `acid`