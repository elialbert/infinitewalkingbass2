import utils from './utils.js'
import { Chord, Note } from '@tonaljs/tonal'
window.t = Note;
const acceptableScales = ["ionian pentatonic", "lydian pentatonic", "augmented", "lydian", "augmented heptatonic",
  "harmonic major", "major", "bebop", "bebop major"]
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

const musicUtils = {
  chooseScale: chooseScale,
  appendOctaveInteger: appendOctaveInteger,
  noteInList: noteInList,
  noteOctave: noteOctave
}

export default musicUtils