import Beat from './Beat.js'
import { Chord, Note } from 'tonal'
import NoteChooser from './NoteChooser.js'
import { planFills } from './Fills.js'
import Memory from './Memory.js'
import musicUtils from './musicUtils.js'
import utils from './utils.js'
import { scaled } from './Knobs.js'

// chance a bar of a dominant that carries on into the next bar is played
// as a pedal on its root
const PEDAL_CHANCE = 20
// two-feel pickups: a short note on the last triplet of beat 2 or 4
const PICKUP_CHANCE = { beat2: 15, beat4: 35 }

class Bar {
  // chords: one chord for the whole bar, or two (beats 1-2 and 3-4)
  constructor(line, chords, barIdx) {
    this.line = line;
    this.chords = Array.isArray(chords) ? chords : [chords]
    this.chord = this.chords[0]
    this.chord2 = this.chords[1]
    this.barIdx = barIdx // spot in line
    this.key = this.line.section.song.key
    this.twoFeel = !!this.line.twoFeel
    this.beats = []
    // respell chord tones so a Dbo7 is Db E G Bb rather than Db Fb Abb Cbb
    this.notes = Chord.get(this.chord).notes.map(n => musicUtils.spell(n, this.key))
    if (!this.notes[3]) {
      this.notes[3] = this.notes[0]
    }
  }

  // the chord sounding on a beat
  chordAt(beatIdx) {
    return beatIdx >= 2 && this.chord2 ? this.chord2 : this.chord
  }

  get lastChord() {
    return this.chord2 || this.chord
  }

  nextBarFirstNoteCallback = (note) => {
    this.nextBarFirstNote = note
  }

  firstNote() {
    return this.noteChooser.firstNote()
  }

  prepNextBar() {
    this.nextBar = this.line.nextBar(this.barIdx)
    this.nextChord = this.followingChord()
  }

  // the chord after this bar
  followingChord() {
    const next = this.line.nextBar(this.barIdx)
    return next ? next.chord : (this.line.section.song.nextChorusChord || this.lastChord)
  }

  get memory() {
    return this.line.section.song.memory
  }

  // this bar's harmony, as the memory files it
  get memoryKey() {
    return Memory.key(this.chords, this.followingChord())
  }

  // a beat 1 for the next bar that was played there before, if the next
  // bar walks over harmony already heard. The same harmony can be filed by a
  // bar inside a long chord, free to start on a 9th, so on a chord change
  // only a chord tone is taken.
  rememberedLanding() {
    const next = this.nextBar
    if (!this.memory || !next || next.twoFeel) { return null }
    const midi = this.memory.landing(next.memoryKey)
    if (midi === null) { return null }
    const first = Note.midi(this.chosenFirstNote)
    const tones = Chord.get(next.chord).notes.map(Note.chroma)
    if (next.chord !== this.lastChord && !tones.includes(midi % 12)) { return null }
    return Math.abs(midi - first) <= 12 ? Note.fromMidi(midi) : null
  }

  // play a bar again that was played on this harmony from this note before
  replay() {
    const figure = this.memory && this.memory.recall(this.memoryKey, Note.midi(this.chosenFirstNote))
    if (!figure) { return false }
    this.replayed = true
    this.nextBarFirstNoteCallback(Note.fromMidi(figure.next))
    this.setBeats([this.chosenFirstNote, ...figure.midis.slice(1).map(m => Note.fromMidi(m))])
    return true
  }

  spell(note, beatIdx) {
    return musicUtils.spell(note, this.key, this.chordAt(beatIdx))
  }

  setBeats(notes) {
    notes.forEach((note, i) => this.beats[i].chooseNote(this.spell(note, i)))
  }

  chooseNotes() {
    this.prepNextBar()
    this.noteChooser = new NoteChooser(
      this.lastChord,
      this.nextChord,
      this.lastBar && this.lastBar.nextBarFirstNote,
      this.notes,
      this.key,
      this.direction,
      this.nextBarFirstNoteCallback
    )
    this.noteChooser.barChords = this.chords
    this.chosenFirstNote = this.firstNote()
    this.noteChooser.landing = this.rememberedLanding()
    if (this.twoFeel) { return this.chooseTwoFeel() }
    if (this.isPedal() && this.choosePedal()) { return }
    if (!this.replay()) { this.chooseWalk() }
    const midis = this.beats.map(b => Note.midi(b.note))
    this.shape = [midis[1] - midis[0], midis[2] - midis[1], midis[3] - midis[2]].join(',')
    planFills(this)
    if (this.memory) { this.memory.remember(this.memoryKey, this, midis, Note.midi(this.nextBarFirstNote)) }
  }

  // beats 2-4 scored and picked toward the next bar
  chooseWalk() {
    // shapes of the last two bars, so this bar doesn't copy them
    const recentShapes = [this.lastBar, this.lastBar && this.lastBar.lastBar]
      .filter(b => b && b.shape).map(b => b.shape)
    const [beat2, beat3, beat4] = this.noteChooser.chooseBeats(recentShapes, this.resolution())
    this.cell = this.noteChooser.pick && this.noteChooser.pick.cell
    this.setBeats([this.chosenFirstNote, beat2, beat3, beat4])
  }

