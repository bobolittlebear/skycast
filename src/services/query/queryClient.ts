import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { toAppError } from '../api/errors';
import { PERSIST_MAX_AGE } from './persister';

const STALE_TIME_MS = 10 * 60 * 1000;
// 与持久化窗口保持一致，避免查询在缓存过期前就被内存回收
const GC_TIME_MS = PERSIST_MAX_AGE;
const MAX_RETRIES = 2;
const MAX_RETRY_DELAY_MS = 4000;

/** 仅对可自愈的错误重试；4xx 和 schema/unknown 重试没有意义 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) {
    return false;
  }

  const appError = toAppError(error);

  switch (appError.code) {
    case 'network':
    case 'timeout':
      return true;
    case 'http':
      return !(
        appError.status !== undefined &&
        appError.status >= 400 &&
        appError.status < 500
      );
    default:
      return false;
  }
}

/** 1s、2s、4s 指数退避，封顶 4 秒 */
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * 2 ** attemptIndex, MAX_RETRY_DELAY_MS);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      gcTime: GC_TIME_MS,
      retry: shouldRetry,
      retryDelay,
      // 只有 Web 存在窗口焦点概念；移动端保持默认行为
      refetchOnWindowFocus: Platform.OS === 'web',
    },
  },
});
