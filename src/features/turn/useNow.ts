import { useEffect, useState } from 'react'

/** Current time, refreshed on every animation frame while `active`. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    let frame = 0
    const loop = () => {
      setNow(Date.now())
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active])
  return now
}
