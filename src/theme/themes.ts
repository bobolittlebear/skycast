import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { Color } from './tokens';

interface Theme {
  colors: any;
  roundness: number;
}

const createCustomTheme = (
  baseTheme: any,
  colors: Partial<Color>
): Theme => ({
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: colors.primary || '#2F80ED',
    onPrimary: colors.onPrimary || '#FFFFFF',
    primaryContainer: colors.primaryContainer || '#DBEAFE',
    onPrimaryContainer: colors.onPrimaryContainer || '#1E40AF',
    secondary: colors.secondary || '#7C3AED',
    onSecondary: colors.onSecondary || '#FFFFFF',
    secondaryContainer: colors.secondaryContainer || '#EDE9FE',
    onSecondaryContainer: colors.onSecondaryContainer || '#4C1D95',
    background: colors.background || baseTheme.colors.background,
    onBackground: colors.onBackground || baseTheme.colors.onBackground,
    surface: colors.surface || baseTheme.colors.surface,
    onSurface: colors.onSurface || baseTheme.colors.onSurface,
    surfaceVariant: colors.surfaceVariant || baseTheme.colors.surfaceVariant,
    onSurfaceVariant: colors.onSurfaceVariant || baseTheme.colors.onSurfaceVariant,
    outline: colors.outline || baseTheme.colors.outline,
    shadow: colors.shadow || '#000000',
    error: colors.error || '#EF4444',
    onError: colors.onError || '#FFFFFF',
    success: colors.success || '#10B981',
    onSuccess: colors.onSuccess || '#FFFFFF',
    warning: colors.warning || '#F59E0B',
    onWarning: colors.onWarning || '#FFFFFF',
    info: colors.info || '#3B82F6',
    onInfo: colors.onInfo || '#FFFFFF',
  },
  roundness: 8,
});

export const lightTheme = createCustomTheme(
  MD3LightTheme,
  {
    primary: '#2F80ED',
    onPrimary: '#FFFFFF',
    primaryContainer: '#DBEAFE',
    onPrimaryContainer: '#1E40AF',
    background: '#FFFFFF',
    onBackground: '#121212',
    surface: '#F5F5F5',
    onSurface: '#121212',
    surfaceVariant: '#E5E7EB',
    onSurfaceVariant: '#4B5563',
    outline: '#D1D5DB',
    shadow: 'rgba(0, 0, 0, 0.1)',
    error: '#EF4444',
    onError: '#FFFFFF',
    success: '#10B981',
    onSuccess: '#FFFFFF',
    warning: '#F59E0B',
    onWarning: '#FFFFFF',
    info: '#3B82F6',
    onInfo: '#FFFFFF',
  }
);

export const darkTheme = createCustomTheme(
  MD3DarkTheme,
  {
    primary: '#5699FF',
    onPrimary: '#FFFFFF',
    primaryContainer: '#1E40AF',
    onPrimaryContainer: '#DBEAFE',
    background: '#121212',
    onBackground: '#FFFFFF',
    surface: '#1E293B',
    onSurface: '#F1F5F9',
    surfaceVariant: '#334155',
    onSurfaceVariant: '#CBD5E1',
    outline: '#475569',
    shadow: 'rgba(0, 0, 0, 0.5)',
    error: '#F87171',
    onError: '#1F2937',
    success: '#34D399',
    onSuccess: '#1F2937',
    warning: '#FCD34D',
    onWarning: '#1F2937',
    info: '#60A5FA',
    onInfo: '#1F2937',
  }
);