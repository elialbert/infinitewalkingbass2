import SongWriter from 'src/lib/SongWriter.js';
import { Progression } from 'tonal'

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