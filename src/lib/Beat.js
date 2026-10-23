import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { Note } from 'tonal'

// skips above this jump down instead of up, and below this jump up
const SKIP_UP_LIMIT = Note.midi('A2')
const SKIP_DOWN_LIMIT = Note.midi('E2')

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

  // the skip note, kept to a playable register
  bounceNote() {
    let interval = this.octaveBounce
    const midi = Note.midi(this.note)
    if (interval == '8M' && midi > SKIP_UP_LIMIT) { interval = '-8M' }
    if (interval == '-8M' && midi < SKIP_DOWN_LIMIT) { interval = '8M' }
    return musicUtils.spell(Note.transpose(this.note, interval), this.bar.key, this.bar.chord)
  }

  gather() {
    this.beatNumbers = [this.bar.line.section.song.beatCounter];
    this.bar.line.section.song.beatCounter += 1;
    if (this.octaveBounce !== 'no') {
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      this.bar.line.section.song.beatCounter += 1;
      // the skip lands on the last triplet eighth of the beat (swung)
      return [this.note, null, this.bounceNote()]
    } else if (this.triplet) {
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      this.bar.line.section.song.beatCounter += 1;
      this.beatNumbers.push(this.bar.line.section.song.beatCounter)
      this.bar.line.section.song.beatCounter += 1;
      // note included in triplet
      return this.triplet
    } else {
      return [this.note]
    }
  }
}

export default Beat
