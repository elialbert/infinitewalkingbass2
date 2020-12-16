import Section from './Section.js'
import { Progression } from '@tonaljs/tonal'

function basicRandom() {
  return Math.random()
}

class SongWriter {
  constructor(random) {
    this.random = random
    if (!this.random) {
      this.random = basicRandom
    }

    this.keys = ['C']
    this.key = 'C'
    this.progA = ['IIm7', 'V7', 'IMaj7']
    this.progB = ['IMaj7', 'IV7', 'IIIm7', 'VIMaj7']
    this.chordProgA = Progression.fromRomanNumerals(this.key, this.progA)
    this.chordProgB = Progression.fromRomanNumerals(this.key, this.progB)
  }

  nextSection(sectionIdx) {
    if (sectionIdx == 0) { return this.sectionB }
    if (sectionIdx == 1) { return this.sectionC }
  }

  generate() {
    this.sectionA = new Section(this, 'a', 0)
    this.sectionB = new Section(this, 'b', 1)
    this.sectionC = new Section(this, 'a', 2)

    this.sectionA.generate()
    this.sectionB.generate()
    this.sectionC.generate()
  }

  gather() {
    return [
      this.sectionA.gather(), this.sectionB.gather(), this.sectionC.gather()
    ].flat()
  }
}

export default SongWriter