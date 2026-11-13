import { defineConfig } from "vitest/config";

/**
 * 单测只覆盖 lib/ 与少数纯函数模块：它们不依赖 React Native 运行时，
 * 可以直接在 Node 环境跑，不需要 mock 原生模块。
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
