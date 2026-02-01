import SongWriter from 'src/lib/SongWriter.js';
import { Progression } from 'tonal'

it('cycles through keys based on songIdx', () => {
  const sw0 = new SongWriter(0)
  expect(sw0.key).toEqual('C')
  const sw1 = new SongWriter(1)
  expect(sw1.key).toEqual('G')
  const sw11 = new SongWriter(11)
  expect(sw11.key).toEqual('F')
  const sw12 = new SongWriter(12)
  expect(sw12.key).toEqual('C') // wraps around
})

it('returns next section', () => {
  const sw = new SongWriter(0)
  sw.generate()
  expect(sw.nextSection(0)).toBe(sw.sectionB)
  expect(sw.nextSection(1)).toBe(sw.sectionC)
  expect(sw.nextSection(2)).toBe(undefined)
})

it('returns all three sections', () => {
  const sw = new SongWriter(0)
  sw.generate()
  const sections = sw.sections()
  expect(sections.length).toEqual(3)
  expect(sections[0]).toBe(sw.sectionA)
  expect(sections[1]).toBe(sw.sectionB)
  expect(sections[2]).toBe(sw.sectionC)
})

it('flattens nested arrays', () => {
  const sw = new SongWriter(0)
  expect(sw.flatten([[[1, 2], [3, 4]], [[5, 6]]])).toEqual([1, 2, 3, 4, 5, 6])
  expect(sw.flatten([[['a'], ['b', 'c']], [['d']]])).toEqual(['a', 'b', 'c', 'd'])
})

it('gathers notes as result', () => {
  const sw = new SongWriter(null)
  sw.keys = ['C']
  sw.key = 'C'
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.progB = ['IMaj7', 'IV7', 'IIIm7', 'VIMaj7']
  sw.chordProgA = Progression.fromRomanNumerals(sw.key, sw.progA)
  sw.chordProgB = Progression.fromRomanNumerals(sw.key, sw.progB)
  sw.generate()
  sw.gather()
})