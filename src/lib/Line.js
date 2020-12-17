import Bar from './Bar.js'

class Line {
  constructor(section, lineIdx) {
    this.section = section
    this.lineIdx = lineIdx

    // set probabilities

    this.bars = []
  }

  // given the bar we are currently at in the section,
  // return the chord we should be playing
  currentChord(sectionBarIdx) {
    let sum = 0;
    let chordIndex = null;
    this.section.chordsToBars.forEach(function(chordInt, chordsToBarsIndex) {
      if (chordIndex == null) {
        if (sum == sectionBarIdx) {
          chordIndex = chordsToBarsIndex
        } else if (sum > sectionBarIdx) {
          chordIndex = chordsToBarsIndex - 1
        } else {
          sum += chordInt
        }
      }
    })
    // falls through to last chord
    if (chordIndex == null) { chordIndex = this.section.chordsToBars.length - 1}
    return this.section.progression[chordIndex]
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
    if (!this.lastLine) { return null }
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
      bar.direction = this.section.getDirectionHint(bar.lastBar && bar.lastBar.direction)
      this.bars.push(bar)
    })
  }

  gather() {
    return this.bars.map(function(bar) {
      return bar.gather()
    })
  }
}

export default Line