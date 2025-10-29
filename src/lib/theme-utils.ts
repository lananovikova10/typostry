import { cookies } from "next/headers"

export type Theme =
  | "light"
  | "dark"
  | "system"
  | "high-contrast-light"
  | "high-contrast-dark"
  | "acid"

export const THEME_COOKIE_NAME = "typostry-theme"

/**
 * Get the theme from cookies on the server side
 * This helps prevent FOUC by setting the correct theme class before hydration
 */
export async function getServerSideTheme(): Promise<Theme> {
  try {
    const cookieStore = await cookies()
    const themeCookie = cookieStore.get(THEME_COOKIE_NAME)

    if (themeCookie?.value && isValidTheme(themeCookie.value)) {
      return themeCookie.value as Theme
    }

    return "system"
  } catch (error) {
    // Fallback to system if cookies are not available
    return "system"
  }
}

/**
 * Check if a string is a valid theme value
 */
export function isValidTheme(theme: string): theme is Theme {
  return [
    "light",
    "dark",
    "system",
    "high-contrast-light",
    "high-contrast-dark",
    "acid"
  ].includes(theme)
}

/**
 * Generate the script that sets the theme class before hydration
 * This prevents FOUC by applying the theme immediately
 */
export function getThemeScript(serverTheme: Theme = "system") {
  return `
    (function() {
      try {
        // Try to get theme from localStorage first
        var storedTheme = localStorage.getItem('${THEME_COOKIE_NAME}');
        var theme = storedTheme || '${serverTheme}';

        // Validate theme
        var validThemes = ['light', 'dark', 'system', 'high-contrast-light', 'high-contrast-dark', 'acid'];
        if (!validThemes.includes(theme)) {
          theme = 'system';
        }

        // Resolve system theme
        var resolvedTheme = theme;
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Apply theme class to html element
        document.documentElement.classList.remove(...validThemes);
        document.documentElement.classList.add(resolvedTheme);

        // Set theme attribute for next-themes compatibility
        document.documentElement.setAttribute('data-theme', theme);

        // Sync with cookie if different
        if (storedTheme !== theme) {
          document.cookie = '${THEME_COOKIE_NAME}=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
        }
      } catch (e) {
        // Fallback: apply light theme
        document.documentElement.classList.add('light');
      }
    })();
  `;
}