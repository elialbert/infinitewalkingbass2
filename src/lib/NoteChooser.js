import { Chord, Interval, Note, Scale } from 'tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'
import WalkScorer from './WalkScorer.js'

// bar-start notes below/above these turn the line around
const TURN_UP_BELOW = Note.midi('A1')
const TURN_DOWN_ABOVE = Note.midi('Bb2')

class NoteChooser {
  constructor(chord, nextChord, lastBarNextBarFirstNote, notes, key,
    direction,
    nextBarFirstNoteCallback) {
    this.chord = chord
    this.root = musicUtils.chordRoot(this.chord)
    this.chosenScale = musicUtils.chooseScale(this.chord)
    this.nextChord = nextChord
    this.lastBarNextBarFirstNote = lastBarNextBarFirstNote
    this.notes = notes
    this.key = key
    this.direction = direction || 'down'
    this.octave = musicUtils.noteOctave(lastBarNextBarFirstNote)
    this.nextBarFirstNoteCallback = nextBarFirstNoteCallback
  }

  // ascending scale notes of the current chord between two notes (inclusive)
  scaleRange(from, to) {
    return Scale.rangeOf(`${this.root} ${this.chosenScale}`)(from, to)
  }

  firstNote() {
    this.chosenFirstNote = this.lastBarNextBarFirstNote || musicUtils.appendOctaveInteger(this.notes[0], this.octave)
    return this.chosenFirstNote
  }

  // put pitch class `pc` just above (up) or just below (down) `from`;
  // if that leaves the bass range, turn the line around instead
  placeInDirection(pc, from, allowSame) {
    const place = (direction) => {
      let note = musicUtils.appendOctaveInteger(Note.pitchClass(pc), musicUtils.noteOctave(from))
      const dist = musicUtils.semiDistance(from, note)
      if (direction == 'up' && (dist < 0 || (dist == 0 && !allowSame))) {
        note = Note.transpose(note, '8P')
      }
      if (direction == 'down' && (dist > 0 || (dist == 0 && !allowSame))) {
        note = Note.transpose(note, '-8P')
      }
      return note
    }
    let note = place(this.direction)
    if (!musicUtils.inRange(note)) {
      this.direction = this.direction == 'up' ? 'down' : 'up'
      note = place(this.direction)
    }
    return musicUtils.foldIntoRange(note)
  }

  runNextBarFirstNote() {
    const newNotes = Chord.get(this.nextChord).notes
    let nextBarFirstNote

    const firstMidi = Note.midi(this.chosenFirstNote)
    if (firstMidi <= TURN_UP_BELOW) {
      this.direction = 'up'
    }
    if (firstMidi >= TURN_DOWN_ABOVE) {
      this.direction = 'down'
    }

    if (this.chord !== this.nextChord) {
      const options = [newNotes[0], newNotes[1], newNotes[2]]
      const pc = utils.chooseWithProbabilities(options, [80, 10, 10])
      nextBarFirstNote = this.placeInDirection(pc, this.chosenFirstNote, true)
    } else {
      // Same chord continues — prefer chord tones to stay grounded
      const sameChordChoice = utils.chooseWithProbabilities(
        ['root', 'fifth', 'third', 'scale'], [60, 20, 10, 10])

      if (sameChordChoice !== 'scale') {
        let noteIndex = sameChordChoice === 'root' ? 0 : sameChordChoice === 'fifth' ? 2 : 1
        nextBarFirstNote = this.placeInDirection(newNotes[noteIndex], this.chosenFirstNote, false)
      } else {
        let noteRange
        if (this.direction == 'up') {
          noteRange = this.scaleRange(Note.transpose(this.chosenFirstNote, '2m'), Note.transpose(this.chosenFirstNote, '8P'))
        } else {
          noteRange = this.scaleRange(Note.transpose(this.chosenFirstNote, '-2m'), Note.transpose(this.chosenFirstNote, '-8P'))
        }
        nextBarFirstNote = musicUtils.foldIntoRange(utils.chooseWithProbabilityDecreasing(noteRange))
      }
    }

    this.nextBarFirstNoteCallback(nextBarFirstNote)
    this.nextBarFirstNote = nextBarFirstNote
    return nextBarFirstNote
  }

  setNoteOptions(nextBarFirstNote) {
    this.noteBelow = Note.transpose(nextBarFirstNote, '-2m')
    this.noteAbove = Note.transpose(nextBarFirstNote, '2m')
    this.noteStepDown = Note.transpose(nextBarFirstNote, '-2M')
    this.noteStepUp = Note.transpose(nextBarFirstNote, '2M')
    this.noteDominantBelow = Note.transpose(nextBarFirstNote, '-4P')
    this.noteDominantAbove = Note.transpose(nextBarFirstNote, '5P')
  }

