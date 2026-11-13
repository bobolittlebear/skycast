import { useQuery } from "@tanstack/react-query";
import { toAppError, type AppError } from '../../services/api/errors';
import { searchLocations } from '../../services/api/openMeteo/geocoding';
import { useSettings } from '../settings/SettingsContext';
import type { Location } from '../../types/location';

/** 少于两个字符的搜索没有实际意义 */
export const GEOCODE_MIN_QUERY_LENGTH = 2;
/** 搜索结果变化频率低，5 分钟内复用缓存 */
export const GEOCODE_STALE_TIME_MS = 5 * 60 * 1000;

export interface UseGeocodeSearchResult {
  /** 查询结果；未启用或请求失败时为空数组 */
  results: Location[];
  /** 是否正在请求；查询词不足最小长度时为 false */
  isLoading: boolean;
  /** 归一化后的请求错误；未请求或成功时为 null */
  error: AppError | null;
  /** 去掉首尾空格后的查询词，便于 UI 判断当前结果对应哪次输入 */
  effectiveQuery: string;
}

/**
 * 地点搜索：按传入的查询词立即请求，少于 2 个字符不发起。
 * 防抖由调用方负责（搜索框需要先本地响应输入再上报），
 * 结果按「查询词 + 语言」缓存 5 分钟，反复输入同一关键词时复用。
 */
export function useGeocodeSearch(query: string): UseGeocodeSearchResult {
  const { lang } = useSettings();
  const keyword = query.trim();
  const enabled = keyword.length >= GEOCODE_MIN_QUERY_LENGTH;

  const searchQuery = useQuery({
    queryKey: ["geocode", keyword, lang],
    queryFn: () => searchLocations(keyword, lang),
    staleTime: GEOCODE_STALE_TIME_MS,
    enabled,
  });

  return {
    results: searchQuery.data ?? [],
    isLoading: enabled && searchQuery.isFetching,
    error: searchQuery.error ? toAppError(searchQuery.error) : null,
    effectiveQuery: keyword,
  };
}
