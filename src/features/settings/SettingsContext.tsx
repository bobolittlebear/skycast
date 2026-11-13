import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type JSX,
  type ReactNode,
} from 'react';
import { Platform, useColorScheme } from 'react-native';
import { getSystemLang, i18n } from '../../i18n';
import { isLang, type Lang } from '../../i18n/language';
import { STORAGE_KEYS, getJson, setJson } from '../../services/storage/storage';
import { darkTheme, lightTheme } from '../../theme/themes';

export type ThemeMode = 'system' | 'light' | 'dark';

/** 持久化到本地的偏好结构 */
interface PersistedSettings {
  lang: Lang;
  themeMode: ThemeMode;
}

interface SettingsContextValue {
  lang: Lang;
  themeMode: ThemeMode;
  theme: typeof lightTheme;
  ready: boolean;
  setLang: (lang: Lang) => void;
  setThemeMode: (themeMode: ThemeMode) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

/** 运行时校验主题模式，防止本地脏数据把非法值带进状态 */
export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

async function persistSettings(settings: PersistedSettings): Promise<void> {
  await setJson(STORAGE_KEYS.settings, settings);
}

/**
 * 设置 Provider：首屏等待本地偏好读取完成（ready）后再渲染，避免语言与主题闪烁；
 * 语言、主题变更后立即写回本地。
 */
export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const systemScheme = useColorScheme();
  // 首次启动：语言跟随系统，主题跟随系统
  const [lang, setLangState] = useState<Lang>(() => getSystemLang());
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  // 异步读取本地偏好；读完才置 ready，避免先渲染系统默认值再闪烁切换
  useEffect(() => {
    let cancelled = false;

    async function hydrate(): Promise<void> {
      const saved = await getJson<Partial<PersistedSettings>>(STORAGE_KEYS.settings);
      if (cancelled) {
        return;
      }

      if (saved && typeof saved.lang === 'string' && isLang(saved.lang)) {
        setLangState(saved.lang);
        if (i18n.language !== saved.lang) {
          void i18n.changeLanguage(saved.lang);
        }
      }

      if (saved && isThemeMode(saved.themeMode)) {
        setThemeModeState(saved.themeMode);
      }

      setReady(true);
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  // Web 端同步 html lang，方便浏览器与读屏软件识别页面语言
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback(
    (nextLang: Lang) => {
      setLangState(nextLang);
      void i18n.changeLanguage(nextLang);
      void persistSettings({ lang: nextLang, themeMode });
    },
    [themeMode]
  );

  const setThemeMode = useCallback(
    (nextThemeMode: ThemeMode) => {
      setThemeModeState(nextThemeMode);
      void persistSettings({ lang, themeMode: nextThemeMode });
    },
    [lang]
  );

  // system 模式跟随系统外观，light / dark 为手动锁定
  const theme = useMemo(() => {
    const resolved =
      themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
    return resolved === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemScheme]);

  const value = useMemo<SettingsContextValue>(
    () => ({ lang, themeMode, theme, ready, setLang, setThemeMode }),
    [lang, themeMode, theme, ready, setLang, setThemeMode]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/**
 * 读取语言、主题与更新方法；在 Provider 外调用会抛错。
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings 必须在 SettingsProvider 内使用');
  }
  return context;
}
