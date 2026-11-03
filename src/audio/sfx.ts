import { useSettingsStore } from '../store/settingsStore'

/** Synthesized sound effects: no audio files, everything is built with Web Audio. */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (useSettingsStore.getState().muted) return null
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

interface ToneOptions {
  freq: number
  to?: number
  start?: number
  duration: number
  type?: OscillatorType
  gain?: number
}

function tone(ac: AudioContext, { freq, to, start = 0, duration, type = 'sine', gain = 0.2 }: ToneOptions) {
  const t0 = ac.currentTime + start
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + duration)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

function noise(ac: AudioContext, { duration, start = 0, gain = 0.2, from = 800, to = 3000, q = 1 }: { duration: number; start?: number; gain?: number; from?: number; to?: number; q?: number }) {
  const t0 = ac.currentTime + start
  const length = Math.ceil(ac.sampleRate * duration)
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, t0)
  filter.frequency.exponentialRampToValueAtTime(to, t0 + duration)
  const amp = ac.createGain()
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + duration * 0.3)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  src.connect(filter).connect(amp).connect(ac.destination)
  src.start(t0)
  src.stop(t0 + duration)
}

let lastTick = 0

export const sfx = {
  /** Peg passing the pointer; louder and brighter when the wheel is fast. */
  tick(speed: number) {
    const ac = audio()
    if (!ac) return
    const now = performance.now()
    if (now - lastTick < 28) return
    lastTick = now
    const energy = Math.min(1, speed / 1500)
    noise(ac, { duration: 0.025, gain: 0.08 + energy * 0.14, from: 2500 + energy * 2000, to: 1800, q: 6 })
    tone(ac, { freq: 1300 + energy * 500, duration: 0.03, type: 'square', gain: 0.025 })
  },

  whoosh() {
    const ac = audio()
    if (!ac) return
    noise(ac, { duration: 0.5, gain: 0.18, from: 300, to: 2500, q: 0.8 })
  },

  land() {
    const ac = audio()
    if (!ac) return
    ;[784, 988, 1175].forEach((f, i) => tone(ac, { freq: f, start: i * 0.07, duration: 0.35, type: 'triangle', gain: 0.14 }))
  },

  select() {
    const ac = audio()
    if (!ac) return
    tone(ac, { freq: 660, to: 880, duration: 0.09, type: 'triangle', gain: 0.12 })
  },

  countdown() {
    const ac = audio()
    if (!ac) return
    tone(ac, { freq: 1046, duration: 0.07, type: 'square', gain: 0.05 })
  },

  correct() {
    const ac = audio()
    if (!ac) return
    ;[523, 659, 784, 1046].forEach((f, i) => tone(ac, { freq: f, start: i * 0.08, duration: 0.3, type: 'triangle', gain: 0.16 }))
    tone(ac, { freq: 2093, start: 0.32, duration: 0.5, type: 'sine', gain: 0.06 })
  },

  wrong() {
    const ac = audio()
    if (!ac) return
    tone(ac, { freq: 233, to: 110, duration: 0.5, type: 'sawtooth', gain: 0.09 })
    tone(ac, { freq: 220, to: 104, duration: 0.5, type: 'square', gain: 0.05 })
  },

  fanfare() {
    const ac = audio()
    if (!ac) return
    const notes: [number, number, number][] = [
      [523, 0, 0.15],
      [523, 0.16, 0.15],
      [523, 0.32, 0.15],
      [698, 0.48, 0.5],
      [880, 0.98, 0.25],
      [784, 1.24, 0.25],
      [1046, 1.5, 0.8],
    ]
    for (const [freq, start, duration] of notes) {
      tone(ac, { freq, start, duration, type: 'triangle', gain: 0.15 })
      tone(ac, { freq: freq / 2, start, duration, type: 'sine', gain: 0.08 })
    }
  },
}
