import utils from './utils.js'

// Live generator controls. Each is a multiplier on the tuned constant it
// names (1 = as tuned), except chromatic, a score bonus per outside note
// (0 = as tuned). The player sets these from the dials; the generator reads
// them as it writes each bar.
export const KNOB_DEFAULTS = {
  skips: 1,      // Beat SKIP_CHANCE
  triplets: 1,   // TripletChooser TRIPLET_CHANCE
  pedals: 1,     // Bar PEDAL_CHANCE
  pickups: 1,    // Bar PICKUP_CHANCE (two-feel)
  adventure: 1,  // WalkScorer temperature: higher strays further from the top pick
  chromatic: 0   // WalkScorer bonus (or, below 0, penalty) per outside note
}

// Over a long listen the line wanders: each new chorus nudges one knob a
// step past its dial, up to `max` (25%) and then back down to the dial, and
// so on. Multipliers drift by that fraction of the dial; chromatic, a bonus
// rather than a multiplier, by the same amount added on. The drift rides on
// top of the dials and is never saved.
const DRIFT = { step: 0.05, max: 0.25 }

const dials = { ...KNOB_DEFAULTS }
const drift = Object.fromEntries(Object.keys(KNOB_DEFAULTS).map(k => [k, { amount: 0, dir: 1 }]))

// what the generator reads: the dials plus the drift
export const knobs = { ...KNOB_DEFAULTS }

function update() {
  Object.keys(KNOB_DEFAULTS).forEach(k => {
    const d = drift[k].amount
    knobs[k] = k === 'chromatic' ? dials[k] + d : dials[k] * (1 + d)
  })
}

// take the knob values out of any settings object; other keys are ignored
export function setKnobs(values = {}) {
  Object.keys(KNOB_DEFAULTS).forEach(k => {
    dials[k] = values[k] ?? KNOB_DEFAULTS[k]
  })
  update()
}

// move one knob, picked at random, a step along its drift
export function stepDrift() {
  const d = drift[utils.randFromArray(Object.keys(KNOB_DEFAULTS))]
  d.amount = Math.round((d.amount + d.dir * DRIFT.step) * 100) / 100
  if (d.amount >= DRIFT.max) { d.amount = DRIFT.max; d.dir = -1 }
  if (d.amount <= 0) { d.amount = 0; d.dir = 1 }
  update()
}

export function resetDrift() {
  Object.values(drift).forEach(d => { d.amount = 0; d.dir = 1 })
  update()
}

// the knobs drifted off their dials, e.g. "adventure +10%, chromatic +0.05"
export function driftSummary() {
  return Object.keys(KNOB_DEFAULTS).filter(k => drift[k].amount > 0).map(k => {
    const d = drift[k].amount
    return k === 'chromatic' ? `${k} +${d.toFixed(2)}` : `${k} +${Math.round(d * 100)}%`
  }).join(', ')
}

// a percent chance scaled by a knob, kept within 0-100
export function scaled(percent, knob) {
  return Math.max(0, Math.min(100, percent * knobs[knob]))
}

export default { knobs, setKnobs, stepDrift, resetDrift, driftSummary, scaled, KNOB_DEFAULTS }
