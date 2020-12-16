import Beat from './Beat.js'
import { Chord, Note, Scale } from '@tonaljs/tonal'
import utils from './utils.js'

class Bar {
  constructor(line, chord, barIdx) {
    this.line = line;
    this.chord = chord;
    this.barIdx = barIdx // spot in line
    this.key = this.line.section.song.key
    this.beats = []
    this.notes = Chord.get(this.chord).notes
    if (!this.notes[3]) {
      this.notes[3] = this.notes[0]
    }
    this.nextBar = this.line.nextBar(this.barIdx)
    if (this.nextBar) {
      this.nextChord = this.nextBar.chord
    } else {
      this.nextChord = this.chord
    }
  }

  firstNote() {
    return (this.lastBar && this.lastBar.nextBarFirstNote) || `${this.notes[0]}4`
  }

  lastNote() {
    if (this.chord != this.nextChord) {
      const newNotes = Chord.get(this.nextChord).notes
      const options = [newNotes[0], newNotes[1], newNotes[2]]
      this.nextBarFirstNote = `${utils.chooseWithProbabilities(options, [70, 15, 15])}4`
      const noteBelow = Note.transpose(this.nextBarFirstNote, '-2m')
      const noteAbove = Note.transpose(this.nextBarFirstNote, '2m')
      const noteDominantBelow = Note.transpose(this.nextBarFirstNote, '-4M')
      let chosen = null
      [noteBelow, noteAbove, noteDominantBelow].some(function(attempt) {
        if (this.notes.includes(attempt)) {
          chosen = attempt
          return true
        }
      })
      if (!chosen) {
        chosen = utils.chooseWithProbabilities(
          [noteBelow, noteAbove, noteDominantBelow, this.notes[3], this.notes[2], this.notes[1]],
          [20, 20, 15, 15, 15, 15])
      }
      return `${chosen}4`
    } else {
      const options = [this.notes[0], this.notes[1], this.notes[2]]
      this.nextBarFirstNote = `${utils.chooseWithProbabilities(options, [70, 15, 15])}4`
      const noteBelow = Note.transpose(this.notes[0], '-2m')
      const noteAbove = Note.transpose(this.notes[0], '2m')
      const noteDominantBelow = Note.transpose(this.notes[0], '-4M')
      const noteDominantAbove = Note.transpose(this.notes[0], '5M')
      const choice = utils.chooseWithProbabilities(
        [noteBelow, noteAbove, noteDominantBelow, noteDominantAbove, this.notes[3], this.notes[2], this.notes[1]],
        [20, 20, 20, 10, 10, 10, 10])
      return `${choice}4`
    }
  }

  // given 2 notes and a chord, pick 2 notes in between
  notesBetween() {
    const chosenScale = utils.chooseScale(this.chord)
    const rangeFinder = Scale.rangeOf(`${this.key} ${chosenScale}`)
    const noteRange = rangeFinder(this.chosenFirstNote, this.chosenLastNote)
    return [utils.randFromArray(noteRange) || utils.randFromArray(this.notes), utils.randFromArray(noteRange) || utils.randFromArray(this.notes)]
  }

  chooseNotes() {
    this.chosenFirstNote = this.firstNote()
    this.chosenLastNote = this.lastNote()
    this.chosenNotesBetween = this.notesBetween()
    console.log('choosing notes', this.chosenFirstNote, this.chosenLastNote, this.chosenNotesBetween)
    this.beats[0].chooseNote(this.chosenFirstNote)
    this.beats[3].chooseNote(this.chosenLastNote)
    this.beats[1].chooseNote(this.chosenNotesBetween[0])
    this.beats[2].chooseNote(this.chosenNotesBetween[1])
  }

  generate() {
    Array(4).fill(1).map((_, beatIdx) => {
      let beat = new Beat(this, beatIdx)
      // just pass in the root note on this pass
      // actual note choosing logic on gather pass
      beat.generate(this.notes[beatIdx])
      this.beats.push(beat)
    })
  }

  gather() {
    this.chooseNotes()
    return this.beats.map(function(beat) {
      return beat.gather()
    })
  }
}

export default Bar