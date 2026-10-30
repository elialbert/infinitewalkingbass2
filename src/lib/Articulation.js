import { Note } from 'tonal'
import utils from './utils.js'

// How long each note rings, as a fraction of the time until the next note.
// The generator says what to play; this says how a player lets go of it.
// A walking line is mostly legato, but a real bassist clips some notes,
// lifts before a re-plucked repeat, and lets two-feel half notes breathe.
//
// Short notes are not sprinkled evenly: they come more often before a leap
// (where the hand shifts) and never next to another short note or on the
// same beat as one in the bar before or after, so they don't settle into a
// pattern like long-long-short-short.
export const DEFAULTS = {
  legato: 0.92,      // share of the gap a normal note fills
  shortChance: 0,    // percent of walking notes that may be played short (off: they sounded choppy)
  shortLength: 0.5,  // a short note's length, in beats
  liftChance: 40,    // percent of two-feel half notes lifted early
  ghostLength: 0.2   // ghosted fills and two-feel pickups, in beats
}

// durations the generator writes for ghosted fills and two-feel pickups
const GHOST_DURATIONS = ['32n', '16t']

// Takes the flattened chorus (one array of events per beat; null is
// silence) and returns the same shape with `length` (in beats) and `mute`
// (a fingered stop rather than a natural ring-out) on every event, plus
// `gap`, the beats until the next note starts.
// `next` is the first beat of whatever plays afterwards, if known.
//
// Each note draws its random number once and keeps it (`roll`, written onto
// the input event), so articulating again with new settings moves a dial
// smoothly: raising shortChance only adds short notes, never reshuffles.
export function articulate(beats, settings = {}, next = null) {
  const s = { ...DEFAULTS, ...settings }
  const onsets = []
  beats.forEach((events, b) => {
    events.forEach((event, i) => {
      if (event) { onsets.push({ b, i, start: b + i / events.length, event }) }
    })
  })
  const following = next && next.find(e => e)
  const out = beats.map(events => events.map(() => null))
  onsets.forEach(onset => {
    if (onset.event.roll === undefined) { onset.event.roll = utils.random() }
  })
  const byStart = new Map(onsets.map(onset => [onset.start, onset]))
  onsets.forEach((onset, k) => {
    const after = onsets[k + 1]
    const gap = after ? after.start - onset.start : beats.length - onset.start
    const nextNote = after ? after.event.note : following && following.note
    // the notes a short note must not sit beside: the ones either side, and
    // the same beat in the bars either side
    const neighbors = [onsets[k - 1], after, byStart.get(onset.start - 4), byStart.get(onset.start + 4)]
    const canClip = neighbors.every(n => !n || onset.event.roll < n.event.roll)
    out[onset.b][onset.i] = { ...onset.event, gap, ...noteLength(onset.event, gap, nextNote, s, canClip) }
  })
  return out
}

function chance(event, percent) {
  return event.roll * 100 < percent
}

// short notes are likelier before a leap of a 4th or more, rarer before a step
const SHORT_BEFORE = { leap: 1.8, step: 0.7 }

function noteLength(event, gap, nextNote, s, canClip) {
  if (GHOST_DURATIONS.includes(event.duration)) {
    return { length: Math.min(gap * s.legato, s.ghostLength), mute: true }
  }
  // two-feel half notes: ring through, or lift on the "and" of two
  if (gap >= 2) {
    if (chance(event, s.liftChance)) { return { length: 1.5, mute: true } }
    return { length: gap * s.legato, mute: false }
  }
  // a walking quarter (or longer): sometimes clipped short
  if (gap >= 1 && canClip) {
    const jump = nextNote ? Math.abs(Note.midi(nextNote) - Note.midi(event.note)) : 0
    const lean = jump >= 5 ? SHORT_BEFORE.leap : jump <= 2 ? SHORT_BEFORE.step : 1
    if (chance(event, s.shortChance * lean)) {
      return { length: Math.min(s.shortLength, gap), mute: true }
    }
  }
  // the same pitch again has to be stopped before it is plucked again
  if (nextNote === event.note) {
    return { length: gap * Math.min(s.legato, 0.8), mute: true }
  }
  return { length: gap * s.legato, mute: false }
}

export default { articulate, DEFAULTS }
