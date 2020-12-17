import { Chord, Note, Scale, Interval } from '@tonaljs/tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'

class NoteChooser {
  constructor(chord, nextChord, lastBarNextBarFirstNote, notes, key, nextBarFirstNoteCallback) {
    this.chord = chord
    this.nextChord = nextChord
    this.lastBarNextBarFirstNote = lastBarNextBarFirstNote
    this.notes = notes
    this.key = key
    this.nextBarFirstNoteCallback = nextBarFirstNoteCallback
  }

  firstNote() {
    this.chosenFirstNote = this.lastBarNextBarFirstNote || musicUtils.appendOctaveInteger(this.notes[0])
    return this.chosenFirstNote
  }

  generateNextBarProb() {
    let nextBarProb = [60, 20, 20]
    if (this.chord != this.nextChord) {
      nextBarProb = [80, 10, 10]
    }
    return nextBarProb
  }

  lastNote() {
    const nextBarProb = this.generateNextBarProb()
    const newNotes = Chord.get(this.nextChord).notes

    const options = [newNotes[0], newNotes[1], newNotes[2]]
    const nextBarFirstNote = musicUtils.appendOctaveInteger(
      utils.chooseWithProbabilities(options, nextBarProb))
    this.nextBarFirstNoteCallback(nextBarFirstNote)

    const noteBelow = Note.transpose(nextBarFirstNote, '-2m')
    const noteAbove = Note.transpose(nextBarFirstNote, '2m')
    const noteStepDown = Note.transpose(nextBarFirstNote, '-2M')
    const noteStepUp = Note.transpose(nextBarFirstNote, '2M')
    const noteDominantBelow = Note.transpose(nextBarFirstNote, '-4M')
    const noteDominantAbove = Note.transpose(nextBarFirstNote, '5M')

    let chosen;
    if (this.chord != this.nextChord) {
      [noteBelow, noteAbove, noteStepDown, noteStepUp, noteDominantBelow].some( (attempt) => {
        // do not include octave in comparison
        if (this.notes.includes(attempt.substring(0, attempt.length - 1))) {
          chosen = attempt
          return true
        }
      })
    }

    if (!chosen) {
      chosen = utils.chooseWithProbabilities(
        [noteBelow, noteAbove, noteDominantBelow, noteDominantAbove,
          noteStepDown, noteStepUp, noteBelow,
          musicUtils.appendOctaveInteger(this.notes[3]),
          musicUtils.appendOctaveInteger(this.notes[2]),
          musicUtils.appendOctaveInteger(this.notes[1])],
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
    }
    this.chosenLastNote = musicUtils.appendOctaveInteger(chosen)
    return this.chosenLastNote
  }

  // given 2 notes and a chord, pick 2 notes in between
  notesBetween() {
    const chosenScale = musicUtils.chooseScale(this.chord)
    const rangeFinder = Scale.rangeOf(`${this.key} ${chosenScale}`)
    if (Interval.semitones(Interval.distance(this.chosenFirstNote, this.chosenLastNote)) < 5) {
      this.chosenLastNote = Note.transpose(this.chosenLastNote, '8M')
    }
    const noteRange = rangeFinder(this.chosenFirstNote, this.chosenLastNote)
    return utils.chooseTwoRandomElementsInOrder(noteRange)
  }
}

export default NoteChooser