export type Lang = 'zh-Hans' | 'zh-Hant' | 'en';

export function normalizeLocale(locale: string): Lang {
  const lowerLocale = locale.toLowerCase();

  if (lowerLocale.startsWith('zh')) {
    if (lowerLocale.includes('hant') || lowerLocale.includes('tw') ||
        lowerLocale.includes('hk') || lowerLocale.includes('mo')) {
      return 'zh-Hant';
    }
    return 'zh-Hans';
  }

  return 'en';
}

export function isLang(value: string): value is Lang {
  return ['zh-Hans', 'zh-Hant', 'en'].includes(value);
}