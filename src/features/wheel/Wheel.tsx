import confetti from 'canvas-confetti'
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  useVelocity,
  type AnimationPlaybackControls,
} from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Category, WheelSegment } from '../../domain/types'
import { WHEEL, landingRotation, polar, slicePath } from './geometry'
import { difficultyBadge, readableOn, shade } from './labels'

export interface WheelProps {
  segments: WheelSegment[]
  categories: Category[]
  /** Changes on every spin; the wheel animates once per new value. */
  spinId: number | null
  /** Segment chosen by the game logic before the animation starts. */
  targetIndex: number | null
  /** True while the player may spin (button and flick enabled). */
  canSpin: boolean
  onSpinRequest: () => void
  onSpinEnd: () => void
  onTick?: (speed: number) => void
  /** Identifies the current turn so a fresh wheel animates in. */
  turnKey: string
}

type Mode = 'idle' | 'spinning' | 'won'

const GOLD = '#f1c25e'

export function Wheel({ segments, categories, spinId, targetIndex, canSpin, onSpinRequest, onSpinEnd, onTick, turnKey }: WheelProps) {
  const uid = useId().replace(/:/g, '')
  const reduced = useReducedMotion() ?? false
  const svgRef = useRef<SVGSVGElement>(null)
  const rotation = useMotionValue(0)
  const pointerAngle = useMotionValue(0)
  const velocity = useVelocity(rotation)
  const blur = useTransform(velocity, (v) => (reduced ? 'none' : `blur(${Math.min(Math.abs(v) / 900, 2.6).toFixed(2)}px)`))
  const [mode, setMode] = useState<Mode>('idle')
  const strength = useRef(5)
  const count = segments.length
  const step = count ? 360 / count : 360

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Pins crossing the pointer: tick sound and a kick of the flapper.
  const lastPin = useRef<number | null>(null)
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  useMotionValueEvent(rotation, 'change', (value) => {
    const pin = Math.floor(value / step)
    if (lastPin.current === null) {
      lastPin.current = pin
      return
    }
    if (pin === lastPin.current) return
    lastPin.current = pin
    const speed = Math.abs(rotation.getVelocity())
    onTickRef.current?.(speed)
    if (!reduced) {
      const kick = -Math.min(30, 8 + speed / 50)
      animate(pointerAngle, 0, { type: 'spring', stiffness: 900, damping: 16, velocity: kick * 40, from: kick })
    }
  })

  // The spin itself: wind back, launch, decelerate past the target and settle on it.
  const onSpinEndRef = useRef(onSpinEnd)
  onSpinEndRef.current = onSpinEnd
  useEffect(() => {
    if (spinId === null || targetIndex === null || count === 0) return
    let cancelled = false
    let controls: AnimationPlaybackControls | null = null
    let endTimer: ReturnType<typeof setTimeout> | undefined
    const play = (target: number, options: Parameters<typeof animate>[2]) => {
      controls = animate(rotation, target, options as never)
      return controls
    }

    const run = async () => {
      setMode('spinning')
      const jitter = ((spinId % 997) / 997) - 0.5
      const start = rotation.get()
      const turns = reduced ? 1 : strength.current
      const final = landingRotation(start, targetIndex, count, turns, jitter)
      if (!reduced) {
        await play(start - 16, { duration: 0.35, ease: [0.3, 0, 0.4, 1] })
        if (cancelled) return
        const overshoot = Math.min(step * 0.25, 4)
        await play(final + overshoot, { duration: 4.6 + turns * 0.18, ease: [0.12, 0.62, 0.1, 1] })
        if (cancelled) return
        await play(final, { type: 'spring', stiffness: 220, damping: 11 })
      } else {
        await play(final, { duration: 1.1, ease: 'easeOut' })
      }
      if (cancelled) return
      setMode('won')
      celebrate(svgRef.current, segmentColor(segments[targetIndex], categoryById))
      endTimer = setTimeout(() => {
        if (!cancelled) onSpinEndRef.current()
      }, reduced ? 400 : 1100)
    }
    void run()
    return () => {
      cancelled = true
      controls?.stop()
      clearTimeout(endTimer)
    }
    // Only a new spin restarts the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId])

  // A fresh wheel for a new turn returns the lights to idle.
  useEffect(() => {
    if (spinId === null) setMode('idle')
  }, [turnKey, spinId])

  // Flick to spin: drag the wheel and release with some speed.
  const drag = useRef<{ startAngle: number; startRotation: number; samples: { t: number; r: number }[] } | null>(null)
  const angleOf = (e: ReactPointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return (Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2)) * 180) / Math.PI
  }
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!canSpin) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { startAngle: angleOf(e), startRotation: rotation.get(), samples: [{ t: e.timeStamp, r: rotation.get() }] }
  }
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d) return
    let delta = angleOf(e) - d.startAngle
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const r = d.startRotation + delta
    rotation.set(r)
    d.samples = [...d.samples.slice(-5), { t: e.timeStamp, r }]
  }
  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    drag.current = null
    if (!d || !canSpin) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const dt = Math.max(1, last.t - first.t)
    const speed = ((last.r - first.r) / dt) * 1000 // deg/s
    if (Math.abs(speed) > 220) {
      strength.current = Math.round(Math.min(9, Math.max(4, 3 + Math.abs(speed) / 450)))
      onSpinRequest()
    }
  }

  const requestSpin = () => {
    strength.current = 5 + Math.floor(Math.random() * 3)
    onSpinRequest()
  }

  const v = WHEEL.view
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,540px)] select-none">
      <svg
        ref={svgRef}
        viewBox={`${-v} ${-v} ${v * 2} ${v * 2}`}
        className={`h-full w-full touch-none overflow-visible ${canSpin ? 'cursor-grab active:cursor-grabbing' : ''}`}
        role="img"
        aria-label="Ruleta de categorías y dificultades"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
      >
        <defs>
          <radialGradient id={`${uid}-rim`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#3a2a10" />
            <stop offset="70%" stopColor="#1a1408" />
            <stop offset="100%" stopColor="#0b0904" />
          </radialGradient>
          <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff1c4" />
            <stop offset="35%" stopColor="#f1c25e" />
            <stop offset="70%" stopColor="#b9821f" />
            <stop offset="100%" stopColor="#fbe3a0" />
          </linearGradient>
          <radialGradient id={`${uid}-shine`} cx="50%" cy="50%" r="50%">
            <stop offset="55%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.16" />
          </radialGradient>
          <radialGradient id={`${uid}-free`} cx="50%" cy="50%" r="50%">
            <stop offset="20%" stopColor="#8a5a10" />
            <stop offset="100%" stopColor="#f6cf6a" />
          </radialGradient>
          <pattern id={`${uid}-stripes`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="14" height="14" fill="#1b4357" />
            <rect width="6" height="14" fill="#285a72" />
          </pattern>
          {segments.map((seg, i) => {
            const color = segmentColor(seg, categoryById)
            return (
              <radialGradient key={i} id={`${uid}-seg-${i}`} cx="0" cy="0" r={WHEEL.segmentRadius} gradientUnits="userSpaceOnUse">
                <stop offset="15%" stopColor={shade(color, -0.55)} />
                <stop offset="75%" stopColor={color} />
                <stop offset="100%" stopColor={shade(color, 0.25)} />
              </radialGradient>
            )
          })}
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Ambient halo behind the wheel */}
        <circle r={WHEEL.rimOuter + 6} fill="none" stroke={GOLD} strokeOpacity={mode === 'won' ? 0.5 : 0.18} strokeWidth="18" filter={`url(#${uid}-glow)`} className="transition-[stroke-opacity] duration-500" />

        {/* Rim with marquee bulbs */}
        <circle r={WHEEL.rimOuter} fill={`url(#${uid}-rim)`} stroke={`url(#${uid}-brass)`} strokeWidth="5" />
        <circle r={WHEEL.rimInner} fill="none" stroke={`url(#${uid}-brass)`} strokeWidth="3" />
        <g className={`wheel-bulbs wheel-bulbs--${mode}`}>
          {Array.from({ length: WHEEL.bulbs }, (_, i) => {
            const [x, y] = polar(WHEEL.bulbRadius, (i / WHEEL.bulbs) * 360)
            return <circle key={i} cx={x} cy={y} r="6" className="wheel-bulb" style={{ animationDelay: `${(i % 4) * -0.15}s` }} />
          })}
        </g>

        {/* Rotating disc */}
        <motion.g style={{ rotate: rotation }}>
          <motion.g
            key={turnKey}
            initial={reduced ? false : { scale: 0.86, opacity: 0, rotate: -24 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          >
            {segments.map((seg, i) => (
              <path
                key={i}
                d={slicePath(i, count, WHEEL.segmentRadius)}
                fill={
                  seg.category.kind === 'fixed'
                    ? `url(#${uid}-seg-${i})`
                    : seg.category.kind === 'free'
                      ? `url(#${uid}-free)`
                      : `url(#${uid}-stripes)`
                }
                stroke="#06141c"
                strokeWidth="2"
              />
            ))}

            <motion.g style={{ filter: blur }}>
              {segments.map((seg, i) => (
                <SegmentLabel key={i} segment={seg} index={i} step={step} categoryById={categoryById} />
              ))}
            </motion.g>

            {/* Winning segment highlight */}
            {mode === 'won' && targetIndex !== null && (
              <motion.path
                d={slicePath(targetIndex, count, WHEEL.segmentRadius)}
                fill="#fff"
                stroke={GOLD}
                strokeWidth="5"
                filter={`url(#${uid}-glow)`}
                initial={{ fillOpacity: 0, strokeOpacity: 0 }}
                animate={{ fillOpacity: [0, 0.35, 0.12, 0.3, 0.15], strokeOpacity: 1 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            )}
          </motion.g>

          {/* Pins between segments */}
          {segments.map((_, i) => {
            const [x, y] = polar(WHEEL.pinRadius - 6, i * step)
            return <circle key={i} cx={x} cy={y} r="4.5" fill={`url(#${uid}-brass)`} stroke="#3a2a10" strokeWidth="1" />
          })}
          <circle r={WHEEL.segmentRadius} fill={`url(#${uid}-shine)`} pointerEvents="none" />
        </motion.g>

        {/* Pointer (flapper) */}
        <motion.g style={{ rotate: pointerAngle, originX: '0px', originY: `${-WHEEL.rimOuter - 6}px` }} filter={`url(#${uid}-shadow)`}>
          <path
            d={`M -20 ${-WHEEL.rimOuter - 14} Q 0 ${-WHEEL.rimOuter - 26} 20 ${-WHEEL.rimOuter - 14} L 0 ${-WHEEL.segmentRadius + 28} Z`}
            fill={`url(#${uid}-brass)`}
            stroke="#5a3d0c"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cy={-WHEEL.rimOuter - 10} r="7" fill="#fff1c4" stroke="#5a3d0c" strokeWidth="2" />
        </motion.g>
      </svg>

      {/* Hub: the spin button */}
      <button
        type="button"
        onClick={requestSpin}
        disabled={!canSpin}
        className={`absolute top-1/2 left-1/2 grid aspect-square w-[21%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full font-display text-[clamp(0.8rem,3.2vw,1.25rem)] font-extrabold tracking-wide text-stage-950 shadow-[0_6px_0_0_#7a5210,0_10px_24px_rgba(0,0,0,0.6),inset_0_2px_6px_rgba(255,255,255,0.7)] transition-transform enabled:hover:scale-105 enabled:active:translate-y-[calc(-50%+3px)] disabled:cursor-default ${canSpin ? 'wheel-hub--ready' : ''}`}
        style={{ background: 'radial-gradient(circle at 35% 30%, #fff1c4, #f1c25e 45%, #b9821f 100%)' }}
        aria-label={canSpin ? 'Girar la ruleta' : 'La ruleta está girando'}
      >
        {canSpin ? 'GIRAR' : '★'}
      </button>
    </div>
  )
}

function segmentColor(seg: WheelSegment, byId: Map<string, Category>): string {
  if (seg.category.kind === 'fixed') return byId.get(seg.category.value)?.color ?? '#285a72'
  return seg.category.kind === 'free' ? GOLD : '#285a72'
}

function SegmentLabel({ segment, index, step, categoryById }: { segment: WheelSegment; index: number; step: number; categoryById: Map<string, Category> }) {
  const angle = (index + 0.5) * step
  const rule = segment.category
  const fill = segmentColor(segment, categoryById)
  const ink = rule.kind === 'fixed' ? readableOn(fill) : rule.kind === 'free' ? '#2b1a00' : '#ffffff'
  const category = rule.kind === 'fixed' ? categoryById.get(rule.value) : undefined
  const title = rule.kind === 'fixed' ? (category?.short ?? '¿?') : rule.kind === 'free' ? 'Libre' : `Elige ${rule.k}`
  const icon = rule.kind === 'fixed' ? (category?.icon ?? '') : rule.kind === 'free' ? '★' : '⇄'
  const badge = difficultyBadge(segment.difficulty)
  const badgeIsPoints = segment.difficulty.kind === 'fixed'
  // Text on the left half is flipped so it never reads upside down.
  const flip = angle > 180
  // Room between the icon and the rim badge is about 78 units.
  const fontSize = title.length > 9 ? 14 : 16
  const estimated = title.length * fontSize * 0.58
  const fit = estimated > 78 ? { textLength: 78, lengthAdjust: 'spacingAndGlyphs' as const } : {}
  // Upright badge text in the lower half of the wheel.
  const badgeFlip = angle > 90 && angle < 270

  return (
    <g transform={`rotate(${angle})`}>
      {/* Category name, along the radius */}
      <g transform={`translate(0 ${-125}) rotate(${flip ? 90 : -90})`}>
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={ink}
          className="font-display"
          style={{ fontSize, fontWeight: 800, letterSpacing: '0.01em' }}
          {...fit}
        >
          {title}
        </text>
      </g>
      <text y={-70} textAnchor="middle" dominantBaseline="central" style={{ fontSize: 16 }} fill={ink} transform={flip ? 'rotate(180 0 -70)' : undefined}>
        {icon}
      </text>
      {/* Difficulty: badge near the rim */}
      <g transform={`translate(0 ${-182})${badgeFlip ? ' rotate(180)' : ''}`}>
        <rect
          x={-27}
          y={-12}
          width={54}
          height={24}
          rx={12}
          fill={badgeIsPoints ? '#06141c' : '#fff1c4'}
          stroke={GOLD}
          strokeWidth="2"
          opacity="0.92"
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill={badgeIsPoints ? GOLD : '#2b1a00'}
          className="font-display"
          style={{ fontSize: 12.5, fontWeight: 800 }}
        >
          {badge}
        </text>
      </g>
    </g>
  )
}

function celebrate(svg: SVGSVGElement | null, color: string) {
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const origin = { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height * 0.06) / window.innerHeight }
  const colors = [color, GOLD, '#ffffff']
  void confetti({ particleCount: 70, spread: 70, startVelocity: 38, origin, colors, scalar: 0.9, disableForReducedMotion: true })
  setTimeout(() => {
    void confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: origin.x - 0.12, y: origin.y + 0.1 }, colors, disableForReducedMotion: true })
    void confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: origin.x + 0.12, y: origin.y + 0.1 }, colors, disableForReducedMotion: true })
  }, 180)
}
