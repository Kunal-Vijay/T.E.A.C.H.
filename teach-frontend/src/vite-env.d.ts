/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  /** Set to "true" to render InteractiveAvatar instead of the mentor GIF (USE_INTERACTIVE_AVATAR). */
  readonly VITE_USE_INTERACTIVE_AVATAR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.svg' {
  const src: string
  export default src
}
