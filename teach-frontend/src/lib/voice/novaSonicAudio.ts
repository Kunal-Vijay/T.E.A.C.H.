/**
 * Audio plumbing for the Nova Sonic voice session.
 *
 * Nova Sonic's contract is fixed: it consumes 16 kHz mono PCM16 and emits 24 kHz
 * mono PCM16. Rather than resample by hand we open each AudioContext at the exact
 * rate we need and let the browser do it.
 */

export const NOVA_INPUT_SAMPLE_RATE = 16000
export const NOVA_OUTPUT_SAMPLE_RATE = 24000

const MIC_WORKLET_URL = '/nova-mic-processor.js'

export function isVoiceCaptureSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices?.getUserMedia !== undefined &&
    (window.AudioContext !== undefined ||
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !== undefined)
  )
}

function createAudioContext(sampleRate: number): AudioContext {
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new Ctor({ sampleRate })
}

/** Captures microphone audio and hands back 16 kHz PCM16 chunks. */
export class NovaMicCapture {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private worklet: AudioWorkletNode | null = null
  private levelAnalyser: AnalyserNode | null = null
  private levelBuffer: Uint8Array<ArrayBuffer> | null = null

  async start(onChunk: (chunk: ArrayBuffer) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    this.context = createAudioContext(NOVA_INPUT_SAMPLE_RATE)
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    await this.context.audioWorklet.addModule(MIC_WORKLET_URL)

    this.source = this.context.createMediaStreamSource(this.stream)
    this.worklet = new AudioWorkletNode(this.context, 'nova-mic-processor')
    this.worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      onChunk(event.data)
    }

    // Tapped purely to drive the "you're talking" meter in the UI.
    this.levelAnalyser = this.context.createAnalyser()
    this.levelAnalyser.fftSize = 512
    this.levelBuffer = new Uint8Array(new ArrayBuffer(this.levelAnalyser.frequencyBinCount))

    this.source.connect(this.worklet)
    this.source.connect(this.levelAnalyser)
    // Not connected to destination: we never want to echo the mic back at the student.
  }

  /** Current mic loudness in the range 0..1, for the level meter. */
  readLevel(): number {
    if (this.levelAnalyser === null || this.levelBuffer === null) {
      return 0
    }
    this.levelAnalyser.getByteFrequencyData(this.levelBuffer)
    let total = 0
    for (let index = 0; index < this.levelBuffer.length; index += 1) {
      total += this.levelBuffer[index]
    }
    return Math.min(1, total / this.levelBuffer.length / 128)
  }

  async stop(): Promise<void> {
    if (this.worklet !== null) {
      this.worklet.port.onmessage = null
      this.worklet.disconnect()
      this.worklet = null
    }
    this.source?.disconnect()
    this.source = null
    this.levelAnalyser?.disconnect()
    this.levelAnalyser = null
    this.levelBuffer = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (this.context !== null) {
      await this.context.close().catch(() => undefined)
      this.context = null
    }
  }
}

/**
 * Plays a stream of 24 kHz PCM16 chunks back to back.
 *
 * Chunks arrive faster than realtime, so each one is scheduled against a running
 * cursor rather than "now" — otherwise they overlap and the speech sounds garbled.
 */
export class NovaAudioPlayer {
  private context: AudioContext | null = null
  private playheadTime = 0
  private activeSources = new Set<AudioBufferSourceNode>()

  private ensureContext(): AudioContext {
    if (this.context === null) {
      this.context = createAudioContext(NOVA_OUTPUT_SAMPLE_RATE)
      this.playheadTime = this.context.currentTime
    }
    return this.context
  }

  async resume(): Promise<void> {
    const context = this.ensureContext()
    if (context.state === 'suspended') {
      await context.resume()
    }
  }

  /** Queue one base64-encoded PCM16 chunk. Returns true if it was scheduled. */
  enqueueBase64(base64: string): boolean {
    const context = this.ensureContext()
    const pcm = base64ToInt16(base64)
    if (pcm.length === 0) {
      return false
    }

    const buffer = context.createBuffer(1, pcm.length, NOVA_OUTPUT_SAMPLE_RATE)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < pcm.length; index += 1) {
      channel[index] = pcm[index] / 0x8000
    }

    const source = context.createBufferSource()
    source.buffer = buffer
    source.connect(context.destination)

    // A small lead keeps us ahead of the clock if the network hiccups.
    const startAt = Math.max(this.playheadTime, context.currentTime + 0.02)
    source.start(startAt)
    this.playheadTime = startAt + buffer.duration

    this.activeSources.add(source)
    source.onended = () => {
      this.activeSources.delete(source)
    }
    return true
  }

  /** True while queued audio is still scheduled to play. */
  get isSpeaking(): boolean {
    if (this.context === null) {
      return false
    }
    return this.playheadTime > this.context.currentTime + 0.05
  }

  /** Drop everything queued — used when the student interrupts. */
  flush(): void {
    this.activeSources.forEach((source) => {
      try {
        source.stop()
      } catch {
        // already stopped
      }
    })
    this.activeSources.clear()
    if (this.context !== null) {
      this.playheadTime = this.context.currentTime
    }
  }

  async close(): Promise<void> {
    this.flush()
    if (this.context !== null) {
      await this.context.close().catch(() => undefined)
      this.context = null
    }
  }
}

export function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  // Trim a trailing odd byte so the Int16Array view is always valid.
  const usableLength = bytes.length - (bytes.length % 2)
  return new Int16Array(bytes.buffer, 0, usableLength / 2)
}

/** Build the ws:// or wss:// URL for the understanding-check relay. */
export function buildUnderstandingCheckSocketUrl(params: {
  generationId: string
  topicId: string
  classroomSessionId?: string | null
}): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL ?? ''
  const httpBase = configuredBase !== '' ? configuredBase : window.location.origin
  const url = new URL('/api/v1/understanding-check/ws', httpBase)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('generation_id', params.generationId)
  url.searchParams.set('topic_id', params.topicId)
  if (params.classroomSessionId != null && params.classroomSessionId !== '') {
    url.searchParams.set('classroom_session_id', params.classroomSessionId)
  }
  return url.toString()
}
