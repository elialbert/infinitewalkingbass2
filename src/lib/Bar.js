import Beat from './Beat.js'
import { Chord, Note } from 'tonal'
import NoteChooser from './NoteChooser.js'
import TripletChooser from './TripletChooser.js'
import musicUtils from './musicUtils.js'

class Bar {
  constructor(line, chord, barIdx) {
    this.line = line;
    this.chord = chord;
    this.barIdx = barIdx // spot in line
    this.key = this.line.section.song.key
    this.beats = []
    // respell chord tones so a Dbo7 is Db E G Bb rather than Db Fb Abb Cbb
    this.notes = Chord.get(this.chord).notes.map(n => musicUtils.spell(n, this.key))
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
      this.direction,
      this.nextBarFirstNoteCallback
    )
    // shapes of the last two bars, so this bar doesn't copy them
    const recentShapes = [this.lastBar, this.lastBar && this.lastBar.lastBar]
      .filter(b => b && b.shape).map(b => b.shape)
    this.chosenFirstNote = this.firstNote()
    const [beat2, beat3, beat4] = this.noteChooser.chooseBeats(recentShapes)
    this.cell = this.noteChooser.pick && this.noteChooser.pick.cell
    const spell = (n) => musicUtils.spell(n, this.key, this.chord)
    ;[this.chosenFirstNote, beat2, beat3, beat4].forEach((note, i) => this.beats[i].chooseNote(spell(note)))
    const midis = this.beats.map(b => Note.midi(b.note))
    this.shape = [midis[1] - midis[0], midis[2] - midis[1], midis[3] - midis[2]].join(',')
    this.tripletChooser = new TripletChooser(this)
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