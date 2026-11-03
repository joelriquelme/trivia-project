import { landingRotation, mod, segmentAtPointer } from './geometry'

describe('wheel geometry', () => {
  it('mod is always positive', () => {
    expect(mod(-30, 360)).toBe(330)
    expect(mod(725, 360)).toBe(5)
  })

  it('lands on the requested segment after at least the requested turns', () => {
    for (const count of [8, 12, 16]) {
      for (let index = 0; index < count; index++) {
        for (const jitter of [-0.5, 0, 0.5]) {
          for (const current of [0, 123.4, -800]) {
            const final = landingRotation(current, index, count, 5, jitter)
            expect(final - current).toBeGreaterThanOrEqual(5 * 360)
            expect(final - current).toBeLessThan(6 * 360)
            expect(segmentAtPointer(final, count)).toBe(index)
          }
        }
      }
    }
  })
})
