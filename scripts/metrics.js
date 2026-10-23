// Objective measurements of generated walking lines, used by
// `npm run analyze` and spec/lib/musicality.spec.js.
//
// The definitions here are deliberately independent of the generator's own
// choices (e.g. which scale it picked) so they can't grade their own homework.
import { Chord, Note, Scale } from 'tonal'
import SongWriter from '../src/lib/SongWriter.js'
import utils from '../src/lib/utils.js'

export const RANGE = { low: Note.midi('E1'), high: Note.midi('D3') }

// the "inside" notes over a chord: chord tones plus its standard mode
const modeForType = {
  'major seventh': 'major',
  'sixth': 'major',
  'major': 'major',
  'minor seventh': 'dorian',
  'minor': 'dorian',
  'dominant seventh': 'mixolydian',
  'diminished seventh': 'whole-half diminished',
  'diminished': 'whole-half diminished',
  'half-diminished': 'locrian #2',
  'minor sixth': 'melodic minor',
  'minor/major seventh': 'melodic minor'
}

function insideChromas(chord) {
  const c = Chord.get(chord)
  const set = new Set(c.notes.map(Note.chroma))
  const mode = modeForType[c.type]
  if (mode) { Scale.get(`${c.tonic} ${mode}`).notes.forEach(n => set.add(Note.chroma(n))) }
  return set
}

const awkwardSpelling = /(##|bb|x)\d|^(B#|E#|Cb|Fb)/

// generate `songs` consecutive choruses (like the player does) from `seed`
export function generateSongs(songs, seed) {
  utils.seed(seed)
  const result = []
  for (let i = 0; i < songs; i++) {
    const sw = new SongWriter(i)
    sw.generate()
    sw.notes = sw.gather()
    result.push(sw)
  }
  utils.seed(null)
  return result
}

function bump(obj, key) { obj[key] = (obj[key] || 0) + 1 }

export function analyze(songWriters) {
  const c = {
    bars: 0, beats: 0, invalid: 0, outOfRange: 0, awkward: 0,
    changeBars: 0, b1ChordTone: 0, b1Root: 0, b3ChordTone: 0, contourReversal: 0,
    approaches: 0, approachHalf: 0, approachWhole: 0, approachFourthFifth: 0, approachLeap: 0,
    middle: 0, outside: 0, outsideUnresolved: 0,
    intervals: 0, repeats: 0, bigLeaps: 0,
    skips: 0, tripletBars: 0, oneDirection: 0, stepwiseRuns: 0, shapes: {},
    intervalHistogram: {}, midis: []
  }

  songWriters.forEach(sw => {
    const bars = sw.sections().flatMap(s => s.lines.flatMap(l => l.bars))
    const line = []
    bars.forEach((bar, bi) => {
      c.bars++
      const notes = bar.beats.map(b => b.note)
      const midis = notes.map(n => Note.midi(n))
      const chordChromas = Chord.get(bar.chord).notes.map(Note.chroma)
      const inside = insideChromas(bar.chord)

      bar.beats.forEach(b => {
        c.beats++
        const m = Note.midi(b.note)
        if (m === null) { c.invalid++; return }
        if (m < RANGE.low || m > RANGE.high) { c.outOfRange++ }
        if (awkwardSpelling.test(b.note)) { c.awkward++ }
        if (b.octaveBounce !== 'no') { c.skips++ }
        c.midis.push(m)
      })
      if (bar.beats.some(b => b.triplet)) { c.tripletBars++ }

      const prev = bars[bi - 1]
      if (!prev || prev.chord !== bar.chord) {
        c.changeBars++
        if (chordChromas.includes(Note.chroma(notes[0]))) { c.b1ChordTone++ }
        if (Note.chroma(notes[0]) === chordChromas[0]) { c.b1Root++ }
      }
      if (chordChromas.includes(Note.chroma(notes[2]))) { c.b3ChordTone++ }
      if ((midis[1] - midis[0]) * (midis[2] - midis[1]) < 0) { c.contourReversal++ }

      // the bar's shape: one direction all the way is what makes a line sound
      // like scale runs; a stepwise run is the plainest case of that
      const steps = [midis[1] - midis[0], midis[2] - midis[1], midis[3] - midis[2]]
      if (steps.every(d => d > 0) || steps.every(d => d < 0)) {
        c.oneDirection++
        if (steps.every(d => Math.abs(d) <= 2)) { c.stepwiseRuns++ }
      }
      bump(c.shapes, steps.join(','))

      // beats 2 and 3: outside the harmony, and whether they resolve by half step
      ;[1, 2].forEach(k => {
        c.middle++
        if (!inside.has(Note.chroma(notes[k]))) {
          c.outside++
          if (Math.abs(midis[k + 1] - midis[k]) !== 1) { c.outsideUnresolved++ }
        }
      })

      const next = bars[bi + 1]
      if (next) {
        c.approaches++
        const d = Math.abs(Note.midi(next.beats[0].note) - midis[3])
        if (d === 1) { c.approachHalf++ }
        else if (d === 2) { c.approachWhole++ }
        else if (d === 5 || d === 7) { c.approachFourthFifth++ }
        else if (d > 7) { c.approachLeap++ }
      }
      line.push(...midis)
    })

    for (let k = 1; k < line.length; k++) {
      const d = line[k] - line[k - 1]
      c.intervals++
      bump(c.intervalHistogram, d)
      if (d === 0) { c.repeats++ }
      if (Math.abs(d) > 7) { c.bigLeaps++ }
    }
  })

  const sorted = c.midis.slice().sort((a, b) => a - b)
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
  const r = (a, b) => b ? a / b : 0
  const shapeCounts = Object.values(c.shapes)

  return {
    bars: c.bars,
    beats: c.beats,
    invalidNotes: c.invalid,
    outOfRange: r(c.outOfRange, c.beats),
    awkwardSpelling: r(c.awkward, c.beats),
    lowest: Note.fromMidi(sorted[0]),
    highest: Note.fromMidi(sorted[sorted.length - 1]),
    p5: Note.fromMidi(at(0.05)),
    median: Note.fromMidi(at(0.5)),
    p95: Note.fromMidi(at(0.95)),
    beat1ChordToneOnChange: r(c.b1ChordTone, c.changeBars),
    beat1RootOnChange: r(c.b1Root, c.changeBars),
    beat3ChordTone: r(c.b3ChordTone, c.bars),
    contourReversal: r(c.contourReversal, c.bars),
    oneDirectionBars: r(c.oneDirection, c.bars),
    stepwiseRuns: r(c.stepwiseRuns, c.bars),
    topShapeShare: r(Math.max(...shapeCounts), c.bars),
    distinctShapes: shapeCounts.length,
    approachHalfStep: r(c.approachHalf, c.approaches),
    approachWholeStep: r(c.approachWhole, c.approaches),
    approachFourthFifth: r(c.approachFourthFifth, c.approaches),
    approachLeap: r(c.approachLeap, c.approaches),
    outsideBeats23: r(c.outside, c.middle),
    outsideUnresolved: r(c.outsideUnresolved, c.middle),
    repeatedNotes: r(c.repeats, c.intervals),
    leapsOverFifth: r(c.bigLeaps, c.intervals),
    skipBeats: r(c.skips, c.beats),
    tripletBars: r(c.tripletBars, c.bars),
    intervalHistogram: Object.fromEntries(
      Object.entries(c.intervalHistogram).map(([k, v]) => [k, r(v, c.intervals)]))
  }
}
