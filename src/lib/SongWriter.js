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

  generate() {
    this.sectionA = new Section(this, 'a')
    this.sectionB = new Section(this, 'b')

    this.sectionA.generate()
    this.sectionB.generate()
  }

  gather() {
    return [
      this.sectionA.gather(), this.sectionB.gather(), this.sectionA.gather()
    ].flat()
  }
}

export default SongWriter