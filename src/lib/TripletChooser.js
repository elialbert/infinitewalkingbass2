import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { Note } from '@tonaljs/tonal'

class TripletChooser {
  constructor(bar) {
    this.bar = bar
    this.doTriplet()
  }

  doTriplet() {
    const check = utils.chooseWithProbabilities(['yes', 'no'], [80, 20])
    if (check === 'no') { return false }

    let candidate = false;
    let beat0, beat1
    [[0, 1], [1, 2], [2, 3]].forEach((indices) => {
      beat0 = this.bar.beats[indices[0]]
      beat1 = this.bar.beats[indices[1]]
      if (beat0.octaveBounce == 'no' && beat1.octaveBounce == 'no' &&
        musicUtils.semiDistance(beat0.note, beat1.note) > 3) {
        candidate = indices[1]
      }
    })

    if (candidate) {
      let beat1 = this.bar.beats[candidate]
      if (this.bar.direction == 'up') {
        beat1.triplet = [
          Note.transpose(beat1.note, '-2M'),
          Note.transpose(beat1.note, '-2m'),
          beat1.note
        ]
      } else {
        beat1.triplet = [
          Note.transpose(beat1.note, '2M'),
          Note.transpose(beat1.note, '2m'),
          beat1.note
        ]
      }
    }

  }
}



export default TripletChooser