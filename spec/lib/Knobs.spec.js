import utils from 'src/lib/utils.js'
import { knobs, setKnobs, stepDrift, resetDrift, driftSummary } from 'src/lib/Knobs.js'

// 0.7 picks adventure, 0.99 chromatic (the last two knobs)
const pick = (val) => utils.setRandom(() => val)

afterEach(() => {
  utils.setRandom(null)
  resetDrift()
  setKnobs({})
})

it('drifts a multiplier up to 25% over its dial, then back down', () => {
  setKnobs({ adventure: 2 })
  pick(0.7)
  const seen = Array.from({ length: 10 }, () => { stepDrift(); return knobs.adventure })
  expect(seen.map(v => +v.toFixed(2))).toEqual([2.1, 2.2, 2.3, 2.4, 2.5, 2.4, 2.3, 2.2, 2.1, 2])
  stepDrift()
  expect(knobs.adventure).toBeCloseTo(2.1)
})

it('drifts chromatic by adding to its dial', () => {
  setKnobs({ chromatic: -1 })
  pick(0.99)
  stepDrift()
  stepDrift()
  expect(knobs.chromatic).toBeCloseTo(-0.9)
  expect(driftSummary()).toEqual('chromatic +0.10')
})

it('keeps the drift when a dial moves', () => {
  pick(0.7)
  stepDrift()
  setKnobs({ adventure: 2 })
  expect(knobs.adventure).toBeCloseTo(2.1)
  expect(knobs.skips).toEqual(1)
})
