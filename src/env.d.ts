/// <reference types="vite/client" />

declare const __APP_BASE_URL__: string

interface ImportMetaEnv {
  readonly VITE_SPACETRACK_USERNAME: string
  readonly VITE_SPACETRACK_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 