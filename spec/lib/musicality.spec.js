// Whole-song statistics checked against what a hard bop walking line
// should look like. `npm run analyze` prints the same numbers in full.
import { analyze, generateSongs } from 'scripts/metrics.js'

const seeds = [1, 2]
const results = seeds.map(seed => [seed, analyze(generateSongs(60, seed))])

describe.each(results)('seed %i', (seed, stats) => {
  it('only produces playable, well-spelled notes in bass range', () => {
    expect(stats.invalidNotes).toEqual(0)
    expect(stats.outOfRange).toEqual(0)
    expect(stats.awkwardSpelling).toEqual(0)
  })

  it('lands on chord tones on the strong beats', () => {
    expect(stats.beat1ChordToneOnChange).toEqual(1)
    expect(stats.beat1RootOnChange).toBeGreaterThan(0.7)
    expect(stats.beat3ChordTone).toBeGreaterThan(0.55)
  })

  it('stays inside the harmony, resolving any outside notes', () => {
    expect(stats.outsideBeats23).toBeLessThan(0.12)
    expect(stats.outsideUnresolved).toBeLessThan(0.04)
  })

  it('walks smoothly, approaching each bar by step or 4th/5th', () => {
    expect(stats.contourReversal).toBeLessThan(0.2)
    expect(stats.approachHalfStep + stats.approachWholeStep + stats.approachFourthFifth).toBeGreaterThan(0.8)
    expect(stats.approachLeap).toBeLessThan(0.04)
    expect(stats.leapsOverFifth).toBeLessThan(0.05)
    expect(stats.repeatedNotes).toBeLessThan(0.04)
  })

  it('keeps skip notes and triplets occasional', () => {
    expect(stats.skipBeats).toBeGreaterThan(0.03)
    expect(stats.skipBeats).toBeLessThan(0.08)
    expect(stats.tripletBars).toBeGreaterThan(0.08)
    expect(stats.tripletBars).toBeLessThan(0.17)
  })
})

it('is reproducible for a given seed', () => {
  const a = generateSongs(3, 42).map(sw => JSON.stringify(sw.notes))
  const b = generateSongs(3, 42).map(sw => JSON.stringify(sw.notes))
  expect(a).toEqual(b)
})
