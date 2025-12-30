import { ChatTheme, ChatThemeWithDefaults } from './types';
import { defaultTheme } from './defaultTheme';

export * from './types';
export { defaultTheme };

/**
 * Merges user-provided theme with default theme
 */
export function mergeTheme(userTheme?: ChatTheme): ChatThemeWithDefaults {
  return {
    ...defaultTheme,
    ...userTheme,
  };
}
