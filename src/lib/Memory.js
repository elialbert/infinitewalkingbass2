// What a bassist remembers of the tune they're playing. Coming back to the
// same harmony (a bar's chords and the chord after it), FiloBass players
// land on the same beat 1 about three times in four and play the very same
// bar about two times in five; that recall is a lot of what makes a line
// sound like it belongs to the tune rather than to the moment.
//
// The memory holds every walking bar played, keyed by its harmony, for as
// long as the tune stays in one key. A figure played more often is
// recalled more often, so habits form.
import utils from './utils.js'

// percent chance, when the harmony has been heard before, of landing on a
// beat 1 played there before, and of replaying a bar that started on the
// same note
export const RECALL = { landing: 60, bar: 45 }

const chance = (percent) => utils.random() * 100 < percent

class Memory {
  constructor() {
    this.figures = new Map()
  }

  static key(chords, nextChord) {
    return `${chords.join(' ')}>${nextChord}`
  }

  // midis: the bar's four beats; next: the next bar's first note
  remember(key, bar, midis, next) {
    if (!this.figures.has(key)) { this.figures.set(key, []) }
    this.figures.get(key).push({ bar, midis, next })
  }

  // drop what a bar played, before it is written again
  forget(bar) {
    this.figures.forEach((list, key) => this.figures.set(key, list.filter(f => f.bar !== bar)))
  }

  // a beat 1 played before on this harmony (midi), or null
  landing(key) {
    const list = this.figures.get(key)
    if (!list || !list.length || !chance(RECALL.landing)) { return null }
    return utils.randFromArray(list).midis[0]
  }

  // a bar played before on this harmony starting on `first`, or null
  recall(key, first) {
    const list = (this.figures.get(key) || []).filter(f => f.midis[0] === first)
    if (!list.length || !chance(RECALL.bar)) { return null }
    return utils.randFromArray(list)
  }
}

export default Memory
