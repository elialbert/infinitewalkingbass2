// Fills: the notes a walking bassist slips in between beats, on the swung
// "and" (the last triplet eighth) or as a triplet run into the next beat.
//
// Tuned against the FiloBass corpus (48 tracks, about 11,000 walking bars):
// about 29% of bars carry a fill, spread over all four beats rather than
// piled onto beat 4, and they come in stretches, busy for a few bars and
// then plain for a while, not at a steady rate. Most fills lead somewhere:
// the next beat's note played early, or a step into it.
import { Note } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { scaled } from './Knobs.js'

// The line is calm or busy for a few bars at a time: the percent of bars
// with a fill in each mood, and the percent chance of staying in it.
export const MOODS = {
  calm: { fill: 8, stay: 90 },
  busy: { fill: 72, stay: 78 }
}
// fills in a bar that has any (1.4 per fill bar in the corpus)
const COUNTS = [[1, 2, 3], [68, 27, 5]]
// which beat gets a fill (FiloBass: 12 / 8 / 9 / 12% of bars)
const BEAT_WEIGHTS = [12, 8, 9, 12]
// what a fill plays, in percent
export const KINDS = {
  anticipation: 25, // the next beat's note, early
  approach: 26,     // a half step into the next beat's note
  repeat: 22,       // the same note again, ghosted
  run: 19,          // two triplet notes walking into the next beat
  octave: 8         // the octave, ghosted
}

// octave skips above this go down, and below it go up
const OCTAVE_UP_BELOW = Note.midi('A2')
const LOW = Note.midi(musicUtils.RANGE_LOW)
const HIGH = Note.midi(musicUtils.RANGE_HIGH)
const inRange = (m) => m >= LOW && m <= HIGH

const pickWeighted = (values, weights) => {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = utils.random() * total
  for (let i = 0; i < values.length; i++) {
    r -= weights[i]
    if (r < 0) { return values[i] }
  }
  return values[values.length - 1]
}

// the fill notes (midi) after `main` leading to `next`, or null if this
// kind doesn't fit here
export function fillNotes(kind, main, next) {
  const dir = Math.sign(next - main) || 1
  const fits = (notes) => notes.every(inRange) ? notes : null
  switch (kind) {
    case 'anticipation':
      return next === main ? null : fits([next])
    case 'approach': {
      // from the side the line is coming from, else from the other side
      const near = next - dir
      if (near !== main && inRange(near)) { return [near] }
      const far = next + dir
      return far !== main && inRange(far) ? [far] : null
    }
    case 'repeat':
      return [main]
    case 'octave':
      return fits([main < OCTAVE_UP_BELOW ? main + 12 : main - 12])
    case 'run': {
      if (Math.abs(next - main) < 2) { return null }
      const shapes = {
        chromatic: [next - 2 * dir, next - dir], // two half steps in
        enclosure: [next + dir, next - dir],     // above, below, then home
        scoop: [main, next - dir]                // the note again, then a half step in
      }
      let notes = shapes[pickWeighted(['chromatic', 'enclosure', 'scoop'], [50, 30, 20])]
      // a whole step apart, the chromatic run would start on the beat's own note
      if (notes[0] === main && notes !== shapes.scoop) { notes = shapes.enclosure }
      if (Math.abs(notes[0] - main) > 7) { return null }
      return fits(notes)
    }
  }
  return null
}

// Decide the fills for a walking bar whose beats (and the next bar's first
// note) are chosen. Sets bar.mood, and beat.fill = { kind, notes } on the
// beats that get one; the notes are spelled note names.
export function planFills(bar) {
  const before = bar.lastBar && bar.lastBar.mood
  let mood = before || 'calm'
  if (before && utils.random() * 100 >= MOODS[mood].stay) {
    mood = mood === 'calm' ? 'busy' : 'calm'
  }
  bar.mood = mood
  const chance = scaled(MOODS[mood].fill, 'fills')
  if (utils.random() * 100 >= chance) { return }

  const count = pickWeighted(...COUNTS)
  const open = [0, 1, 2, 3]
  for (let n = 0; n < count; n++) {
    const beatIdx = pickWeighted(open, open.map(b => BEAT_WEIGHTS[b]))
    open.splice(open.indexOf(beatIdx), 1)
    const beat = bar.beats[beatIdx]
    const main = Note.midi(beat.note)
    const nextNote = beatIdx < 3 ? bar.beats[beatIdx + 1].note : bar.nextBarFirstNote
    const next = Note.midi(nextNote)
    if (main === null || next === null) { continue }
    const kinds = Object.keys(KINDS)
    // a kind that doesn't fit gives way to the next one that does, ending
    // with the repeat, which always fits
    const fallbacks = ['anticipation', 'approach', 'repeat']
    let kind = pickWeighted(kinds, kinds.map(k => KINDS[k]))
    let notes = fillNotes(kind, main, next)
    for (const k of fallbacks) {
      if (notes) { break }
      kind = k
      notes = fillNotes(kind, main, next)
    }
    const chord = beatIdx === 3 ? bar.nextChord : bar.chordAt(beatIdx)
    beat.fill = {
      kind,
      notes: notes.map(m => musicUtils.spell(Note.fromMidi(m), bar.key, chord))
    }
  }
}

export default { planFills, fillNotes, MOODS, KINDS }
