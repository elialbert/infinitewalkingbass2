import utils from './utils.js'

// fills (see Fills.js): the same note or the octave is ghosted, short and
// soft; a note leading into the next beat is played, lighter than the beat
const GHOST = { velocity: 0.5, duration: '32n' }
const LEAD = { velocity: 0.65, duration: '8t' }
const GHOSTED_FILLS = ['repeat', 'octave']

// walking dynamics: a slight push on 2 and 4, a little human variation
const DYNAMICS = { downbeat: 0.8, backbeat: 0.9, jitter: 0.08 }
// two-feel pickups sit on the last triplet of a held beat
const PICKUP = { velocity: 0.6, duration: '16t' }

class Beat {
  constructor(bar, beatIdx) {
    this.bar = bar
    this.beatIdx = beatIdx
    // { kind, notes } when Fills gives this beat extra notes
    this.fill = null
  }

  // actual note choosing logic happens during second pass ie gather
  generate(note) {
    this.note = note
  }

  chooseNote(note) {
    this.note = note
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
    if (this.fill) {
      // one fill note lands on the last triplet eighth (the swung "and"),
      // two fill the beat's triplet
      const main = { note: this.note, ...this.dynamics(), duration: '8t' }
      const style = GHOSTED_FILLS.includes(this.fill.kind) ? GHOST : LEAD
      const notes = this.fill.notes.map(note => ({ note, ...style }))
      return notes.length === 1 ? [main, null, notes[0]] : [main, ...notes]
    }
    return [{ note: this.note, ...this.dynamics(), duration: '8n' }]
  }

  // what the score shows for this beat after gather: the main note, or a
  // dash for a held two-feel beat, plus any fill or pickup notes (small);
  // `beat` is the score beat number each one plays on
  display() {
    const nums = this.beatNumbers || []
    if (this.held) {
      return [{ text: '–' }, ...(this.pickup ? [{ text: this.pickup, beat: nums[0], small: true }] : [])]
    }
    if (this.fill) {
      return [{ text: this.note, beat: nums[0] },
        ...this.fill.notes.map((text, i) => ({ text, beat: nums[i + 1], small: true }))]
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
