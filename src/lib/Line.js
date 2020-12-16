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

  generate() {
    Array(this.section.barsPerLine).fill(1).map((_, barIdx) => {
      // bar we are currently at in the section calculated as
      let sectionBarIdx = (this.lineIdx * this.section.barsPerLine) + (barIdx)
      let curChord = this.currentChord(sectionBarIdx)
      // console.log('line work', barIdx, sectionBarIdx, curChord)
      let bar = new Bar(this, curChord, barIdx)
      bar.generate()
      this.bars.push(bar)
    })
  }

  gather() {
    return this.bars.map(function(bar) {
      return bar.gather()
    }).flat()
  }
}

export default Line