import utils from './utils.js'
import { Chord, Interval } from '@tonaljs/tonal'
import * as Tonal from '@tonaljs/tonal'
window.t = Tonal
const acceptableScales = ["ionian pentatonic", "lydian pentatonic", "lydian",
  "harmonic major", "major", "bebop", "bebop major", "chromatic"]

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

const musicUtils = {
  chooseScale: chooseScale,
  appendOctaveInteger: appendOctaveInteger,
  noteInList: noteInList,
  noteOctave: noteOctave,
  semiDistance: semiDistance
}

export default musicUtils