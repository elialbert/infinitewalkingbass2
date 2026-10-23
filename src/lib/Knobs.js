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

export const knobs = { ...KNOB_DEFAULTS }

// take the knob values out of any settings object; other keys are ignored
export function setKnobs(values = {}) {
  Object.keys(KNOB_DEFAULTS).forEach(k => {
    knobs[k] = values[k] ?? KNOB_DEFAULTS[k]
  })
}

// a percent chance scaled by a knob, kept within 0-100
export function scaled(percent, knob) {
  return Math.max(0, Math.min(100, percent * knobs[knob]))
}

export default { knobs, setKnobs, scaled, KNOB_DEFAULTS }
