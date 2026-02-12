/**
 * 静态资源 base URL，用于 GitHub Pages 子路径部署（https://username.github.io/urex/）
 * 由 vite.config.ts define 在构建时内联为 '/urex/'，确保部署产物中路径正确。
 */
export const BASE_URL = typeof __APP_BASE_URL__ !== 'undefined' ? __APP_BASE_URL__ : '/urex/'
