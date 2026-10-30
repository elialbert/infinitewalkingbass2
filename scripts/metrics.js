// Objective measurements of generated walking lines, used by
// `npm run analyze` and spec/lib/musicality.spec.js.
//
// The definitions here are deliberately independent of the generator's own
// choices (e.g. which scale it picked) so they can't grade their own homework.
import { Chord, Note, Scale } from 'tonal'
import SongWriter from '../src/lib/SongWriter.js'
import utils from '../src/lib/utils.js'
import { articulate } from '../src/lib/Articulation.js'

export const RANGE = { low: Note.midi('E1'), high: Note.midi('F3') }

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
  let prev = null
  for (let i = 0; i < songs; i++) {
    const sw = new SongWriter(i, prev)
    sw.generate()
    sw.notes = sw.gather()
    result.push(sw)
    prev = sw
  }
  utils.seed(null)
  return result
}

function bump(obj, key) { obj[key] = (obj[key] || 0) + 1 }

const isDominant = (chord) => Chord.get(chord).type === 'dominant seventh'
const rootChroma = (chord) => Note.chroma(Chord.get(chord).tonic)
// a dominant going home: root down a 5th, or down a half step (tritone sub)
function isResolution(from, to) {
  if (!isDominant(from) || from === to) { return false }
  const down = (rootChroma(from) - rootChroma(to) + 12) % 12
  return down === 7 || down === 1
}

// What a fill beat plays after its main note, judged only from the notes:
// the next beat's note early, a step into it, the same note again, the
// octave, an arpeggio (three notes one way, each a 3rd to a 5th apart, about
// a string each) or another run of three or more.
function fillKind(events, nextMidi) {
  const notes = events.filter(e => e)
  if (notes.length > 2) {
    const steps = notes.slice(1).map((e, i) => Note.midi(e.note) - Note.midi(notes[i].note))
    const arpeggiated = steps.every(s => Math.abs(s) >= 3 && Math.abs(s) <= 7 && Math.sign(s) === Math.sign(steps[0]))
    return arpeggiated ? 'arpeggio' : 'run'
  }
  const main = Note.midi(notes[0].note)
  const pick = Note.midi(notes[1].note)
  if (nextMidi !== null && pick === nextMidi) { return 'anticipation' }
  if (pick === main) { return 'repeat' }
  if (Math.abs(pick - main) === 12) { return 'octave' }
  if (nextMidi !== null && Math.abs(nextMidi - pick) <= 2) { return 'approach' }
  return 'other'
}

// Rhythm of the walking bars, measured on the events the player gets (any
// beat with more than one note is a fill), with note lengths from the
// default articulation. Targets come from the FiloBass corpus (48 tracks).
function rhythm(songWriters) {
  const c = {
    bars: 0, fillBars: 0, fillByBeat: [0, 0, 0, 0], kinds: {}, fills: 0,
    afterFill: 0, fillAfterFill: 0, sameFill: 0, windows: 0, quietWindows: 0,
    mains: 0, shorts: 0, lllsBars: 0, artPairs: 0, sameArt: 0
  }
  const previous = utils.random
  utils.seed(99)
  songWriters.forEach(sw => {
    const articulated = articulate(sw.flatten(sw.notes))
    const bars = sw.bars()
    let prev = null
    let run = []
    bars.forEach((bar, bi) => {
      if (bar.twoFeel || bar.pedal) { prev = null; run = []; return }
      c.bars++
      const beats = articulated.slice(bi * 4, bi * 4 + 4)
      const nextBeats = articulated.slice(bi * 4 + 4, bi * 4 + 8)
      const firstOf = (events) => { const e = events && events.find(x => x); return e ? Note.midi(e.note) : null }
      const fills = beats.map((events, b) => {
        if (events.filter(e => e).length < 2) { return null }
        const next = b < 3 ? firstOf(beats[b + 1]) : firstOf(nextBeats[0])
        return `${b}:${fillKind(events, next)}`
      })
      fills.forEach((f, b) => {
        if (!f) { return }
        c.fills++
        c.fillByBeat[b]++
        bump(c.kinds, f.split(':')[1])
      })
      const has = fills.some(Boolean)
      if (has) { c.fillBars++ }
      if (prev) {
        if (prev.fills.some(Boolean)) {
          c.afterFill++
          if (has) { c.fillAfterFill++ }
          if (has && prev.fills.join() === fills.join()) { c.sameFill++ }
        }
      }
      // long or short main notes; a note clipped below 60% of a beat is short
      const pattern = beats.map(events => {
        const e = events.find(x => x)
        c.mains++
        const short = e.length < 0.6
        if (short) { c.shorts++ }
        return short ? 'S' : 'L'
      }).join('')
      if (pattern === 'LLLS') { c.lllsBars++ }
      if (prev) {
        c.artPairs++
        if (prev.pattern === pattern && pattern !== 'LLLL') { c.sameArt++ }
      }
      prev = { fills, pattern }
      run.push(has)
      if (run.length === 8) {
        c.windows++
        if (!run.some(Boolean)) { c.quietWindows++ }
        run = []
      }
    })
  })
  utils.setRandom(previous)
  const r = (a, b) => b ? a / b : 0
  return {
    fillBars: r(c.fillBars, c.bars),
    fillByBeat: c.fillByBeat.map(v => r(v, c.bars)),
    fillAfterFill: r(c.fillAfterFill, c.afterFill),
    sameFillNextBar: r(c.sameFill, c.afterFill),
    quietWindows: r(c.quietWindows, c.windows),
    fillKinds: Object.fromEntries(Object.entries(c.kinds).map(([k, v]) => [k, r(v, c.fills)])),
    shortNotes: r(c.shorts, c.mains),
    lllsBars: r(c.lllsBars, c.bars),
    sameShortPattern: r(c.sameArt, c.artPairs)
  }
}

