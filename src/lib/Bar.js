import Beat from './Beat.js'
import { Chord } from '@tonaljs/tonal'

class Bar {
  constructor(line, chord, barIdx) {
    this.line = line;
    this.chord = chord;
    this.barIdx = barIdx // spot in line
    this.key = this.line.section.song.key
    this.beats = []
    this.notes = Chord.get(this.chord).notes
    this.nextBar = this.line.nextBar(this.barIdx)
    if (this.nextBar) {
      this.nextChord = this.nextBar.chord
    } else {
      this.nextChord = this.chord
    }
  }

  firstNote() {
    return this.notes[0]
  }

  lastNote() {
    if (this.chord != this.nextChord) {
      let nextNote = Chord.get(this.nextChord).notes[0]
    }
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
    return this.beats.map(function(beat) {
      return beat.gather()
    })
  }
}

export default Bar