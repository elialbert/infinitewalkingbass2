import Section from './Section.js'
import musicUtils from './musicUtils.js'

class SongWriter {
  constructor(songIdx) {
    this.keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F']
    this.key = this.keys[songIdx % this.keys.length]
    this.chordProgA = musicUtils.chooseProgression(this.key)
    this.chordProgB = musicUtils.chooseProgression(this.key)
    // console.log(this.progA, this.progB, this.chordProgA, this.chordProgB)
    this.beatCounter = 0
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

  sections() {
    return [this.sectionA, this.sectionB, this.sectionC]
  }

  gather() {
    return [
      this.sectionA.gather(), this.sectionB.gather(), this.sectionC.gather()
    ]
  }

  flatten(d) {
    return d.flat().flat().flat()
  }
}

export default SongWriter