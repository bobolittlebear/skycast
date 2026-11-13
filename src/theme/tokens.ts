export type Spacing = {
  xxs: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
};

export type BorderRadius = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
};

export type Typography = {
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  lineHeight: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
};

export type Color = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  shadow: string;
  error: string;
  onError: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  info: string;
  onInfo: string;
};

export type BrandColors = {
  primary: Color["primary"];
  primaryVariant: string;
  secondary: string;
  accent: string;
  background: Color["background"];
  surface: Color["surface"];
  text: Color["onBackground"];
  textVariant: Color["onSurfaceVariant"];
  border: Color["outline"];
  success: Color["success"];
  error: Color["error"];
  warning: Color["warning"];
  info: Color["info"];
};

export const spacing: Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius: BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

/** 最小可点触控尺寸；无障碍要求下所有交互元素都不应小于该值 */
export const MIN_TOUCH_TARGET = 44;

export const typography: Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  lineHeight: {
    sm: 1.2,
    md: 1.4,
    lg: 1.5,
    xl: 1.6,
  },
};

/** 玻璃卡片的颜色集合；浅色与深色主题各一套 */
export type GlassPalette = {
  backgroundColor: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
};

export type GlassTokens = {
  light: GlassPalette;
  dark: GlassPalette;
};

/** 三段渐变，顺序为顶部 -> 底部 */
export type WeatherGradient = readonly [string, string, string];

export type WeatherGradientTokens = {
  dayClear: WeatherGradient;
  nightClear: WeatherGradient;
  dayCloudy: WeatherGradient;
  nightCloudy: WeatherGradient;
};

export const glass: GlassTokens = {
  light: {
    backgroundColor: "rgba(255, 255, 255, 0.30)",
    borderColor: "rgba(255, 255, 255, 0.50)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.78)",
  },
  dark: {
    backgroundColor: "rgba(0, 0, 0, 0.24)",
    borderColor: "rgba(255, 255, 255, 0.22)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.72)",
  },
};

export const weatherGradient: WeatherGradientTokens = {
  dayClear: ["#1B6CD6", "#3F8BE8", "#8FC4F4"],
  nightClear: ["#08152F", "#142A52", "#25406E"],
  dayCloudy: ["#51677E", "#748A9F", "#9FB0C0"],
  nightCloudy: ["#171F2B", "#263243", "#3A4A5E"],
};

export const brandColors: BrandColors = {
  primary: "#2F80ED",
  primaryVariant: "#5699FF",
  secondary: "#7C3AED",
  accent: "#EC4899",
  background: "#FFFFFF",
  surface: "#F5F5F5",
  text: "#121212",
  textVariant: "#666666",
  border: "#E0E0E0",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};
