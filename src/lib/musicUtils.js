import utils from './utils.js'
import { Chord, Interval } from '@tonaljs/tonal'
import * as Tonal from '@tonaljs/tonal'
window.t = Tonal
const acceptableScales = ["major", "minor", 'minor pentatonic',
  'major blues', 'minor blues', 'harmonic minor', 'melodic minor', 'bebop', 'bebop minor', 'bebop major',
  'minor bebop']
// const acceptableScales = ['bebop']

function chooseScale(chord) {
  return utils.randFromArray(Chord.chordScales(chord) && acceptableScales)
}

function appendOctaveInteger(v, octave) {
  if (!octave) { octave = '2'}
  if (!/\d$/.test(v)) {
    v = `${v}${octave}`
  }
  return v
}

function noteOctave(note) {
  if (!note) { return 2 }
  return note.substring(note.length -1, note.length)
}

function noteInList(noteList, note) {
  note = appendOctaveInteger(note)
  return noteList.includes(note.substring(0, note.length - 1))
}

function semiDistance(n1, n2) {
  return Interval.semitones(Interval.distance(n1, n2))
}


const progressions = [
  ['IIm7', 'V7', 'IMaj7'],
  ['IMaj7', 'IV7', 'IIIm7', 'VIMaj7'],
  ['IMaj7', 'VIm7', 'IIm7', 'V7'],
  ['IIm7', 'VI7', 'IIm7', 'V7'],
  ['IMaj7', 'IMaj7', 'IIm7', 'V7'],
  ['IMaj7', 'I#d7', 'IIm7', 'II#d7', 'IIIm7', 'VI7'],
  ['Imaj7', 'IIm7', 'V7', 'IVmaj7']
]

function prepProgression(prog) {
  let res = []
  prog.forEach((c) => {
    if (c.includes('#d7')) {
      res.push(c.replace('#d7', '#dim7'))
    } else {
      res.push(c)
    }
  })
  return res
}

function chooseProgression(key) {
  return prepProgression(
    Tonal.Progression.fromRomanNumerals(key,
      utils.randFromArray(progressions)
    )
  )
}

const musicUtils = {
  chooseScale: chooseScale,
  appendOctaveInteger: appendOctaveInteger,
  noteInList: noteInList,
  noteOctave: noteOctave,
  semiDistance: semiDistance,
  chooseProgression: chooseProgression,
  prepProgression: prepProgression
}

export default musicUtils