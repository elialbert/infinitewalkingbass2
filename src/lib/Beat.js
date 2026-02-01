import utils from './utils.js'
import { Note } from 'tonal'

class Beat {
  constructor(bar, beatIdx) {
    this.bar = bar
    this.beatIdx = beatIdx
    this.onlyRoot = true
    this.octaveBounce = utils.chooseWithProbabilities(['8M', '-8M', '1P', 'no'], [10, 10, 17, 63])
    this.triplet = false
  }

  // actual note choosing logic happens during second pass ie gather
  generate(note) {
    this.note = note
  }

  chooseNote(note) {
    this.note = note
  }

  gather() {
    this.beatNumbers = [this.bar.line.section.song.beatCounter];
    this.bar.line.section.song.beatCounter += 1;
    if (this.octaveBounce !== 'no') {
      this.bar.line.section.song.beatCounter += 1;
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      return [this.note, null, null, Note.transpose(this.note, this.octaveBounce)]
    } else if (this.triplet) {
      this.bar.line.section.song.beatCounter += 1;
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      this.bar.line.section.song.beatCounter += 1;
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      // note included in triplet
      return this.triplet
    } else {
      return [this.note]
    }
  }
}

export default Beat