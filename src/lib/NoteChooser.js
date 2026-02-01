import { Chord, Note, Scale } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'

class NoteChooser {
  constructor(chord, nextChord, lastBarNextBarFirstNote, notes, key,
    direction,
    nextBarFirstNoteCallback) {
    this.chord = chord
    this.chosenScale = musicUtils.chooseScale(this.chord)
    this.nextChord = nextChord
    this.lastBarNextBarFirstNote = lastBarNextBarFirstNote
    this.notes = notes
    this.key = key
    this.direction = direction || 'down'
    this.octave = musicUtils.noteOctave(lastBarNextBarFirstNote)
    this.nextBarFirstNoteCallback = nextBarFirstNoteCallback
  }

  firstNote() {
    this.chosenFirstNote = this.lastBarNextBarFirstNote || musicUtils.appendOctaveInteger(this.notes[0], this.octave)
    return this.chosenFirstNote
  }

  runNextBarFirstNote() {
    const newNotes = Chord.get(this.nextChord).notes
    let nextBarFirstNote

    if ((musicUtils.noteOctave(this.chosenFirstNote) <= 2)) {
      this.direction = 'up'
    }
    if (musicUtils.noteOctave(this.chosenFirstNote) >= 5) {
      this.direction = 'down'
    }

    if (this.chord !== this.nextChord) {
      const options = [newNotes[0], newNotes[1], newNotes[2]]
      nextBarFirstNote = musicUtils.appendOctaveInteger(
        utils.chooseWithProbabilities(options, [80, 10, 10]), this.octave)

      if ((musicUtils.semiDistance(this.chosenFirstNote, nextBarFirstNote) < 0) && this.direction == 'up') {
        nextBarFirstNote = Note.transpose(nextBarFirstNote, '8M')
      }

      if ((musicUtils.semiDistance(this.chosenFirstNote, nextBarFirstNote) > 0) && this.direction == 'down') {
        nextBarFirstNote = Note.transpose(nextBarFirstNote, '-8M')
      }
      // console.log('nnextfirst', this.octave, this.direction, nextBarFirstNote)

    } else {
      const rangeFinder = Scale.rangeOf(`${this.key} ${this.chosenScale}`)
      let noteRange
      if (this.direction == 'up') {
        let minJump = Note.transpose(this.chosenFirstNote, '2m')
        let maxJump = Note.transpose(this.chosenFirstNote, '8M')
        noteRange = rangeFinder(minJump, maxJump)
      } else {
        let minJump = Note.transpose(this.chosenFirstNote, '-2m')
        let maxJump = Note.transpose(this.chosenFirstNote, '-8M')
        noteRange = rangeFinder(minJump, maxJump)
      }
      nextBarFirstNote = utils.chooseWithProbabilityDecreasing(noteRange)
      // console.log('nextfirst', this.octave, this.direction, nextBarFirstNote, noteRange, this.chosenScale)
    }

    this.nextBarFirstNoteCallback(nextBarFirstNote)
    this.nextBarFirstNote = nextBarFirstNote
    return nextBarFirstNote
  }

  setNoteOptions(nextBarFirstNote) {
    this.noteBelow = Note.transpose(nextBarFirstNote, '-2m')
    this.noteAbove = Note.transpose(nextBarFirstNote, '2m')
    this.noteStepDown = Note.transpose(nextBarFirstNote, '-2M')
    this.noteStepUp = Note.transpose(nextBarFirstNote, '2M')
    this.noteDominantBelow = Note.transpose(nextBarFirstNote, '-4M')
    this.noteDominantAbove = Note.transpose(nextBarFirstNote, '5M')
  }

  lastNoteNewChord(nextBarFirstNote) {
    let chosen;
    [this.noteBelow, this.noteAbove, this.noteStepDown, this.noteStepUp, this.noteDominantBelow].some( (attempt) => {
      // do not include octave in comparison
      if (musicUtils.noteInList(this.notes, attempt)) {
        chosen = attempt
        return true
      }
    })

    if (!chosen) {
      chosen = utils.chooseWithProbabilities(
        [this.noteBelow, this.noteAbove, this.noteDominantBelow, this.noteDominantAbove],
        [30, 30, 20, 20])
    }
    return chosen
  }

  lastNote() {
    const nextBarFirstNote = this.runNextBarFirstNote()
    this.setNoteOptions(nextBarFirstNote)

    let chosen
    if (this.chord != this.nextChord) {
      chosen = this.lastNoteNewChord(nextBarFirstNote)
    }
    if (!chosen) {
      chosen = utils.chooseWithProbabilities(
        [this.noteBelow, this.noteAbove, this.noteDominantBelow, this.noteDominantAbove,
          this.noteStepDown, this.noteStepUp, this.noteBelow,
          musicUtils.appendOctaveInteger(this.notes[3], this.octave),
          musicUtils.appendOctaveInteger(this.notes[2], this.octave),
          musicUtils.appendOctaveInteger(this.notes[1], this.octave)],
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
    }
    this.chosenLastNote = musicUtils.appendOctaveInteger(chosen, this.octave)
    return this.chosenLastNote
  }

  // given 2 notes and a chord, pick 2 notes in between
  notesBetween() {
    let rangeFinder = Scale.rangeOf(`${this.key} ${this.chosenScale}`)
    let chosenLastNoteToUse = this.chosenLastNote
    if (musicUtils.semiDistance(this.chosenFirstNote, chosenLastNoteToUse) == 0) {
      chosenLastNoteToUse = Note.transpose(this.chosenLastNote, '5M')
    }
    if (musicUtils.semiDistance(this.chosenFirstNote, chosenLastNoteToUse) < 2) {
      chosenLastNoteToUse = Note.transpose(this.chosenLastNote, '-4M')
    }
    if (musicUtils.semiDistance(this.chosenFirstNote, chosenLastNoteToUse) <= 3) {
      rangeFinder = Scale.rangeOf(`${this.key} chromatic`)
    }
    let noteRange = rangeFinder(this.chosenFirstNote, chosenLastNoteToUse)
    if (noteRange.length > 1) {
      noteRange = noteRange.slice(1, noteRange.length)
    }
    if (noteRange.length > 1) {
      const ind = noteRange.indexOf(this.chosenLastNote)
      if (ind > -1) { noteRange.splice(ind, 1) }
    }

    if (this.direction == 'down') {
      noteRange = noteRange.reverse()
    }

    if (noteRange.length == 0) { noteRange = rangeFinder(this.chosenFirstNote, this.nextBarFirstNote) }
    let r = utils.chooseTwoRandomElementsInOrder(noteRange)
    // console.log('picking notes from ', this.chosenFirstNote, chosenLastNoteToUse ,this.chosenScale, noteRange, r)
    return r
  }
}

export default NoteChooser