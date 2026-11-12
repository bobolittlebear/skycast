import AsyncStorage from '@react-native-async-storage/async-storage';

/** 所有存储 key 的统一前缀，避免与其他模块冲突 */
const STORAGE_PREFIX = 'skycast.';

/** 存储 key 常量：settings 保存语言与主题偏好 */
export const STORAGE_KEYS = {
  settings: `${STORAGE_PREFIX}settings`,
} as const;

/** 统一补全前缀，传入完整 key 时不会重复添加 */
function withPrefix(key: string): string {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

/** 读取字符串；key 不存在或读取失败时返回 null */
export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(withPrefix(key));
  } catch {
    return null;
  }
}

/** 写入字符串；写入失败时静默忽略，不阻塞主流程 */
export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(withPrefix(key), value);
  } catch {
    // 偏好写入失败不影响当前会话使用
  }
}

/** 读取 JSON；解析失败、key 不存在或读取失败时返回 null，不抛错 */
export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await getString(key);
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 写入 JSON；序列化或写入失败时静默忽略 */
export async function setJson<T>(key: string, value: T): Promise<void> {
  try {
    await setString(key, JSON.stringify(value));
  } catch {
    // JSON.stringify 在正常偏好数据上不会失败，兜底避免抛错
  }
}

/** 删除某个 key；删除失败时静默忽略 */
export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(withPrefix(key));
  } catch {
    // 删除失败不阻塞主流程
  }
}