// Story: what makes a line sound like it belongs to the tune. Measured per
// tune (the choruses played in one key): coming back to harmony already
// heard (a bar's chords and the chord after it), how often the bar is
// played again note for note, or lands on the same beat 1. Also the stock
// figure of hard bop walking, root then a chromatic climb up a 4th
// (D E F F# into G), over bars that start on the root and move up a 4th.
function story(songWriters) {
  const c = { heard: 0, sameBar: 0, sameBeat1: 0, up4: 0, up4Figure: 0, leaps: 0, intervals: 0, beat2: 0, bars: 0 }
  let seen = null
  songWriters.forEach(sw => {
    if (sw.chorusInKey === 0 || !seen) { seen = new Map() }
    const bars = sw.bars()
    bars.forEach((bar, i) => {
      if (bar.twoFeel || bar.pedal) { return }
      const midis = bar.beats.map(b => Note.midi(b.note))
      c.bars++
      if (Chord.get(bar.chordAt(1)).notes.map(Note.chroma).includes(midis[1] % 12)) { c.beat2++ }
      for (let k = 1; k < 4; k++) {
        c.intervals++
        if (Math.abs(midis[k] - midis[k - 1]) >= 5) { c.leaps++ }
      }
      const next = bars[i + 1]
      const key = `${bar.chords.join(' ')}>${next ? next.chords.join(' ') : ''}`
      const before = seen.get(key)
      if (before) {
        c.heard++
        if (before.some(m => m.join() === midis.join())) { c.sameBar++ }
        if (before.some(m => m[0] === midis[0])) { c.sameBeat1++ }
      }
      seen.set(key, [...(before || []), midis])
      if (!bar.chord2 && bar.nextBarFirstNote && Note.chroma(Chord.get(bar.chord).tonic) === midis[0] % 12 &&
          (rootChroma(bar.nextChord) - midis[0] % 12 + 12) % 12 === 5) {
        c.up4++
        const t = Note.midi(bar.nextBarFirstNote) - midis[0]
        if (midis[1] - midis[0] === 2 && midis[2] - midis[0] === 3 && midis[3] - midis[0] === 4 && t === 5) { c.up4Figure++ }
      }
    })
  })
  const r = (a, b) => b ? a / b : 0
  return {
    beat2ChordTone: r(c.beat2, c.bars),
    leapsInBar: r(c.leaps, c.intervals),
    recallSameBar: r(c.sameBar, c.heard),
    recallSameBeat1: r(c.sameBeat1, c.heard),
    stockFigureUp4: r(c.up4Figure, c.up4)
  }
}

