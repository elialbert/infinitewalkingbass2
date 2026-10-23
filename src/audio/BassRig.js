import * as Tone from 'tone'

// Everything the dials panel can turn. Articulation settings (legato,
// shortChance, ...) ride along and are passed through to Articulation.js.
export const DEFAULT_SETTINGS = {
  tempo: 134,
  preset: 'upright',
  octave: 0,           // 0 is real upright pitch; +1 for small speakers
  // feel
  legato: 0.92,
  shortChance: 12,
  shortLength: 0.5,
  liftChance: 40,
  laidBack: 8,         // ms behind the beat
  humanize: 6,         // ms of random timing spread
  dynamics: 1,         // 0 flattens accents, 2 exaggerates them
  ghost: 1,            // level of skips, pickups and triplet approaches
  // tone
  brightness: 320,     // Hz the pluck filter settles to
  pluck: 1.2,          // octaves the filter opens on each attack
  honk: 0.1,           // filter resonance; high values get nasal and froggy
  ring: 0.9,           // seconds a plucked note takes to decay
  bite: 6,             // cents the string starts sharp
  fingerNoise: 0.2,
  low: 6, mid: 0, high: -3,
  // room and master
  room: 0.18,
  roomSize: 1.2,
  compression: 4,
  volume: 0
}

// voice shapes: the dials keep their values, a preset only swaps the source
const PRESETS = {
  upright: { type: 'custom', partials: [1, 0.7, 0.45, 0.3, 0.18, 0.12, 0.08, 0.05], rolloff: -12, sustain: 0.15 },
  round: { type: 'triangle', rolloff: -12, sustain: 0.25 },
  classic: { type: 'square', rolloff: -24, sustain: 0.1 }
}

const MUTE_RELEASE = 0.05
const RING_RELEASE = 0.22
const GHOST_DURATIONS = ['32n', '16t']

export class BassRig {
  constructor() {
    this.voice = new Tone.MonoSynth({
      filter: { type: 'lowpass' },
      envelope: { attack: 0.006, decayCurve: 'exponential', release: RING_RELEASE },
      filterEnvelope: { attack: 0.004, decay: 0.12, sustain: 0.2, release: 0.3 }
    })
    // the fingertip on the string: a short, dark noise burst. The noise runs
    // all the time and only the envelope opens; starting and stopping a
    // noise source per note clicks.
    this.thumpFilter = new Tone.Filter({ type: 'bandpass', frequency: 700, Q: 0.8 })
    this.thump = new Tone.AmplitudeEnvelope({ attack: 0.003, decay: 0.03, sustain: 0, release: 0.02 })
    this.noise = new Tone.Noise('pink').start()
    this.noise.chain(this.thumpFilter, this.thump)
    this.eq = new Tone.EQ3({ lowFrequency: 180, highFrequency: 1800 })
    this.compressor = new Tone.Compressor({ threshold: -24, attack: 0.005, release: 0.15, knee: 6 })
    this.reverb = new Tone.Reverb({ decay: 1.2, preDelay: 0.01 })
    this.master = new Tone.Volume(0)
    this.scope = new Tone.Waveform(512)
    this.meter = new Tone.Meter({ smoothing: 0.85 })
    this.voice.connect(this.eq)
    this.thump.connect(this.eq)
    this.eq.chain(this.compressor, this.reverb, this.master, Tone.getDestination())
    this.master.fan(this.scope, this.meter)
    this.settings = { ...DEFAULT_SETTINGS }
    this.apply(this.settings)
  }

  apply(settings) {
    const prev = this.settings
    const s = this.settings = { ...settings }
    const p = PRESETS[s.preset] || PRESETS.upright
    if (prev.preset !== s.preset || !this.applied) {
      this.voice.oscillator.set(p.partials ? { type: 'custom', partials: p.partials } : { type: p.type })
    }
    this.voice.set({
      filter: { Q: s.honk, rolloff: p.rolloff },
      envelope: { decay: s.ring, sustain: p.sustain },
      filterEnvelope: { baseFrequency: s.brightness, octaves: s.pluck }
    })
    this.eq.set({ low: s.low, mid: s.mid, high: s.high })
    this.compressor.ratio.value = s.compression
    this.reverb.wet.value = s.room
    if (prev.roomSize !== s.roomSize) { this.reverb.decay = s.roomSize }
    this.master.volume.value = s.volume
    this.applied = true
  }

  // play one articulated event at audio time `time`
  play(event, time, beatSeconds) {
    const s = this.settings
    const ghosted = GHOST_DURATIONS.includes(event.duration)
    let velocity = 0.8 + (event.velocity - 0.8) * s.dynamics
    if (ghosted) { velocity *= s.ghost }
    velocity = Math.max(0.02, Math.min(1, velocity))
    const t = time + (s.laidBack + (Math.random() * 2 - 1) * s.humanize) / 1000
    const at = Math.max(t, Tone.now())
    const note = Tone.Frequency(event.note).transpose(12 * s.octave)
    // a mono voice released after the next attack would cut that note off,
    // so leave room for the next note's timing spread
    let length = (event.length ?? 0.95) * beatSeconds
    if (event.gap) { length = Math.min(length, event.gap * beatSeconds - (2 * s.humanize + 8) / 1000) }
    length = Math.max(0.03, length)
    this.voice.envelope.release = event.mute ? MUTE_RELEASE : RING_RELEASE
    if (s.bite) {
      this.voice.detune.setValueAtTime(s.bite * velocity, at)
      this.voice.detune.linearRampToValueAtTime(0, at + 0.03)
    }
    this.voice.triggerAttackRelease(note, length, at, velocity)
    if (s.fingerNoise > 0) {
      this.thump.triggerAttackRelease(0.03, at, velocity * s.fingerNoise)
    }
  }

  stop() {
    this.voice.triggerRelease()
  }
}

export default BassRig
