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
  }

  firstNote() {
    return this.notes[0]
  }

  lastNote() {

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