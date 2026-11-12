import { ZodError } from 'zod';

export type AppErrorCode =
  | 'network'
  | 'timeout'
  | 'http'
  | 'schema'
  | 'empty'
  | 'unknown';

interface AppErrorOptions {
  status?: number;
  cause?: unknown;
}

/**
 * 应用统一错误。对外只暴露稳定的 code，便于查询层决定是否重试；
 * 原始错误通过 cause 保留，排查时不会丢失现场。
 */
export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options.status;
    this.cause = options.cause;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** 判断 fetch 的中断错误；不依赖 DOMException，原生端也能识别 */
function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  return name === 'AbortError';
}

/** 把 zod 的 issue 路径拼成可读文本，便于定位是哪个字段不合法 */
function formatZodIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join('.') : '(root)';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

/**
 * 错误归一化顺序：AbortError -> timeout，TypeError -> network，
 * ZodError -> schema，其余归 unknown 并保留原始信息。
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (isAbortError(error)) {
    return new AppError('timeout', '请求超时（8 秒）', { cause: error });
  }

  if (error instanceof TypeError) {
    return new AppError('network', '网络请求失败', { cause: error });
  }

  if (error instanceof ZodError) {
    return new AppError('schema', `响应校验失败：${formatZodIssues(error)}`, {
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new AppError('unknown', error.message, { cause: error });
  }

  return new AppError('unknown', `未知错误：${String(error)}`, { cause: error });
}
