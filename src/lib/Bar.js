import Beat from './Beat.js'
import { Chord, Note, Scale, Interval } from '@tonaljs/tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'
import NoteChooser from './NoteChooser.js'

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
  }

  nextBarFirstNoteCallback = (note) => {
    this.nextBarFirstNote = note
  }

  firstNote() {
    return this.noteChooser.firstNote()
  }

  lastNote() {
    return this.noteChooser.lastNote()
  }

  notesBetween() {
    return this.noteChooser.notesBetween()
  }

  prepNextBar() {
    this.nextBar = this.line.nextBar(this.barIdx)
    if (this.nextBar) {
      this.nextChord = this.nextBar.chord
    } else {
      this.nextChord = this.chord
    }
  }

  chooseNotes() {
    this.prepNextBar()
    this.noteChooser = new NoteChooser(
      this.chord,
      this.nextChord,
      this.lastBar && this.lastBar.nextBarFirstNote,
      this.notes,
      this.key,
      this.nextBarFirstNoteCallback
    )
    // console.log('working with ', this.chord, this.notes)
    this.chosenFirstNote = this.firstNote()
    this.chosenLastNote = this.lastNote()
    this.chosenNotesBetween = this.notesBetween()
    // console.log('choosing notes', this.chosenFirstNote, this.chosenLastNote, this.chosenNotesBetween)
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