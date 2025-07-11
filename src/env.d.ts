/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPACETRACK_USERNAME: string
  readonly VITE_SPACETRACK_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 