  lastNoteNewChord(nextBarFirstNote) {
    let chosen;
    [this.noteBelow, this.noteAbove, this.noteStepDown, this.noteStepUp, this.noteDominantBelow].some( (attempt) => {
      // do not include octave in comparison
      if (musicUtils.noteInList(this.notes, attempt)) {
        chosen = attempt
        return true
      }
    })

    if (!chosen) {
      chosen = utils.chooseWithProbabilities(
        [this.noteBelow, this.noteAbove, this.noteDominantBelow, this.noteDominantAbove],
        [30, 30, 20, 20])
    }
    return chosen
  }

  // beats 2, 3 and 4 chosen together toward the next bar's beat 1, with the
  // old one-at-a-time choice as a fallback when no candidate fits
  chooseBeats(recentShapes) {
    const target = this.runNextBarFirstNote()
    this.pick = new WalkScorer(this.chord).choose(
      Note.midi(this.chosenFirstNote), Note.midi(target), recentShapes)
    if (this.pick) {
      return this.pick.notes.map(m => Note.fromMidi(m))
    }
    this.lastNoteToward(target)
    return [...this.notesBetween(), this.chosenLastNote]
  }

  lastNote() {
    return this.lastNoteToward(this.runNextBarFirstNote())
  }

  lastNoteToward(nextBarFirstNote) {
    this.setNoteOptions(nextBarFirstNote)

    let chosen
    if (this.chord != this.nextChord) {
      chosen = this.lastNoteNewChord(nextBarFirstNote)
    }
    if (!chosen) {
      // chord tones are voiced near the next target so beat 4 still leads into it
      chosen = utils.chooseWithProbabilities(
        [this.noteBelow, this.noteAbove, this.noteDominantBelow, this.noteDominantAbove,
          this.noteStepDown, this.noteStepUp, this.noteBelow,
          musicUtils.nearest(this.notes[3], nextBarFirstNote),
          musicUtils.nearest(this.notes[2], nextBarFirstNote),
          musicUtils.nearest(this.notes[1], nextBarFirstNote)],
        [10, 10, 10, 10, 10, 10, 10, 10, 10, 10])
    }
    this.chosenLastNote = musicUtils.appendOctaveInteger(chosen, this.octave)
    if (!musicUtils.inRange(this.chosenLastNote)) {
      // approach from the other side instead (e.g. half step below rather than above)
      const fromTarget = musicUtils.semiDistance(nextBarFirstNote, this.chosenLastNote)
      const mirrored = Note.transpose(this.chosenLastNote, Interval.fromSemitones(-2 * fromTarget))
      this.chosenLastNote = musicUtils.foldIntoRange(mirrored)
    }
    return this.chosenLastNote
  }

  // given 2 notes and a chord, pick 2 notes in between
  notesBetween() {
    const first = this.chosenFirstNote
    const last = this.chosenLastNote
    const firstMidi = Note.midi(first)
    const lastMidi = Note.midi(last)

    // When beat 4 sits right next to beat 1 there's no room to walk between
    // them, so head away (in the bar's direction) and turn around on beat 4.
    let goal = last
    if (Math.abs(lastMidi - firstMidi) <= 3) {
      goal = Note.transpose(first, this.direction == 'up' ? '5P' : '-4P')
      if (!musicUtils.inRange(goal)) {
        goal = Note.transpose(first, this.direction == 'up' ? '-4P' : '5P')
      }
    }

    // scaleRange is ascending; flip it when the line goes down so the
    // candidates are in the order they'd be played
    const descending = Note.midi(goal) < firstMidi
    let noteRange = descending ? this.scaleRange(goal, first).reverse() : this.scaleRange(first, goal)
    noteRange = noteRange.filter(n => Note.midi(n) !== firstMidi && Note.midi(n) !== lastMidi)

    if (noteRange.length < 2) {
      // too tight for the scale: fill in chromatically
      const step = descending ? '-2m' : '2m'
      const a = Note.transpose(first, step)
      noteRange = [a, Note.transpose(a, step)]
    }

    const r = utils.chooseTwoRandomElementsInOrder(noteRange)

    // Beat 3 (r[1]) is a strong beat — prefer chord tones 60% of the time,
    // keeping the line moving in the same direction as beat 2
    const afterBeat2 = noteRange.slice(noteRange.indexOf(r[0]) + 1)
    const chordTones = afterBeat2.filter(n => musicUtils.noteInList(this.notes, n))
    if (chordTones.length > 0 &&
        utils.chooseWithProbabilities(['yes', 'no'], [60, 40]) === 'yes') {
      r[1] = utils.randFromArray(chordTones)
    }

    return r.map(n => musicUtils.foldIntoRange(n))
  }
}

export default NoteChooser
