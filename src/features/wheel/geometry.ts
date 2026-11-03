/** Wheel geometry in SVG user units; the wheel is centered on (0, 0). */
export const WHEEL = {
  view: 260,
  segmentRadius: 208,
  pinRadius: 212,
  rimInner: 214,
  rimOuter: 248,
  bulbRadius: 231,
  bulbs: 28,
  hubRadius: 52,
} as const

/** Positive modulo, so results stay in [0, m). */
export const mod = (n: number, m: number) => ((n % m) + m) % m

/** Point at `deg` degrees clockwise from 12 o'clock. */
export function polar(radius: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [radius * Math.cos(rad), radius * Math.sin(rad)]
}

/** Pie slice for segment `index` of `count`, starting at 12 o'clock and going clockwise. */
export function slicePath(index: number, count: number, radius: number): string {
  const step = 360 / count
  const [x0, y0] = polar(radius, index * step)
  const [x1, y1] = polar(radius, (index + 1) * step)
  const large = step > 180 ? 1 : 0
  return `M0 0 L${x0.toFixed(3)} ${y0.toFixed(3)} A${radius} ${radius} 0 ${large} 1 ${x1.toFixed(3)} ${y1.toFixed(3)}Z`
}

/**
 * Final wheel rotation (degrees, clockwise) that leaves segment `index` under the
 * top pointer after at least `turns` full turns from `current`.
 * `jitter` in [-0.5, 0.5] moves the landing point inside the segment.
 */
export function landingRotation(current: number, index: number, count: number, turns: number, jitter: number): number {
  const step = 360 / count
  const desired = -(index + 0.5) * step + jitter * 0.7 * step
  const base = current + turns * 360
  return base + mod(desired - base, 360)
}

/** Segment under the top pointer for a given rotation. */
export function segmentAtPointer(rotation: number, count: number): number {
  const step = 360 / count
  return Math.floor(mod(-rotation, 360) / step) % count
}
