import Beat from './Beat.js'
import { Chord, Note } from 'tonal'
import NoteChooser from './NoteChooser.js'
import TripletChooser from './TripletChooser.js'
import musicUtils from './musicUtils.js'
import utils from './utils.js'

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
    if (this.nextBar) {
      this.nextChord = this.nextBar.chord
    } else {
      this.nextChord = this.line.section.song.nextChorusChord || this.lastChord
    }
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
    if (this.twoFeel) { return this.chooseTwoFeel() }
    if (this.isPedal()) { return this.choosePedal() }

    // shapes of the last two bars, so this bar doesn't copy them
    const recentShapes = [this.lastBar, this.lastBar && this.lastBar.lastBar]
      .filter(b => b && b.shape).map(b => b.shape)
    const [beat2, beat3, beat4] = this.noteChooser.chooseBeats(recentShapes)
    this.cell = this.noteChooser.pick && this.noteChooser.pick.cell
    this.setBeats([this.chosenFirstNote, beat2, beat3, beat4])
    const midis = this.beats.map(b => Note.midi(b.note))
    this.shape = [midis[1] - midis[0], midis[2] - midis[1], midis[3] - midis[2]].join(',')
    this.tripletChooser = new TripletChooser(this)
  }

  // a dominant that lasts into the next bar, starting on its root
  isPedal() {
    if (this.chord2 || this.nextChord !== this.chord) { return false }
    if (Chord.get(this.chord).type !== 'dominant seventh') { return false }
    if (Note.chroma(this.chosenFirstNote) !== Note.chroma(Chord.get(this.chord).tonic)) { return false }
    return utils.chooseWithProbabilities(['yes', 'no'], [PEDAL_CHANCE, 100 - PEDAL_CHANCE]) === 'yes'
  }

  // root on 1, 2 and 3, then a half step into the next bar
  choosePedal() {
    this.pedal = true
    const target = this.noteChooser.runNextBarFirstNote()
    const first = this.chosenFirstNote
    const fromBelow = Note.midi(target) > Note.midi(first)
    const approach = musicUtils.foldIntoRange(Note.transpose(target, fromBelow ? '-2m' : '2m'))
    this.setBeats([first, first, first, approach])
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
    const chance = (pct) => utils.chooseWithProbabilities(['yes', 'no'], [pct, 100 - pct]) === 'yes'
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

  gather() {
    this.chooseNotes()
    return this.beats.map(function(beat) {
      return beat.gather()
    })
  }
}

export default Bar
