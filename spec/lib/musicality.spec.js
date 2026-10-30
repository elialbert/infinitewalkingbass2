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
    expect(stats.beat3ChordTone).toBeLessThan(0.85)
  })

  it('stays inside the harmony, resolving any outside notes', () => {
    expect(stats.outsideBeats23).toBeLessThan(0.12)
    expect(stats.outsideUnresolved).toBeLessThan(0.04)
  })

  it('walks smoothly, approaching each bar by step or 4th/5th', () => {
    expect(stats.approachHalfStep + stats.approachWholeStep + stats.approachFourthFifth).toBeGreaterThan(0.8)
    expect(stats.approachLeap).toBeLessThan(0.04)
    expect(stats.leapsOverFifth).toBeLessThan(0.05)
    expect(stats.repeatedNotes).toBeLessThan(0.04)
  })

  it('arpeggiates and turns around instead of running scales', () => {
    expect(stats.contourReversal).toBeGreaterThan(0.25)
    expect(stats.contourReversal).toBeLessThan(0.45)
    expect(stats.oneDirectionBars).toBeLessThan(0.45)
    expect(stats.beat2ChordTone).toBeGreaterThan(0.45)
    expect(stats.leapsInBar).toBeGreaterThan(0.2)
    // the stock climb (R +2 +3 +4) is ~5% of FiloBass bars; recall bunches
    // it up in a short sample like this one
    expect(stats.topShapeShare).toBeLessThan(0.09)
  })

  it('comes back to its own figures when the harmony comes back', () => {
    expect(stats.recallSameBar).toBeGreaterThan(0.25)
    expect(stats.recallSameBar).toBeLessThan(0.6)
    expect(stats.recallSameBeat1).toBeGreaterThan(0.6)
    expect(stats.stockFigureUp4).toBeGreaterThan(0.1)
  })

  it('lands the second chord of a split bar on its root, and plays heads in two', () => {
    expect(stats.splitBeat3Root).toBeGreaterThan(0.7)
    expect(stats.twoFeelBars).toBeGreaterThan(0.05)
    expect(stats.twoFeelBars).toBeLessThan(0.3)
  })

  it('walks chromatically into chord changes, most of all when resolving', () => {
    expect(stats.doubleChromatic).toBeGreaterThan(0.1)
    expect(stats.beat3OnTarget).toBeLessThan(0.07)
    expect(stats.resolutionHalfStep).toBeGreaterThan(stats.approachHalfStep)
    expect(stats.sameChordRoot).toBeLessThan(0.5)
  })

  it('fills about a quarter of the bars, in stretches, on any beat', () => {
    expect(stats.fillBars).toBeGreaterThan(0.18)
    expect(stats.fillBars).toBeLessThan(0.36)
    expect(stats.fillAfterFill).toBeGreaterThan(stats.fillBars + 0.1)
    expect(stats.quietWindows).toBeGreaterThan(0.1)
    expect(Math.max(...stats.fillByBeat)).toBeLessThan(2 * Math.min(...stats.fillByBeat))
    expect(stats.sameFillNextBar).toBeLessThan(0.1)
  })

  it('lets walking notes ring, with no short notes by default', () => {
    // what's left is a main note that only lasts until a fill on its beat
    expect(stats.shortNotes).toBeLessThan(0.05)
  })
})

it('is reproducible for a given seed', () => {
  const a = generateSongs(3, 42).map(sw => JSON.stringify(sw.notes))
  const b = generateSongs(3, 42).map(sw => JSON.stringify(sw.notes))
  expect(a).toEqual(b)
})
