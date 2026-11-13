export type Lang = 'zh-Hans' | 'zh-Hant' | 'en';

/** 把系统 locale 归一到三种支持的语言；未匹配时返回英文 */
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

/** 运行时校验语言代码，防止本地脏数据进入状态 */
export function isLang(value: string): value is Lang {
  return ['zh-Hans', 'zh-Hant', 'en'].includes(value);
}