export function analyze(songWriters) {
  const c = {
    bars: 0, beats: 0, invalid: 0, outOfRange: 0, awkward: 0,
    changeBars: 0, b1ChordTone: 0, b1Root: 0, b3ChordTone: 0, contourReversal: 0,
    approaches: 0, approachHalf: 0, approachWhole: 0, approachFourthFifth: 0, approachLeap: 0,
    middle: 0, outside: 0, outsideUnresolved: 0,
    intervals: 0, repeats: 0, bigLeaps: 0,
    twoFeelBars: 0, pedalBars: 0, splitBars: 0, splitBeat3Root: 0,
    oneDirection: 0, stepwiseRuns: 0, shapes: {},
    resolutions: 0, resolutionHalf: 0, changeApproaches: 0, doubleChromatic: 0, beat3OnTarget: 0,
    sameChordBars: 0, sameChordRoot: 0,
    intervalHistogram: {}, midis: []
  }

  songWriters.forEach(sw => {
    // two-feel and pedal bars are counted, but only walking bars are
    // measured as walking lines
    const allBars = sw.sections().flatMap(s => s.lines.flatMap(l => l.bars))
    allBars.forEach(bar => {
      if (bar.twoFeel) { c.twoFeelBars++ }
      if (bar.pedal) { c.pedalBars++ }
    })
    c.totalBars = (c.totalBars || 0) + allBars.length
    const bars = allBars.filter(bar => !bar.twoFeel && !bar.pedal)
    const line = []
    bars.forEach((bar, bi) => {
      c.bars++
      const notes = bar.beats.map(b => b.note)
      const midis = notes.map(n => Note.midi(n))
      const chordAt = (i) => bar.chordAt ? bar.chordAt(i) : bar.chord
      const chordChromas = Chord.get(bar.chord).notes.map(Note.chroma)
      const beat3Chromas = Chord.get(chordAt(2)).notes.map(Note.chroma)

      bar.beats.forEach(b => {
        c.beats++
        const m = Note.midi(b.note)
        if (m === null) { c.invalid++; return }
        if (m < RANGE.low || m > RANGE.high) { c.outOfRange++ }
        if (awkwardSpelling.test(b.note)) { c.awkward++ }
        c.midis.push(m)
      })

      // the bar actually played before this one (it may be two-feel or a pedal)
      const prev = bar.lastBar && bar.lastBar.chords ? bar.lastBar : null
      if (!prev || (prev.chord2 || prev.chord) !== bar.chord) {
        c.changeBars++
        if (chordChromas.includes(Note.chroma(notes[0]))) { c.b1ChordTone++ }
        if (Note.chroma(notes[0]) === chordChromas[0]) { c.b1Root++ }
      }
      if (beat3Chromas.includes(Note.chroma(notes[2]))) { c.b3ChordTone++ }
      if (bar.chord2) {
        c.splitBars++
        if (Note.chroma(notes[2]) === beat3Chromas[0]) { c.splitBeat3Root++ }
      }
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
        if (!insideChromas(chordAt(k)).has(Note.chroma(notes[k]))) {
          c.outside++
          if (Math.abs(midis[k + 1] - midis[k]) !== 1) { c.outsideUnresolved++ }
        }
      })

      const next = bars[bi + 1]
      if (next && next === bar.nextBar && next.chord === bar.lastChord) {
        c.sameChordBars++
        if (Note.chroma(next.beats[0].note) === rootChroma(next.chord)) { c.sameChordRoot++ }
      }
      if (next && next === bar.nextBar) {
        c.approaches++
        const target = Note.midi(next.beats[0].note)
        const d = Math.abs(target - midis[3])
        if (next.chord !== bar.lastChord) {
          c.changeApproaches++
          // both of beats 3 and 4 stepping in by half step, the same way
          if (d === 1 && Math.abs(midis[3] - midis[2]) === 1 && (midis[3] - midis[2]) === (target - midis[3])) {
            c.doubleChromatic++
          }
          // beat 3 already on the note the next bar lands on
          if (Note.chroma(notes[2]) === Note.chroma(next.beats[0].note)) { c.beat3OnTarget++ }
          if (isResolution(bar.lastChord, next.chord)) {
            c.resolutions++
            if (d === 1) { c.resolutionHalf++ }
          }
        }
        if (d === 1) { c.approachHalf++ }
        else if (d === 2) { c.approachWhole++ }
        else if (d === 5 || d === 7) { c.approachFourthFifth++ }
        else if (d > 7) { c.approachLeap++ }
      }
      line.push(midis)
      if (!next || next !== bar.nextBar) { line.push(null) }
    })

    const flatLine = line.flatMap(m => m === null ? [null] : m)
    for (let k = 1; k < flatLine.length; k++) {
      if (flatLine[k] === null || flatLine[k - 1] === null) { continue }
      const d = flatLine[k] - flatLine[k - 1]
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
    twoFeelBars: r(c.twoFeelBars, c.totalBars),
    pedalBars: r(c.pedalBars, c.totalBars),
    splitBars: r(c.splitBars, c.bars),
    splitBeat3Root: r(c.splitBeat3Root, c.splitBars),
    resolutionHalfStep: r(c.resolutionHalf, c.resolutions),
    doubleChromatic: r(c.doubleChromatic, c.changeApproaches),
    beat3OnTarget: r(c.beat3OnTarget, c.changeApproaches),
    sameChordRoot: r(c.sameChordRoot, c.sameChordBars),
    ...rhythm(songWriters),
    ...story(songWriters),
    intervalHistogram: Object.fromEntries(
      Object.entries(c.intervalHistogram).map(([k, v]) => [k, r(v, c.intervals)]))
  }
}
