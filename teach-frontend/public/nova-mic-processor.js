/**
 * AudioWorklet that converts microphone audio into the PCM16 frames Nova Sonic expects.
 *
 * The AudioContext is created at 16 kHz by the caller, so the browser has already
 * resampled for us and this only has to convert Float32 [-1, 1] to signed 16-bit
 * little-endian and batch it into reasonably sized chunks.
 *
 * Lives in public/ so it can be loaded by URL via audioWorklet.addModule().
 */

const FRAMES_PER_MESSAGE = 1024

class NovaMicProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Int16Array(FRAMES_PER_MESSAGE)
    this.offset = 0
  }

  process(inputs) {
    const channels = inputs[0]
    if (!channels || channels.length === 0) {
      return true
    }
    const samples = channels[0]
    if (!samples) {
      return true
    }

    for (let index = 0; index < samples.length; index += 1) {
      const clamped = Math.max(-1, Math.min(1, samples[index]))
      // Asymmetric scaling: negative range is one step larger in two's complement.
      this.buffer[this.offset] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff
      this.offset += 1

      if (this.offset === FRAMES_PER_MESSAGE) {
        // Copy because the port transfer detaches the underlying buffer.
        const chunk = new Int16Array(this.buffer)
        this.port.postMessage(chunk.buffer, [chunk.buffer])
        this.offset = 0
      }
    }

    return true
  }
}

registerProcessor('nova-mic-processor', NovaMicProcessor)
