import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { Note } from 'tonal'

class TripletChooser {
  constructor(bar) {
    this.bar = bar
    this.doTriplet()
  }

  doTriplet() {
    const check = utils.chooseWithProbabilities(['yes', 'no'], [65, 35])
    if (check === 'no') { return false }

    let candidate = false;
    let beat0, beat1
    let distance = 0;
    [[0, 1], [1, 2], [2, 3]].forEach((indices) => {
      beat0 = this.bar.beats[indices[0]]
      beat1 = this.bar.beats[indices[1]]
      if (beat0.octaveBounce == 'no' && beat1.octaveBounce == 'no') {
        candidate = indices[1]
        distance = musicUtils.semiDistance(beat0.note, beat1.note)
      }
    })

    if (candidate) {
      let beat1 = this.bar.beats[candidate]
      const pattern = utils.chooseWithProbabilities(['end', 'start', 'middle'], [33, 33, 34])

      // For close intervals (3 semitones or less), use chromatic patterns
      if (distance <= 3) {
        if (this.bar.direction == 'up') {
          if (pattern === 'end') {
            // Chromatic approach from below
            beat1.triplet = [
              Note.transpose(beat1.note, '-2m'),
              Note.transpose(beat1.note, '-1A'),
              beat1.note
            ]
          } else if (pattern === 'start') {
            // Start on target, chromatic descent then up
            beat1.triplet = [
              beat1.note,
              Note.transpose(beat1.note, '-1A'),
              Note.transpose(beat1.note, '1A')
            ]
          } else {
            // Chromatic enclosure
            beat1.triplet = [
              Note.transpose(beat1.note, '-1A'),
              beat1.note,
              Note.transpose(beat1.note, '1A')
            ]
          }
        } else {
          if (pattern === 'end') {
            // Chromatic approach from above
            beat1.triplet = [
              Note.transpose(beat1.note, '2m'),
              Note.transpose(beat1.note, '1A'),
              beat1.note
            ]
          } else if (pattern === 'start') {
            // Start on target, chromatic ascent then down
            beat1.triplet = [
              beat1.note,
              Note.transpose(beat1.note, '1A'),
              Note.transpose(beat1.note, '-1A')
            ]
          } else {
            // Chromatic enclosure
            beat1.triplet = [
              Note.transpose(beat1.note, '1A'),
              beat1.note,
              Note.transpose(beat1.note, '-1A')
            ]
          }
        }
      } else {
        // For larger intervals, use stepwise patterns
        if (this.bar.direction == 'up') {
          if (pattern === 'end') {
            beat1.triplet = [
              Note.transpose(beat1.note, '-2M'),
              Note.transpose(beat1.note, '-2m'),
              beat1.note
            ]
          } else if (pattern === 'start') {
            beat1.triplet = [
              beat1.note,
              Note.transpose(beat1.note, '2m'),
              Note.transpose(beat1.note, '2M')
            ]
          } else {
            beat1.triplet = [
              Note.transpose(beat1.note, '-2m'),
              beat1.note,
              Note.transpose(beat1.note, '2m')
            ]
          }
        } else {
          if (pattern === 'end') {
            beat1.triplet = [
              Note.transpose(beat1.note, '2M'),
              Note.transpose(beat1.note, '2m'),
              beat1.note
            ]
          } else if (pattern === 'start') {
            beat1.triplet = [
              beat1.note,
              Note.transpose(beat1.note, '-2m'),
              Note.transpose(beat1.note, '-2M')
            ]
          } else {
            beat1.triplet = [
              Note.transpose(beat1.note, '2m'),
              beat1.note,
              Note.transpose(beat1.note, '-2m')
            ]
          }
        }
      }
    }

  }
}



export default TripletChooser