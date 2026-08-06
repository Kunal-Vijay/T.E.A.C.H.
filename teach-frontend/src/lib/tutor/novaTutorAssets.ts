/** Public Nova tutor assets — idle PNG + speaking GIF (480×480). */
export const NOVA_TUTOR_IDLE_SRC = '/image-from-rawpixel-id-12165579-png.png'
export const NOVA_TUTOR_SPEAKING_SRC = '/video-from-rawpixel-id-17246652-gif.gif'

/** Intrinsic asset dimensions — keeps PNG/GIF footprint identical (no CLS). */
export const NOVA_TUTOR_INTRINSIC_WIDTH = 480
export const NOVA_TUTOR_INTRINSIC_HEIGHT = 480

const CACHE_NAME = 'nova-tutor-media-v1'

type AssetStatus = 'idle' | 'loading' | 'ready' | 'error'

interface CachedAsset {
  image: HTMLImageElement
  status: AssetStatus
  promise: Promise<void> | null
}

const assetCache = new Map<string, CachedAsset>()
const readyListeners = new Map<string, Set<() => void>>()

let speakingPreloadScheduled = false

function resolveAssetUrl(src: string): string {
  if (typeof window === 'undefined') {
    return src
  }
  return new URL(src, window.location.href).href
}

function getCachedAsset(src: string): CachedAsset {
  let entry = assetCache.get(src)
  if (entry === undefined) {
    const image = new Image()
    image.decoding = 'async'
    entry = { image, status: 'idle', promise: null }
    assetCache.set(src, entry)
  }
  return entry
}

function notifyReady(src: string): void {
  readyListeners.get(src)?.forEach((listener) => {
    listener()
  })
}

function markReady(entry: CachedAsset, src: string): void {
  entry.status = 'ready'
  notifyReady(src)
}

function loadViaImageElement(entry: CachedAsset, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const resolved = resolveAssetUrl(src)

    const finish = () => {
      markReady(entry, src)
      resolve()
    }

    const fail = () => {
      entry.status = 'error'
      entry.promise = null
      reject(new Error(`Nova tutor asset failed to load: ${src}`))
    }

    entry.image.addEventListener('load', finish, { once: true })
    entry.image.addEventListener('error', fail, { once: true })

    if (entry.image.src === resolved && entry.image.complete && entry.image.naturalWidth > 0) {
      finish()
      return
    }

    entry.image.src = src
  })
}

/** Optional Cache API layer — avoids repeat network fetches across sessions. */
async function warmCacheStorage(src: string): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cache = await caches.open(CACHE_NAME)
    const existing = await cache.match(src)
    if (existing !== undefined) {
      return
    }

    const response = await fetch(src, { cache: 'force-cache' })
    if (response.ok) {
      await cache.put(src, response.clone())
    }
  } catch {
    /* Cache API is best-effort — Image preload remains the source of truth. */
  }
}

function loadAsset(src: string): Promise<void> {
  const entry = getCachedAsset(src)

  if (entry.status === 'ready') {
    return Promise.resolve()
  }

  if (entry.promise !== null) {
    return entry.promise
  }

  entry.status = 'loading'
  entry.promise = (async () => {
    await warmCacheStorage(src)
    await loadViaImageElement(entry, src)
  })()

  return entry.promise
}

/** Eager idle PNG preload — call as early as possible (main entry). */
export function preloadNovaTutorIdle(): Promise<void> {
  return loadAsset(NOVA_TUTOR_IDLE_SRC)
}

/** Speaking GIF preload — heavy asset, load once and reuse from memory. */
export function preloadNovaTutorSpeaking(): Promise<void> {
  return loadAsset(NOVA_TUTOR_SPEAKING_SRC)
}

/** Defer GIF download until after first paint / idle time. */
export function scheduleNovaTutorSpeakingPreload(): void {
  if (speakingPreloadScheduled || typeof window === 'undefined') {
    return
  }
  speakingPreloadScheduled = true

  const run = () => {
    void preloadNovaTutorSpeaking()
  }

  const scheduleAfterPaint = () => {
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    }

    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(run, { timeout: 2500 })
      return
    }

    win.setTimeout(run, 1200)
  }

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(scheduleAfterPaint)
    return
  }

  scheduleAfterPaint()
}

export function isNovaTutorAssetReady(src: string): boolean {
  return assetCache.get(src)?.status === 'ready'
}

/** Subscribe to a single asset becoming ready (for useSyncExternalStore). */
export function subscribeNovaTutorAssetReady(src: string, onStoreChange: () => void): () => void {
  let listeners = readyListeners.get(src)
  if (listeners === undefined) {
    listeners = new Set()
    readyListeners.set(src, listeners)
  }

  listeners.add(onStoreChange)

  if (isNovaTutorAssetReady(src)) {
    onStoreChange()
  }

  return () => {
    listeners?.delete(onStoreChange)
  }
}

