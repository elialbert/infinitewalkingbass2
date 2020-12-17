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

const musicUtils = {
  chooseScale: chooseScale,
  appendOctaveInteger: appendOctaveInteger
}

export default musicUtils