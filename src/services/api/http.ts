import { AppError, toAppError } from './errors';

const REQUEST_TIMEOUT_MS = 8000;

/**
 * 统一的 JSON 请求入口。
 * - 8 秒超时，超时归一为 timeout
 * - 非 2xx 归一为 http，并保留状态码
 * - JSON 解析失败归一为 schema
 * - 返回值保持 unknown，由调用方用 zod 做边界校验
 */
export async function fetchJson(
  url: string,
  options: RequestInit = {}
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response: Response;

    try {
      response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      // fetch 只会在网络层失败或主动中断时抛错，这里统一交给 toAppError 分类
      throw toAppError(error);
    }

    if (!response.ok) {
      throw new AppError(
        'http',
        `HTTP ${response.status} ${response.statusText}`.trim(),
        { status: response.status }
      );
    }

    try {
      return (await response.json()) as unknown;
    } catch (error) {
      throw new AppError('schema', '响应不是合法的 JSON', { cause: error });
    }
  } finally {
    clearTimeout(timer);
  }
}
