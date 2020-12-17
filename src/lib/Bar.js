import Beat from './Beat.js'
import { Chord, Note, Scale, Interval } from '@tonaljs/tonal'
import utils from './utils.js'
import musicUtils from './musicUtils.js'

class Bar {
  constructor(line, chord, barIdx) {
    this.line = line;
    this.chord = chord;
    this.barIdx = barIdx // spot in line
    this.key = this.line.section.song.key
    this.beats = []
    this.notes = Chord.get(this.chord).notes
    if (!this.notes[3]) {
      this.notes[3] = this.notes[0]
    }
  }

  firstNote() {
    return (this.lastBar && this.lastBar.nextBarFirstNote) || musicUtils.appendOctaveInteger(this.notes[0])
  }

  lastNote() {
    // console.log('running last note ', !!this.nextBar, this.chord, this.nextChord)
    if (this.chord != this.nextChord) {
      const newNotes = Chord.get(this.nextChord).notes
      const options = [newNotes[0], newNotes[1], newNotes[2]]
      this.nextBarFirstNote = musicUtils.appendOctaveInteger(utils.chooseWithProbabilities(options, [70, 15, 15]))
      // console.log('next bar first is ', this.nextBarFirstNote)
      const noteBelow = Note.transpose(this.nextBarFirstNote, '-2m')
      const noteAbove = Note.transpose(this.nextBarFirstNote, '2m')
      const noteDominantBelow = Note.transpose(this.nextBarFirstNote, '-4M')
      // console.log('choose from ', noteBelow, noteAbove, noteDominantBelow)
      let chosen;
      [noteBelow, noteAbove, noteDominantBelow].some( (attempt) => {
        // do not include octave in comparison
        if (this.notes.includes(attempt.substring(0, attempt.length - 1))) {
          chosen = attempt
          return true
        }
      })
      if (!chosen) {
        chosen = utils.chooseWithProbabilities(
          [noteBelow, noteAbove, noteDominantBelow,
            musicUtils.appendOctaveInteger(this.notes[3]), musicUtils.appendOctaveInteger(this.notes[2]), musicUtils.appendOctaveInteger(this.notes[1])],
          [20, 20, 15, 15, 15, 15])
      }

      return musicUtils.appendOctaveInteger(chosen)
    } else {
      const options = [this.notes[0], this.notes[1], this.notes[2]]
      this.nextBarFirstNote = musicUtils.appendOctaveInteger(utils.chooseWithProbabilities(options, [70, 15, 15]))
      const noteBelow = Note.transpose(this.notes[0], '-2m')
      const noteAbove = Note.transpose(this.notes[0], '2m')
      const noteDominantBelow = Note.transpose(this.notes[0], '-4M')
      const noteDominantAbove = Note.transpose(this.notes[0], '5M')
      const choice = utils.chooseWithProbabilities(
        [noteBelow, noteAbove, noteDominantBelow, noteDominantAbove, this.notes[3], this.notes[2], this.notes[1]],
        [20, 20, 20, 10, 10, 10, 10])
      return musicUtils.appendOctaveInteger(choice)
    }
  }

  // given 2 notes and a chord, pick 2 notes in between
  notesBetween() {
    const chosenScale = musicUtils.chooseScale(this.chord)
    const rangeFinder = Scale.rangeOf(`${this.key} ${chosenScale}`)
    if (Interval.semitones(Interval.distance(this.chosenFirstNote, this.chosenLastNote)) < 5) {
      this.chosenLastNote = Note.transpose(this.chosenLastNote, '8M')
    }
    const noteRange = rangeFinder(this.chosenFirstNote, this.chosenLastNote)
    return utils.chooseTwoRandomElementsInOrder(noteRange)
  }

  chooseNotes() {
    this.nextBar = this.line.nextBar(this.barIdx)
    if (this.nextBar) {
      this.nextChord = this.nextBar.chord
    } else {
      this.nextChord = this.chord
    }
    // console.log('working with ', this.chord, this.notes)
    this.chosenFirstNote = this.firstNote()
    this.chosenLastNote = this.lastNote()
    this.chosenNotesBetween = this.notesBetween()
    // console.log('choosing notes', this.chosenFirstNote, this.chosenLastNote, this.chosenNotesBetween)
    this.beats[0].chooseNote(this.chosenFirstNote)
    this.beats[3].chooseNote(this.chosenLastNote)
    this.beats[1].chooseNote(this.chosenNotesBetween[0])
    this.beats[2].chooseNote(this.chosenNotesBetween[1])
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