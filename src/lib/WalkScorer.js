// Chooses beats 2, 3 and 4 of a walking bar together: every reasonable
// candidate is generated, unplayable or unresolved ones are rejected, the
// rest are scored, and one is picked with a softmax over the scores.
//
// Works in midi numbers; Bar spells the result.
import { Chord, Interval, Note, Scale } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'
import { knobs } from './Knobs.js'

const LOW = Note.midi(musicUtils.RANGE_LOW)
const HIGH = Note.midi(musicUtils.RANGE_HIGH)

// the mode a bassist hears over each chord quality; notes outside it (and
// outside the chord) are chromatic and must resolve by half step
const MODE = {
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

// Vocabulary cells as degrees of the chord; '-' means an octave lower.
// A bar matching a cell's first three notes gets a bonus, all four a bigger one.
export const CELLS = {
  '1-2-3-5': ['1', '2', '3', '5'],
  '1-3-5-6': ['1', '3', '5', '6'],
  '1-7-6-5 down': ['1', '7-', '6-', '5-'],
  '1-5-8-7': ['1', '5', '8', '7'],
  '1-2-b3-3': ['1', '2', 'b3', '3'],
  '5-#5-6-7': ['5', '#5', '6', '7'],
  '3-2-1-7 down': ['3', '2', '1', '7-'],
  '1-5-3 down': ['1', '5-', '3-', '2-'],
  '1-8-7-6': ['1', '8', '7', '6'],
  '1-3-2-1': ['1', '3', '2', '1']
}

// score weights; the softmax temperature sets how adventurous the pick is
export const WEIGHTS = {
  temperature: 0.8,
  beat3ChordTone: 0.6,
  beat3Chromatic: -0.5,
  beat2ChordTone: 0.5,
  beat2Inside: 0.5,
  approachHalfStep: 1.6,
  approachWholeStep: 1.2,
  approachFourthFifth: 0.6,
  approachThird: 0.3,
  approachLeap: -3,
  step: 0.9,
  third: 0.3,
  tritone: -1,
  leapOverFifth: -1.5,
  octave: -0.5,
  repeat: -2,
  stepwiseRun: 0,
  reversal: -1.2,
  extraLeap: -1.5,
  sameShape: -1.5,
  splitRoot: 2.5,
  cellStart: 1,
  cellWhole: 0.5
}

const APPROACHES = [-1, 1, -2, 2, -5, 7, -7, 5, -3, 3, -4, 4]

// semitones above the root for each degree token over this chord
export function degrees(chord) {
  const c = Chord.get(chord)
  const tones = c.intervals.map(Interval.semitones)
  const mode = Scale.get(`${c.tonic} ${MODE[c.type] || 'major'}`).intervals.map(Interval.semitones)
  const seven = mode.length === 7 ? mode : [0, 2, tones[1] ?? 4, 5, tones[2] ?? 7, 9, tones[3] ?? 11]
  const d = {
    '1': 0, '2': seven[1], '3': tones[1] ?? seven[2], '4': seven[3],
    '5': tones[2] ?? seven[4], '6': seven[5],
    '7': tones[3] >= 10 ? tones[3] : seven[6], '8': 12
  }
  d['b3'] = d['3'] - 1
  d['#5'] = d['5'] + 1
  return d
}

function tokenSemis(degs, token) {
  return token.endsWith('-') ? degs[token.slice(0, -1)] - 12 : degs[token]
}

// what counts as a chord tone, inside, and a vocabulary cell over one chord
function harmony(chord) {
  const c = Chord.get(chord)
  const chordChromas = new Set(c.notes.map(Note.chroma))
  const inside = new Set(chordChromas)
  Scale.get(`${c.tonic} ${MODE[c.type] || 'major'}`).notes.forEach(n => inside.add(Note.chroma(n)))
  const degs = degrees(chord)
  // cells whose degrees collapse (e.g. b3 over a minor chord) don't apply
  const cells = Object.entries(CELLS)
    .map(([name, tokens]) => [name, tokens.map(t => tokenSemis(degs, t))])
    .filter(([, semis]) => new Set(semis).size === semis.length)
  return { rootChroma: Note.chroma(c.tonic), chordChromas, inside, cells }
}

class WalkScorer {
  // chord2, if given, sounds on beats 3 and 4
  constructor(chord, chord2) {
    this.split = !!chord2
    const first = harmony(chord)
    const second = chord2 ? harmony(chord2) : first
    Object.assign(this, first)
    // the harmony under beats 1 to 4
    this.byBeat = [first, first, second, second]
  }

  isChordTone(midi, beat = 0) { return this.byBeat[beat].chordChromas.has(midi % 12) }
  isInside(midi, beat = 0) { return this.byBeat[beat].inside.has(midi % 12) }

  // all candidate [beat2, beat3, beat4] from beat 1 toward the next bar's beat 1
  candidates(first, target) {
    const result = []
    const inRange = (m) => m >= LOW && m <= HIGH
    for (let b2 = first - 7; b2 <= first + 7; b2++) {
      if (!inRange(b2)) { continue }
      for (let b3 = b2 - 7; b3 <= b2 + 7; b3++) {
        if (!inRange(b3)) { continue }
        // a chromatic note arrives by step or small skip and leaves by half step
        if (!this.isInside(b2, 1) && (Math.abs(b2 - first) > 4 || Math.abs(b3 - b2) !== 1)) { continue }
        if (!this.isInside(b3, 2) && Math.abs(b3 - b2) > 4) { continue }
        // the second chord of a split bar arrives on a fresh chord tone
        if (this.split && (!this.isChordTone(b3, 2) || b3 === b2)) { continue }
        APPROACHES.forEach(a => {
          const b4 = target + a
          if (!inRange(b4) || Math.abs(b4 - b3) > 12) { return }
          if (!this.isInside(b3, 2) && Math.abs(b4 - b3) !== 1) { return }
          // an outside beat 4 must lead into the target by step
          if (!this.isInside(b4, 3) && (Math.abs(a) > 2 || Math.abs(b4 - b3) > 5)) { return }
          result.push([b2, b3, b4])
        })
      }
    }
    return result
  }

  // the cell this bar plays, if any: [name, wholeCellMatched]
  matchCell(notes) {
    if (this.split) { return [null, false] }
    for (const [name, semis] of this.cells) {
      const root = notes[0] - semis[0]
      if ((root - this.rootChroma) % 12 !== 0) { continue }
      if (notes[1] === root + semis[1] && notes[2] === root + semis[2]) {
        return [name, notes[3] === root + semis[3]]
      }
    }
    return [null, false]
  }

  score(first, cand, target, recentShapes) {
    const W = WEIGHTS
    const notes = [first, ...cand]
    const [b2, b3, b4] = cand
    let s = 0

    if (this.isChordTone(b3, 2)) { s += W.beat3ChordTone } else if (!this.isInside(b3, 2)) { s += W.beat3Chromatic }
    if (this.split && b3 % 12 === this.byBeat[2].rootChroma) { s += W.splitRoot }
    if (this.isChordTone(b2, 1)) { s += W.beat2ChordTone } else if (this.isInside(b2, 1)) { s += W.beat2Inside }

    const approach = Math.abs(target - b4)
    if (approach === 1) { s += W.approachHalfStep }
    else if (approach === 2) { s += W.approachWholeStep }
    else if (approach === 5 || approach === 7) { s += W.approachFourthFifth }
    else if (approach === 3 || approach === 4) { s += W.approachThird }
    else { s += W.approachLeap }

    const steps = [b2 - first, b3 - b2, b4 - b3]
    steps.forEach(d => {
      const a = Math.abs(d)
      if (a === 0) { s += W.repeat }
      else if (a <= 2) { s += W.step }
      else if (a <= 4) { s += W.third }
      else if (a === 6) { s += W.tritone }
      else if (a === 12) { s += W.octave }
      else if (a > 7) { s += W.leapOverFifth }
    })
    // one leap of a 4th or more gives a bar shape; more makes it jumpy
    const leaps = steps.filter(d => Math.abs(d) >= 5).length
    if (leaps > 1) { s += W.extraLeap * (leaps - 1) }
    if (steps[0] * steps[1] < 0) { s += W.reversal }
    const oneWay = steps.every(d => d > 0) || steps.every(d => d < 0)
    if (oneWay && steps.every(d => Math.abs(d) <= 2)) { s += W.stepwiseRun }

    const shape = steps.join(',')
    if (recentShapes.includes(shape)) { s += W.sameShape }

    const [cell, whole] = this.matchCell(notes)
    if (cell) { s += W.cellStart + (whole ? W.cellWhole : 0) }
    if (knobs.chromatic) {
      s += knobs.chromatic * cand.filter((m, i) => !this.isInside(m, i + 1)).length
    }
    return s
  }

  // pick beats 2-4; returns { notes: [b2, b3, b4] as midi, shape, cell }
  choose(first, target, recentShapes = []) {
    const cands = this.candidates(first, target)
    if (cands.length === 0) { return null }
    const scores = cands.map(c => this.score(first, c, target, recentShapes))
    const top = Math.max(...scores)
    const temperature = WEIGHTS.temperature * knobs.adventure
    const weights = scores.map(s => Math.exp((s - top) / temperature))
    const total = weights.reduce((a, b) => a + b, 0)
    let r = utils.random() * total
    let idx = 0
    while (idx < weights.length - 1 && r >= weights[idx]) { r -= weights[idx]; idx++ }
    const chosen = cands[idx]
    const steps = [chosen[0] - first, chosen[1] - chosen[0], chosen[2] - chosen[1]]
    return { notes: chosen, shape: steps.join(','), cell: this.matchCell([first, ...chosen])[0] }
  }
}

export default WalkScorer
