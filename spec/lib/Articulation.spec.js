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
  utils.setRandom(() => 0)
  const [[event]] = articulate([q('C2'), q('D2')])
  expect(event.length).toEqual(DEFAULTS.shortLength)
  expect(event.mute).toBe(true)
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
  const half = [[{ note: 'C2', velocity: 0.8, duration: '4n' }], [null], q('G2')]
  utils.setRandom(() => 0.99)
  expect(articulate(half)[0][0].length).toBeCloseTo(2 * DEFAULTS.legato)
  utils.setRandom(() => 0)
  expect(articulate(half)[0][0]).toMatchObject({ length: 1.5, mute: true })
})

it('respects settings', () => {
  utils.setRandom(() => 0.5)
  const out = articulate([q('C2'), q('D2'), q('E2')], { shortChance: 100, shortLength: 0.3 })
  expect(out.map(([e]) => e.length)).toEqual([0.3, 0.3, 0.3])
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
