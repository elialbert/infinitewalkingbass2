import Section from './Section.js'
import musicUtils from './musicUtils.js'
import Forms, { FORMS } from './Forms.js'
import { Chord, Note } from 'tonal'

const KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']

// One chorus. Passing the previous chorus keeps the key and form for the
// form's set number of choruses, then moves to the next key, and carries
// the line across the chorus boundary.
class SongWriter {
  constructor(songIdx, prev = null, formName = null) {
    this.keys = KEYS
    if (prev) {
      Object.assign(this, prev.next)
      this.carryOver = prev.lastBarSummary()
    } else {
      this.keyIdx = (songIdx || 0) % KEYS.length
      this.formName = formName || Forms.chooseForm()
      this.chorusInKey = 0
      this.chordProgA = musicUtils.chooseProgression(KEYS[this.keyIdx])
      this.chordProgB = musicUtils.chooseProgression(KEYS[this.keyIdx])
    }
    this.key = KEYS[this.keyIdx]
    this.chorusesInKey = FORMS[this.formName].choruses
    this.next = this.planNext()
    this.beatCounter = 0
  }

  // the following chorus: same tune again, or a new key and form
  planNext() {
    if (this.chorusInKey + 1 < this.chorusesInKey) {
      return { keyIdx: this.keyIdx, formName: this.formName, chorusInKey: this.chorusInKey + 1,
        chordProgA: this.chordProgA, chordProgB: this.chordProgB }
    }
    const keyIdx = (this.keyIdx + 1) % KEYS.length
    return { keyIdx, formName: Forms.chooseForm(), chorusInKey: 0,
      chordProgA: musicUtils.chooseProgression(KEYS[keyIdx]),
      chordProgB: musicUtils.chooseProgression(KEYS[keyIdx]) }
  }

  get lastChorusInKey() {
    return this.chorusInKey === this.chorusesInKey - 1
  }

  nextSection(sectionIdx) {
    return this.sections()[sectionIdx + 1]
  }

  prevSection(sectionIdx) {
    return this.sections()[sectionIdx - 1]
  }

  generate() {
    const n = this.next
    const nextKey = KEYS[n.keyIdx]
    // the chord the next chorus starts on, so the last bar leads into it
    this.nextChorusChord = Forms.build(n.formName, nextKey, n.chordProgA, n.chordProgB, false)[0].bars[0][0]
    const forms = Forms.build(this.formName, this.key, this.chordProgA, this.chordProgB)
    if (this.lastChorusInKey) {
      // modulate: a ii-V of the next chorus's first chord in the last bar
      const target = Chord.get(this.nextChorusChord).tonic
      const last = forms[forms.length - 1].bars
      last[last.length - 1] = musicUtils.prepProgression([
        `${Note.simplify(Note.transpose(target, '2M'))}m7`, `${Note.simplify(Note.transpose(target, '5P'))}7`])
    }
    this.sectionList = forms.map(({ part, bars }, i) =>
      // the head of each new key is played in two
      new Section(this, part, i, bars, i === 0 && this.chorusInKey === 0))
    this.sectionList.forEach(section => section.generate())
  }

  sections() {
    return this.sectionList || []
  }

  gather() {
    return this.sections().map(section => section.gather())
  }

  // what the next chorus needs to continue the line
  lastBarSummary() {
    const lastSection = this.sectionList[this.sectionList.length - 1]
    const lastLine = lastSection.lines[lastSection.lines.length - 1]
    const bar = lastLine.bars[lastLine.bars.length - 1]
    return { nextBarFirstNote: bar.nextBarFirstNote, shape: bar.shape, direction: bar.direction }
  }

  flatten(d) {
    return d.flat().flat().flat()
  }
}

export default SongWriter
