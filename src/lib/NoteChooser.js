import { Chord, Note, Scale } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'
import WalkScorer from './WalkScorer.js'

// bar-start notes below/above these turn the line around
const TURN_UP_BELOW = Note.midi('A1')
const TURN_DOWN_ABOVE = Note.midi('Bb2')

class NoteChooser {
  constructor(chord, nextChord, lastBarNextBarFirstNote, notes, key,
    direction,
    nextBarFirstNoteCallback) {
    this.chord = chord
    this.root = musicUtils.chordRoot(this.chord)
    this.chosenScale = musicUtils.chooseScale(this.chord)
    this.nextChord = nextChord
    this.lastBarNextBarFirstNote = lastBarNextBarFirstNote
    this.notes = notes
    this.key = key
    this.direction = direction || 'down'
    this.octave = musicUtils.noteOctave(lastBarNextBarFirstNote)
    this.nextBarFirstNoteCallback = nextBarFirstNoteCallback
  }

  // ascending scale notes of the current chord between two notes (inclusive)
  scaleRange(from, to) {
    return Scale.rangeOf(`${this.root} ${this.chosenScale}`)(from, to)
  }

  firstNote() {
    this.chosenFirstNote = this.lastBarNextBarFirstNote || musicUtils.appendOctaveInteger(this.notes[0], this.octave)
    return this.chosenFirstNote
  }

  // put pitch class `pc` just above (up) or just below (down) `from`;
  // if that leaves the bass range, turn the line around instead
  placeInDirection(pc, from, allowSame) {
    const place = (direction) => {
      let note = musicUtils.appendOctaveInteger(Note.pitchClass(pc), musicUtils.noteOctave(from))
      const dist = musicUtils.semiDistance(from, note)
      if (direction == 'up' && (dist < 0 || (dist == 0 && !allowSame))) {
        note = Note.transpose(note, '8P')
      }
      if (direction == 'down' && (dist > 0 || (dist == 0 && !allowSame))) {
        note = Note.transpose(note, '-8P')
      }
      return note
    }
    let note = place(this.direction)
    if (!musicUtils.inRange(note)) {
      this.direction = this.direction == 'up' ? 'down' : 'up'
      note = place(this.direction)
    }
    return musicUtils.foldIntoRange(note)
  }

  runNextBarFirstNote() {
    const newNotes = Chord.get(this.nextChord).notes
    let nextBarFirstNote

    const firstMidi = Note.midi(this.chosenFirstNote)
    if (firstMidi <= TURN_UP_BELOW) {
      this.direction = 'up'
    }
    if (firstMidi >= TURN_DOWN_ABOVE) {
      this.direction = 'down'
    }

    if (this.chord !== this.nextChord) {
      const options = [newNotes[0], newNotes[1], newNotes[2]]
      const pc = utils.chooseWithProbabilities(options, [80, 10, 10])
      nextBarFirstNote = this.placeInDirection(pc, this.chosenFirstNote, true)
    } else {
      // Same chord continues — prefer chord tones to stay grounded
      const sameChordChoice = utils.chooseWithProbabilities(
        ['root', 'fifth', 'third', 'scale'], [60, 20, 10, 10])

      if (sameChordChoice !== 'scale') {
        let noteIndex = sameChordChoice === 'root' ? 0 : sameChordChoice === 'fifth' ? 2 : 1
        nextBarFirstNote = this.placeInDirection(newNotes[noteIndex], this.chosenFirstNote, false)
      } else {
        let noteRange
        if (this.direction == 'up') {
          noteRange = this.scaleRange(Note.transpose(this.chosenFirstNote, '2m'), Note.transpose(this.chosenFirstNote, '8P'))
        } else {
          noteRange = this.scaleRange(Note.transpose(this.chosenFirstNote, '-2m'), Note.transpose(this.chosenFirstNote, '-8P'))
        }
        nextBarFirstNote = musicUtils.foldIntoRange(utils.chooseWithProbabilityDecreasing(noteRange))
      }
    }

    this.nextBarFirstNoteCallback(nextBarFirstNote)
    this.nextBarFirstNote = nextBarFirstNote
    return nextBarFirstNote
  }

  // beats 2, 3 and 4, chosen together toward the next bar's beat 1
  chooseBeats(recentShapes) {
    const target = this.runNextBarFirstNote()
    this.pick = new WalkScorer(...(this.barChords || [this.chord])).choose(
      Note.midi(this.chosenFirstNote), Note.midi(target), recentShapes)
    if (this.pick) {
      return this.pick.notes.map(m => Note.fromMidi(m))
    }
    // no candidate fits (not seen in testing): 5th, 3rd, half step below the target
    return [
      musicUtils.nearest(this.notes[2], this.chosenFirstNote),
      musicUtils.nearest(this.notes[1], this.chosenFirstNote),
      musicUtils.foldIntoRange(Note.transpose(target, '-2m'))
    ]
  }
}

export default NoteChooser
