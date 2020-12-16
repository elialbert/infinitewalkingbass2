import SongWriter from 'src/lib/SongWriter.js';
import { Progression } from '@tonaljs/tonal'

it('it works', () => {
  const i = new SongWriter(null)
  expect(i.random()).not.toBe(null)
})

it('forces nonrandom', () => {
  function nonrandom() {
    return 1
  }

  const i = new SongWriter(nonrandom)
  expect(i.random()).toBe(1)
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
  expect(sw.gather()[7]).toEqual(['C'])
  expect(sw.gather()[8]).toEqual(['G'])
})