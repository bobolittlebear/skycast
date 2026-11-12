import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { normalizeLocale, type Lang } from './language';
import zhHans from './zh-Hans';
import zhHant from './zh-Hant';
import en from './en';

const resources = {
  'zh-Hans': { translation: zhHans },
  'zh-Hant': { translation: zhHant },
  en: { translation: en },
};

const supportedLngs: Lang[] = ['zh-Hans', 'zh-Hant', 'en'];

/** 读取系统语言并归一为受支持的语言 */
export function getSystemLang(): Lang {
  return normalizeLocale(getLocales()[0]?.languageTag ?? 'en');
}

/**
 * 初始化 i18next（只会真正初始化一次）。
 * 已初始化时若有不同的目标语言，直接切换，避免重复 init 触发警告。
 * 必须挂载 initReactI18next，否则 useTranslation 不会随语言变化重渲染。
 */
export function initI18n(initialLanguage?: string): typeof i18next {
  const lng = normalizeLocale(initialLanguage ?? getLocales()[0]?.languageTag ?? 'en');

  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng,
      supportedLngs,
      load: 'currentOnly',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
  } else if (i18next.language !== lng) {
    void i18next.changeLanguage(lng);
  }

  return i18next;
}

/** 模块加载时即以系统语言初始化，保证首次渲染就有可用文案 */
export const i18n = initI18n();

export default i18n;
