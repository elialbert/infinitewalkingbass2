import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { Note } from 'tonal'
import { scaled } from './Knobs.js'

// skips above this jump down instead of up, and below this jump up
const SKIP_UP_LIMIT = Note.midi('A2')
const SKIP_DOWN_LIMIT = Note.midi('E2')

// chance of a skip note, in percent: rare inside the bar, likelier on beat 4,
// likeliest on beat 4 at the end of a 4-bar phrase. Averages about 10% of beats.
const SKIP_CHANCE = { inside: 5, beat4: 25, phraseEnd: 35 }

// skips are ghosted: short and soft, felt more than heard
const GHOST = { velocity: 0.5, duration: '32n' }

// walking dynamics: a slight push on 2 and 4, a little human variation
const DYNAMICS = { downbeat: 0.8, backbeat: 0.9, jitter: 0.08 }
// two-feel pickups sit on the last triplet of a held beat
const PICKUP = { velocity: 0.6, duration: '16t' }

class Beat {
  constructor(bar, beatIdx) {
    this.bar = bar
    this.beatIdx = beatIdx
    this.onlyRoot = true
    this.octaveBounce = this.chooseSkip()
    this.triplet = false
  }

  chooseSkip() {
    // half notes carry their own pickups instead
    if (this.bar.twoFeel) { return 'no' }
    let chance = SKIP_CHANCE.inside
    if (this.beatIdx == 3) {
      chance = this.bar.barIdx == 3 ? SKIP_CHANCE.phraseEnd : SKIP_CHANCE.beat4
    }
    chance = scaled(chance, 'skips')
    if (utils.chooseWithProbabilities(['yes', 'no'], [chance, 100 - chance]) === 'no') { return 'no' }
    return utils.chooseWithProbabilities(['8M', '-8M', '1P'], [25, 25, 50])
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

  dynamics() {
    const accent = this.beatIdx % 2 === 1 ? DYNAMICS.backbeat : DYNAMICS.downbeat
    return { velocity: accent + (utils.random() - 0.5) * DYNAMICS.jitter }
  }

  // what plays in this beat's slot, subdivided into triplet eighths when
  // there is more than one event; null is silence (a held note sustains)
  events() {
    if (this.held) {
      return this.pickup ? [null, null, { note: this.pickup, ...PICKUP }] : [null]
    }
    if (this.bar.twoFeel) {
      return [{ note: this.note, ...this.dynamics(), duration: '4n' }]
    }
    if (this.octaveBounce !== 'no') {
      // the skip lands on the last triplet eighth of the beat (swung)
      this.skipNote = this.bounceNote()
      return [{ note: this.note, ...this.dynamics(), duration: '8t' }, null, { note: this.skipNote, ...GHOST }]
    }
    if (this.triplet) {
      return this.triplet
    }
    return [{ note: this.note, ...this.dynamics(), duration: '8n' }]
  }

  // what the score shows for this beat after gather: the main note, or a
  // dash for a held two-feel beat, plus any skip, pickup or triplet notes
  // (small); `beat` is the score beat number each one plays on
  display() {
    const nums = this.beatNumbers || []
    if (this.held) {
      return [{ text: '–' }, ...(this.pickup ? [{ text: this.pickup, beat: nums[0], small: true }] : [])]
    }
    if (this.octaveBounce !== 'no' && this.skipNote) {
      return [{ text: this.note, beat: nums[0] }, { text: this.skipNote, beat: nums[1], small: true }]
    }
    if (this.triplet) {
      return this.triplet.map((t, i) => ({ text: t.note, beat: nums[i], small: true }))
    }
    return [{ text: this.note, beat: nums[0] }]
  }

  // each sounding note takes the next score beat number and carries it, so
  // the player highlights exactly the note it is playing
  gather() {
    const song = this.bar.line.section.song
    const events = this.events()
    this.beatNumbers = []
    return events.map(event => {
      if (event === null) { return null }
      const beat = song.beatCounter++
      this.beatNumbers.push(beat)
      return { ...event, beat }
    })
  }
}

export default Beat
