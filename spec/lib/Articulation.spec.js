import utils from 'src/lib/utils.js'
import SongWriter from 'src/lib/SongWriter.js'
import { articulate, DEFAULTS } from 'src/lib/Articulation.js'

afterEach(() => utils.setRandom(null))

const q = (note) => [{ note, velocity: 0.8, duration: '8n' }]

it('rings walking quarters for most of the beat', () => {
  utils.setRandom(() => 0.99)
  const out = articulate([q('C2'), q('D2'), q('E2')])
  out.forEach(([event]) => {
    expect(event.length).toBeCloseTo(DEFAULTS.legato)
    expect(event.mute).toBe(false)
  })
})

it('clips some notes short', () => {
  const [[event]] = articulate([rolled('C2', 0), rolled('D2', 0.5)], { shortChance: 10 })
  expect(event.length).toEqual(DEFAULTS.shortLength)
  expect(event.mute).toBe(true)
})

// events with fixed draws, so a test can say which notes may be clipped
const rolled = (note, roll) => [{ note, velocity: 0.8, duration: '8n', roll }]
const shortOnes = (out) => out.map(([e]) => e.mute)

it('never clips two notes running, or the same beat a bar apart', () => {
  const beats = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'G2', 'F2'].map(n => rolled(n, 0.01))
  beats[1][0].roll = 0.02
  beats[4][0].roll = 0.03
  const out = articulate(beats, { shortChance: 100 })
  // beat 0 has the lowest draw, so its neighbours and beat 4 stay long
  expect(shortOnes(out)[0]).toBe(true)
  expect(shortOnes(out)[1]).toBe(false)
  expect(shortOnes(out)[4]).toBe(false)
  shortOnes(out).forEach((s, i) => { if (s && i > 0) { expect(shortOnes(out)[i - 1]).toBe(false) } })
})

it('clips before a leap more readily than before a step', () => {
  const leap = articulate([rolled('C2', 0.12), rolled('G2', 0.9)], { shortChance: 10 })
  const step = articulate([rolled('C2', 0.12), rolled('D2', 0.9)], { shortChance: 10 })
  expect(leap[0][0].mute).toBe(true)
  expect(step[0][0].mute).toBe(false)
})

it('stops a note before the same pitch is plucked again', () => {
  utils.setRandom(() => 0.99)
  const [[event]] = articulate([q('C2'), q('C2')])
  expect(event.length).toBeLessThanOrEqual(0.8)
  expect(event.mute).toBe(true)
})

it('looks into the next chorus for a repeat', () => {
  utils.setRandom(() => 0.99)
  const [[event]] = articulate([q('C2')], {}, q('C2'))
  expect(event.mute).toBe(true)
})

it('keeps skips and pickups short and leaves silence alone', () => {
  utils.setRandom(() => 0.99)
  const skip = [{ note: 'C2', velocity: 0.8, duration: '8t' }, null, { note: 'C3', velocity: 0.5, duration: '32n' }]
  const out = articulate([skip, q('D2')])
  expect(out[0][1]).toBe(null)
  expect(out[0][0].length).toBeCloseTo((2 / 3) * DEFAULTS.legato)
  expect(out[0][2].length).toBeLessThanOrEqual(DEFAULTS.ghostLength)
  expect(out[0][2].mute).toBe(true)
})

it('lets two-feel half notes ring or lifts them early', () => {
  const half = () => [[{ note: 'C2', velocity: 0.8, duration: '4n' }], [null], q('G2')]
  utils.setRandom(() => 0.99)
  expect(articulate(half())[0][0].length).toBeCloseTo(2 * DEFAULTS.legato)
  utils.setRandom(() => 0)
  expect(articulate(half())[0][0]).toMatchObject({ length: 1.5, mute: true })
})

it('respects settings', () => {
  const out = articulate([rolled('C2', 0.5), rolled('D2', 0.6), rolled('E2', 0.4)], { shortChance: 100, shortLength: 0.3 })
  expect(out.map(([e]) => e.length)).toEqual([0.3, DEFAULTS.legato, 0.3])
})

it('keeps each note\'s draw, so raising a chance only adds short notes', () => {
  utils.seed(9)
  const beats = Array.from({ length: 64 }, (_, i) => q(['C2', 'D2', 'E2', 'F2'][i % 4]))
  const shortAt = (pct) => articulate(beats, { shortChance: pct }).map(([e]) => e.mute)
  const low = shortAt(10)
  const high = shortAt(40)
  expect(shortAt(10)).toEqual(low)
  low.forEach((isShort, i) => { if (isShort) { expect(high[i]).toBe(true) } })
  expect(high.filter(Boolean).length).toBeGreaterThan(low.filter(Boolean).length)
})

it('gives every note of a real chorus a length that ends before the next note', () => {
  utils.seed(3)
  const sw = new SongWriter(0, null)
  sw.generate()
  const beats = sw.flatten(sw.gather())
  const out = articulate(beats)
  let notes = 0
  out.forEach((events, b) => events.forEach((event, i) => {
    if (!event) { expect(beats[b][i]).toBe(null); return }
    notes++
    expect(event.note).toEqual(beats[b][i].note)
    expect(event.length).toBeGreaterThan(0)
    expect(event.length).toBeLessThanOrEqual(2)
  }))
  expect(notes).toBeGreaterThan(beats.length * 0.6)
})
