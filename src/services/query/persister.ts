import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

/** 缓存保留 24 小时，超过后按无缓存处理 */
export const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000;

/** 缓存结构版本；结构不兼容时递增，旧缓存会被整体丢弃 */
export const CACHE_BUSTER = "v1";

/** 查询缓存 key；与偏好存储的 skycast.* key 相互独立 */
export const QUERY_CACHE_KEY = "skycast-query-cache";

/** 只持久化 TanStack Query 缓存，不额外维护业务存储结构 */
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
});