  // How strongly the next bar's beat 1 is an arrival: { change, resolve,
  // motion } where motion is how far the next root lies above this one (in
  // semitones, 0-11) and resolve is 2 coming home (the next section or
  // chorus, or a dominant resolving to the tonic), 1 for any other dominant
  // resolving (down a 5th, or down a half step from a tritone sub), else 0.
  resolution() {
    const from = this.lastChord
    const to = this.nextChord
    const change = from !== to
    const c = Chord.get(from)
    const down = (Note.chroma(c.tonic) - Note.chroma(Chord.get(to).tonic) + 12) % 12
    const motion = (12 - down) % 12
    if (!change) { return { change, resolve: 0, motion } }
    const sectionStart = !this.nextBar || this.nextBar.line.section !== this.line.section
    const resolving = c.type === 'dominant seventh' && (down === 7 || down === 1)
    const toTonic = Note.chroma(Chord.get(to).tonic) === Note.chroma(this.key)
    if (sectionStart || (resolving && toTonic)) { return { change, resolve: 2, motion } }
    return { change, resolve: resolving ? 1 : 0, motion }
  }

  // a dominant that lasts into the next bar, starting on its root
  isPedal() {
    if (this.chord2 || this.nextChord !== this.chord) { return false }
    if (Chord.get(this.chord).type !== 'dominant seventh') { return false }
    if (Note.chroma(this.chosenFirstNote) !== Note.chroma(Chord.get(this.chord).tonic)) { return false }
    const chance = scaled(PEDAL_CHANCE, 'pedals')
    return utils.chooseWithProbabilities(['yes', 'no'], [chance, 100 - chance]) === 'yes'
  }

  // root on 1, 2 and 3, then a half step into the next bar; false (and the
  // bar walks instead) if that half step is more than a 5th from the root
  choosePedal() {
    const target = this.noteChooser.runNextBarFirstNote()
    const first = this.chosenFirstNote
    const fromBelow = Note.midi(target) > Note.midi(first)
    const approach = musicUtils.foldIntoRange(Note.transpose(target, fromBelow ? '-2m' : '2m'))
    if (Math.abs(Note.midi(approach) - Note.midi(first)) > 7) { return false }
    this.pedal = true
    this.setBeats([first, first, first, approach])
    return true
  }

  // half notes: beat 1, then the 5th or 3rd (or the second chord's root) on
  // beat 3, with an occasional pickup into beat 3 or the next bar
  chooseTwoFeel() {
    const first = this.chosenFirstNote
    const target = this.noteChooser.runNextBarFirstNote()
    const mid = Note.fromMidi(Math.round((Note.midi(first) + Note.midi(target)) / 2))
    let options
    if (this.chord2) {
      options = [Chord.get(this.chord2).tonic]
    } else {
      const tones = Chord.get(this.chord).notes
      options = utils.chooseWithProbabilities(['fifth', 'third'], [70, 30]) === 'fifth'
        ? [tones[2], tones[1]] : [tones[1], tones[2]]
    }
    let beat3 = options.map(pc => musicUtils.foldIntoRange(musicUtils.nearest(pc, mid)))
      .find(n => Note.midi(n) !== Note.midi(first))
    if (!beat3) { beat3 = musicUtils.foldIntoRange(Note.transpose(first, '5P')) }
    this.setBeats([first, first, beat3, beat3])
    this.beats[1].held = true
    this.beats[3].held = true

    const pickupInto = (goal, from) => {
      const below = Note.midi(goal) > Note.midi(from)
      return musicUtils.foldIntoRange(Note.transpose(goal, below ? '-2m' : '2m'))
    }
    const chance = (pct) => {
      pct = scaled(pct, 'pickups')
      return utils.chooseWithProbabilities(['yes', 'no'], [pct, 100 - pct]) === 'yes'
    }
    if (chance(PICKUP_CHANCE.beat2)) { this.beats[1].pickup = this.spell(pickupInto(beat3, first), 2) }
    if (chance(PICKUP_CHANCE.beat4)) { this.beats[3].pickup = this.spell(pickupInto(target, beat3), 3) }
  }

  generate() {
    Array(4).fill(1).map((_, beatIdx) => {
      let beat = new Beat(this, beatIdx)
      // just pass in the root note on this pass
      // actual note choosing logic on gather pass
      beat.generate(this.notes[beatIdx])
      this.beats.push(beat)
    })
  }

  // fresh beats and note choices, keeping the chords, direction and links
  regenerate() {
    this.beats = []
    this.pedal = this.replayed = false
    if (this.memory) { this.memory.forget(this) }
    this.shape = this.cell = this.nextBarFirstNote = this.mood = undefined
    this.generate()
  }

  gather() {
    // where this bar's beat numbers start, so it can be regenerated in place
    this.firstBeatNumber = this.line.section.song.beatCounter
    this.chooseNotes()
    return this.beats.map(function(beat) {
      return beat.gather()
    })
  }
}

export default Bar
