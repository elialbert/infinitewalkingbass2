import Bar from './Bar.js'
import utils from './utils.js'
import { Note } from 'tonal'

// a line is one 4-bar phrase; its bars' directions trace one of these arcs
const ARCS = [
  ['up', 'up', 'down', 'down'], // rise and fall
  ['up', 'up', 'up', 'down'],
  ['down', 'down', 'up', 'up'], // fall and rise
  ['down', 'down', 'down', 'up'],
  ['up', 'up', 'up', 'up'], // climb
  ['down', 'down', 'down', 'down'] // descend
]
// arc weights by where the phrase starts: climb from low, fall from high
const ARC_WEIGHTS = {
  low: [25, 25, 5, 0, 45, 0],
  middle: [20, 15, 20, 15, 15, 15],
  high: [5, 0, 25, 25, 0, 45]
}
const LOW_START = Note.midi('A1')
const HIGH_START = Note.midi('A2')

class Line {
  constructor(section, lineIdx) {
    this.section = section
    this.lineIdx = lineIdx
    // a two-feel head lasts 8 bars, so every chorus ends walking
    this.twoFeel = !!section.twoFeel && lineIdx < 2
    this.bars = []
  }

  // the chords of a bar, by its position in the section
  currentChord(sectionBarIdx) {
    return this.section.bars[sectionBarIdx]
  }

  nextBar(barIdx) {
    if (this.bars[barIdx + 1]) {
      return this.bars[barIdx + 1]
    }
    if (this.section.nextLine(this.lineIdx)) {
      return this.section.nextLine(this.lineIdx).bars[0]
    }
    return null
  }

  lastBar(barIdx) {
    if (barIdx !== 0) {
      return this.bars[barIdx - 1]
    }
    // the first bar of a chorus continues from the previous chorus, if any
    if (!this.lastLine) { return this.section.song.carryOver || null }
    return this.lastLine.bars[this.lastLine.bars.length - 1]
  }

  generate() {
    Array(this.section.barsPerLine).fill(1).map((_, barIdx) => {
      // bar we are currently at in the section calculated as
      let sectionBarIdx = (this.lineIdx * this.section.barsPerLine) + (barIdx)
      let curChord = this.currentChord(sectionBarIdx)
      // console.log('line work', barIdx, sectionBarIdx, curChord)
      let bar = new Bar(this, curChord, barIdx)
      bar.generate()
      bar.lastBar = this.lastBar(barIdx)
      this.bars.push(bar)
    })
  }

  // pick the phrase's arc once its starting note is known
  planArc() {
    const first = this.bars[0].lastBar && this.bars[0].lastBar.nextBarFirstNote
    const midi = first ? Note.midi(first) : null
    let zone = 'middle'
    if (midi !== null && midi <= LOW_START) { zone = 'low' }
    if (midi !== null && midi >= HIGH_START) { zone = 'high' }
    const arc = utils.chooseWithProbabilities(ARCS, ARC_WEIGHTS[zone])
    this.bars.forEach((bar, i) => { bar.direction = arc[i % arc.length] })
  }

  gather() {
    this.planArc()
    return this.bars.map(function(bar) {
      return bar.gather()
    })
  }
}

export default Line