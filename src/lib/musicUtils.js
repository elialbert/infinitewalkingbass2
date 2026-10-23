import utils from './utils.js'
import { Chord, Note, Progression, Scale } from 'tonal'

// Sounding range of an upright bass walking line. Playback can transpose
// (e.g. up an octave for small speakers) without changing the line itself.
const RANGE_LOW = 'E1'
const RANGE_HIGH = 'D3'
const DEFAULT_OCTAVE = '2'

// The scale a bassist "hears" over each chord quality, built on the chord's
// own root. Bebop scales add a chromatic passing tone between chord tones.
const chordScaleChoices = {
  'major seventh': [['major', 'lydian', 'bebop major'], [70, 15, 15]],
  'sixth': [['major', 'bebop major'], [75, 25]],
  'major': [['major', 'lydian'], [80, 20]],
  'minor seventh': [['dorian', 'bebop minor'], [75, 25]],
  'minor': [['dorian', 'bebop minor'], [75, 25]],
  'dominant seventh': [['mixolydian', 'bebop'], [60, 40]],
  'diminished seventh': [['diminished'], [100]],
  'diminished': [['diminished'], [100]],
  'half-diminished': [['locrian #2'], [100]],
  'minor sixth': [['melodic minor'], [100]],
  'minor/major seventh': [['melodic minor'], [100]]
}

const acceptableScales = ['major', 'dorian', 'mixolydian', 'bebop', 'lydian',
  'minor', 'harmonic minor', 'melodic minor', 'diminished', 'locrian #2']

// keys whose chromatic notes read better as flats
const flatKeys = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']

function chordRoot(chord) {
  return Chord.get(chord).tonic
}

// name of a scale (without tonic) that fits the chord, e.g. 'dorian' for Dm7
function chooseScale(chord) {
  const choice = chordScaleChoices[Chord.get(chord).type]
  if (choice) { return utils.chooseWithProbabilities(choice[0], choice[1]) }
  const chordScales = Chord.chordScales(chord)
  const validScales = acceptableScales.filter(s => chordScales.includes(s))
  if (validScales.length === 0) { return 'major' }
  return utils.randFromArray(validScales)
}

function appendOctaveInteger(v, octave) {
  if (!octave) { octave = DEFAULT_OCTAVE }
  if (!/\d$/.test(v)) {
    v = `${v}${octave}`
  }
  return v
}

function noteOctave(note) {
  if (!note) { return Number(DEFAULT_OCTAVE) }
  return note.substring(note.length -1, note.length)
}

// compare by pitch class, so octave and enharmonic spelling don't matter
function noteInList(noteList, note) {
  const chroma = Note.chroma(note)
  return noteList.some(n => Note.chroma(n) === chroma)
}

function semiDistance(n1, n2) {
  return Note.midi(n2) - Note.midi(n1)
}

function inRange(note) {
  const midi = Note.midi(note)
  return midi >= Note.midi(RANGE_LOW) && midi <= Note.midi(RANGE_HIGH)
}

// move a note by octaves until it sits inside the bass range
function foldIntoRange(note) {
  if (Note.midi(note) === null) { return note }
  while (Note.midi(note) < Note.midi(RANGE_LOW)) { note = Note.transpose(note, '8P') }
  while (Note.midi(note) > Note.midi(RANGE_HIGH)) { note = Note.transpose(note, '-8P') }
  return note
}

// place pitch class `pc` in the octave closest to `ref`
function nearest(pc, ref) {
  const refMidi = Note.midi(ref)
  const candidate = appendOctaveInteger(Note.pitchClass(pc), Note.octave(ref))
  const diff = Note.midi(candidate) - refMidi
  if (diff > 6) { return Note.transpose(candidate, '-8P') }
  if (diff < -6) { return Note.transpose(candidate, '8P') }
  return candidate
}

// The same note at an octave such that it has the given midi number
function withMidi(pc, midi) {
  for (let octave = -1; octave <= 9; octave++) {
    const n = `${pc}${octave}`
    if (Note.midi(n) === midi) { return n }
  }
  return null
}

const awkward = /(##|bb|x)|^(B#|E#|Cb|Fb)/

// readable spelling: use the chord-scale's spelling when the note belongs to
// it, otherwise sharps or flats depending on the key
function spell(note, key, chord) {
  if (!note) { return note }
  if (Note.get(note).empty) { return note }
  if (Note.midi(note) === null) {
    // bare pitch class: spell it at an arbitrary octave and strip the octave
    return Note.pitchClass(spell(`${note}4`, key, chord))
  }
  const midi = Note.midi(note)
  if (chord) {
    const root = chordRoot(chord)
    const scaleNotes = Scale.get(`${root} ${chooseScaleForSpelling(chord)}`).notes.concat(Chord.get(chord).notes)
    const match = scaleNotes.find(n => Note.chroma(n) === Note.chroma(note) && !awkward.test(n))
    if (match) { return withMidi(match, midi) }
  }
  return flatKeys.includes(key) ? Note.fromMidi(midi) : Note.fromMidiSharps(midi)
}

// deterministic scale for spelling (doesn't consume randomness)
function chooseScaleForSpelling(chord) {
  const choice = chordScaleChoices[Chord.get(chord).type]
  return choice ? choice[0][0] : 'major'
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

// tidy chord symbols: fix legacy '#d7' and respell roots like Ebb or Fb
function prepProgression(prog) {
  return prog.map((c) => {
    if (c.includes('#d7')) { c = c.replace('#d7', '#dim7') }
    const tonic = Chord.get(c).tonic
    if (tonic && awkward.test(tonic)) {
      c = Note.simplify(tonic) + c.slice(tonic.length)
    }
    return c
  })
}

function chooseProgression(key) {
  return prepProgression(
    Progression.fromRomanNumerals(key,
      utils.randFromArray(progressions)
    )
  )
}

const musicUtils = {
  RANGE_LOW: RANGE_LOW,
  RANGE_HIGH: RANGE_HIGH,
  chordRoot: chordRoot,
  chooseScale: chooseScale,
  appendOctaveInteger: appendOctaveInteger,
  noteInList: noteInList,
  noteOctave: noteOctave,
  semiDistance: semiDistance,
  inRange: inRange,
  foldIntoRange: foldIntoRange,
  nearest: nearest,
  spell: spell,
  chooseProgression: chooseProgression,
  prepProgression: prepProgression
}

export default musicUtils
