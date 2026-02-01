import utils from './utils.js'
import { Chord, Interval, Progression } from 'tonal'
import * as Tonal from 'tonal'
window.t = Tonal
const acceptableScales = ["major", "minor", 'minor pentatonic',
  'major blues', 'minor blues', 'harmonic minor', 'melodic minor', 'bebop', 'bebop minor', 'bebop major',
  'minor bebop', 'diminished']
// const acceptableScales = ['bebop']

function chooseScale(chord) {
  return utils.randFromArray(Chord.chordScales(chord) && acceptableScales)
}

function appendOctaveInteger(v, octave) {
  if (!octave) { octave = '3'}
  if (!/\d$/.test(v)) {
    v = `${v}${octave}`
  }
  return v
}

function noteOctave(note) {
  if (!note) { return 3 }
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
  ['Imaj7', 'IIm7', 'V7', 'IVmaj7'],
  ['Imaj7', 'bIIo7', 'IIm7', 'bIIIo7'],
  ['IIIm7', 'IVMaj7', 'bVo7', 'V7'],
  ['IMaj7', 'bIII7', 'IIm7', 'bII7'],
  ['IIIm7', 'bIII7', 'IIm7', 'bII7'],
  ['IMaj7', 'bIII7', 'bVI7', 'bII7'],
  ['IMaj7', 'II7', 'IIm7', 'V7'],
  ['IMaj7', 'Im7', 'II7', 'bIIMaj7']
];

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
    Progression.fromRomanNumerals(key,
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