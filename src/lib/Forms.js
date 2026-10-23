// Song forms as sections of bars; each bar holds one chord or two (two
// beats each). Chords are roman numerals until `build` puts them in a key.
import { Chord, Interval, Note, Progression } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'

const r = (s) => s.split(' | ').map(bar => bar.split(' '))

const BLUES = r('I7 | IV7 | I7 | Vm7 I7 | IV7 | #IVo7 | I7 | VI7 | IIm7 | V7 | I7 VI7 | IIm7 V7')
const MINOR_BLUES = r('Im7 | IVm7 | Im7 | Im7 | IVm7 | IVm7 | Im7 | Im7 | bVI7 | V7 | Im7 | IIm7b5 V7')
const RHYTHM_A = r('IMaj7 VIm7 | IIm7 V7 | IIIm7 VI7 | IIm7 V7 | I7 | IVMaj7 #IVo7 | IMaj7 VI7 | IIm7 V7')
const RHYTHM_B = r('III7 | III7 | VI7 | VI7 | II7 | II7 | V7 | V7')
const STANDARD_A = r('IMaj7 | VIm7 | IIm7 | V7 | IIIm7 | VI7 | IIm7 | V7')
const STANDARD_B = r('Vm7 | I7 | IVMaj7 | IVMaj7 | IVm7 | bVII7 | IIm7 | V7')

// name -> [sections as [part, bars]], how many choruses to stay in a key,
// and how often the form is picked
export const FORMS = {
  'blues': { sections: [['blues', BLUES]], choruses: 4, weight: 30 },
  'minor blues': { sections: [['blues', MINOR_BLUES]], choruses: 4, weight: 15 },
  'rhythm changes': {
    sections: [['a', RHYTHM_A], ['a', RHYTHM_A], ['b', RHYTHM_B], ['a', RHYTHM_A]], choruses: 2, weight: 20
  },
  'AABA': {
    sections: [['a', STANDARD_A], ['a', STANDARD_A], ['b', STANDARD_B], ['a', STANDARD_A]], choruses: 2, weight: 20
  },
  // the original form: two random progressions laid out A (8) B (12) A (8)
  'ABA': { sections: null, choruses: 2, weight: 15 }
}

export function chooseForm() {
  const names = Object.keys(FORMS)
  return utils.chooseWithProbabilities(names, names.map(n => FORMS[n].weight))
}

// spread a progression's chords over a section's bars (each chord 1-4 bars)
function spreadOverBars(progression, barCount) {
  const layouts = {
    8: { 3: [2, 2, 4], 4: [2, 2, 2, 2], 6: [2, 2, 1, 1, 1, 1] },
    12: { 3: [4, 4, 4], 4: [3, 3, 3, 3], 6: [2, 2, 2, 2, 2, 2] }
  }
  const counts = layouts[barCount][progression.length]
  return progression.flatMap((chord, i) => Array(counts[i]).fill([chord]))
}

function inKey(key, bars) {
  return bars.map(bar => musicUtils.prepProgression(Progression.fromRomanNumerals(key, bar)))
}

const isDominant = (c) => Chord.get(c).type === 'dominant seventh'
const rootOf = (c) => Chord.get(c).tonic
const resolvesTo = (from, to) => to && Interval.semitones(Interval.distance(rootOf(from), rootOf(to))) % 12 === 5

// same quality, root moved by `interval`, spelled sensibly
function moveChord(chord, interval) {
  const c = Chord.get(chord)
  const root = Note.simplify(Note.transpose(c.tonic, interval))
  return musicUtils.prepProgression([root + chord.slice(c.tonic.length)])[0]
}

// Reharmonize like a bassist would: a dominant resolving down a 5th may
// become its tritone substitute, and a two-bar ii-V may side-slip a half
// step up first. `chance` scales both.
export function substitute(bars, key, chance = 1) {
  const tonic = Note.chroma(key)
  const out = bars.map(bar => bar.slice())
  const flat = () => out.flatMap((bar, b) => bar.map((chord, i) => ({ b, i, chord })))
  flat().forEach((slot, n, all) => {
    const next = all[n + 1]
    // the tonic's own dominant (bar 1 of a blues) is home, not an approach
    if (next && isDominant(slot.chord) && resolvesTo(slot.chord, next.chord) &&
        Note.chroma(rootOf(slot.chord)) !== tonic &&
        utils.random() < 0.2 * chance) {
      out[slot.b][slot.i] = moveChord(slot.chord, '5d')
    }
  })
  for (let b = 0; b < out.length - 1; b++) {
    const [ii, V] = [out[b], out[b + 1]]
    if (ii.length === 1 && V.length === 1 && Chord.get(ii[0]).type === 'minor seventh' &&
        isDominant(V[0]) && resolvesTo(ii[0], V[0]) && utils.random() < 0.12 * chance) {
      out[b] = [moveChord(ii[0], '2m'), moveChord(V[0], '2m')]
      out[b + 1] = [ii[0], V[0]]
      b++
    }
  }
  return out
}

// sections for `name` in `key`: [{ part, bars: [[chord] | [chord, chord]] }]
export function build(name, key, progA, progB, reharmonize = true) {
  if (name === 'ABA') {
    const a = spreadOverBars(progA, 8)
    const b = spreadOverBars(progB, 12)
    return [['a', a], ['b', b], ['a', a]].map(([part, bars]) => ({ part, bars }))
  }
  return FORMS[name].sections.map(([part, bars]) => {
    const concrete = inKey(key, bars)
    return { part, bars: reharmonize ? substitute(concrete, key) : concrete }
  })
}

export default { FORMS, chooseForm, build, substitute }
