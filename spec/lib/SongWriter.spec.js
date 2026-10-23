import SongWriter from 'src/lib/SongWriter.js';
import { Chord, Progression } from 'tonal'
import utils from 'src/lib/utils.js'

it('cycles through keys based on songIdx', () => {
  const sw0 = new SongWriter(0, null, 'ABA')
  expect(sw0.key).toEqual('C')
  const sw1 = new SongWriter(1)
  expect(sw1.key).toEqual('G')
  const sw11 = new SongWriter(11)
  expect(sw11.key).toEqual('F')
  const sw12 = new SongWriter(12)
  expect(sw12.key).toEqual('C') // wraps around
})

it('returns next section', () => {
  const sw = new SongWriter(0, null, 'ABA')
  sw.generate()
  expect(sw.nextSection(0)).toBe(sw.sections()[1])
  expect(sw.nextSection(1)).toBe(sw.sections()[2])
  expect(sw.nextSection(2)).toBe(undefined)
})

it('returns all three sections', () => {
  const sw = new SongWriter(0, null, 'ABA')
  sw.generate()
  const sections = sw.sections()
  expect(sections.length).toEqual(3)
  expect(sections[0]).toBe(sw.sections()[0])
  expect(sections[1]).toBe(sw.sections()[1])
  expect(sections[2]).toBe(sw.sections()[2])
})

it('flattens nested arrays', () => {
  const sw = new SongWriter(0, null, 'ABA')
  expect(sw.flatten([[[1, 2], [3, 4]], [[5, 6]]])).toEqual([1, 2, 3, 4, 5, 6])
  expect(sw.flatten([[['a'], ['b', 'c']], [['d']]])).toEqual(['a', 'b', 'c', 'd'])
})

it('gathers notes as result', () => {
  const sw = new SongWriter(0, null, 'ABA')
  sw.keys = ['C']
  sw.key = 'C'
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.progB = ['IMaj7', 'IV7', 'IIIm7', 'VIMaj7']
  sw.chordProgA = Progression.fromRomanNumerals(sw.key, sw.progA)
  sw.chordProgB = Progression.fromRomanNumerals(sw.key, sw.progB)
  sw.generate()
  sw.gather()
})
it('stays in a key for the form\'s choruses, then modulates into the next key', () => {
  utils.seed(9)
  let sw = new SongWriter(0, null, 'blues')
  const keys = []
  for (let i = 0; i < 5; i++) {
    sw.generate()
    sw.gather()
    keys.push(sw.key)
    if (sw.lastChorusInKey) {
      // the last bar is a ii-V into the next chorus's first chord
      const last = sw.sections().at(-1).lines.at(-1).bars.at(-1)
      expect(last.chords.length).toEqual(2)
      expect(Chord.get(last.chords[1]).type).toEqual('dominant seventh')
    }
    sw = new SongWriter(0, sw)
  }
  utils.seed(null)
  expect(keys.slice(0, 4)).toEqual(['C', 'C', 'C', 'C'])
  expect(keys[4]).toEqual('G')
})

it('carries the line into the next chorus', () => {
  utils.seed(3)
  const first = new SongWriter(0, null, 'AABA')
  first.generate()
  first.gather()
  const second = new SongWriter(0, first)
  second.generate()
  second.gather()
  utils.seed(null)
  const lastBar = first.sections().at(-1).lines.at(-1).bars.at(-1)
  const firstBar = second.sections()[0].lines[0].bars[0]
  expect(firstBar.beats[0].note).toEqual(lastBar.nextBarFirstNote)
})
