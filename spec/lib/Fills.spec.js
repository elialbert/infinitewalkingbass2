import utils from 'src/lib/utils.js'
import { Note } from 'tonal'
import { fillNotes, planFills } from 'src/lib/Fills.js'
import { setKnobs } from 'src/lib/Knobs.js'

afterEach(() => {
  utils.setRandom(null)
  setKnobs({})
})

const m = (n) => Note.midi(n)

it('leads into the next beat', () => {
  expect(fillNotes('anticipation', m('C2'), m('F2'))).toEqual([m('F2')])
  // a half step in from the side the line comes from
  expect(fillNotes('approach', m('C2'), m('F2'))).toEqual([m('E2')])
  expect(fillNotes('approach', m('A2'), m('F2'))).toEqual([m('F#2')])
  // the near side is the beat's own note, so it comes from above instead
  expect(fillNotes('approach', m('E2'), m('F2'))).toEqual([m('F#2')])
  expect(fillNotes('anticipation', m('C2'), m('C2'))).toBe(null)
})

it('keeps octave fills in range', () => {
  expect(fillNotes('octave', m('E1'), m('F1'))).toEqual([m('E2')])
  expect(fillNotes('octave', m('C3'), m('B2'))).toEqual([m('C2')])
})

it('walks a run into the next beat without starting on the beat\'s own note', () => {
  utils.setRandom(() => 0.1) // chromatic
  expect(fillNotes('run', m('C2'), m('G2'))).toEqual([m('F2'), m('F#2')])
  // a whole step apart, the chromatic run would repeat C2, so it encloses
  expect(fillNotes('run', m('C2'), m('D2'))).toEqual([m('D#2'), m('C#2')])
  expect(fillNotes('run', m('C2'), m('C#2'))).toBe(null)
})

function fakeBar(lastBar) {
  return {
    lastBar,
    key: 'C',
    nextChord: 'F7',
    nextBarFirstNote: 'F2',
    chordAt: () => 'C7',
    beats: ['C2', 'E2', 'G2', 'Bb2'].map(note => ({ note, fill: null }))
  }
}

it('stays calm or busy for a while, and fills busy bars far more often', () => {
  utils.seed(5)
  let bar = null
  const bars = Array.from({ length: 4000 }, () => {
    const next = fakeBar(bar)
    planFills(next)
    bar = next
    return next
  })
  const share = (mood) => {
    const these = bars.filter(b => b.mood === mood)
    return these.filter(b => b.beats.some(x => x.fill)).length / these.length
  }
  expect(share('busy')).toBeGreaterThan(3 * share('calm'))
  const switches = bars.filter((b, i) => i && b.mood !== bars[i - 1].mood).length
  expect(switches / bars.length).toBeLessThan(0.25)
  bars.forEach(b => b.beats.forEach(x => {
    if (x.fill) { x.fill.notes.forEach(n => expect(Note.midi(n)).not.toBe(null)) }
  }))
})

it('fills more with the fills knob up', () => {
  const rate = (fills) => {
    setKnobs({ fills })
    utils.seed(8)
    let bar = null
    let filled = 0
    for (let i = 0; i < 2000; i++) {
      const next = fakeBar(bar)
      planFills(next)
      if (next.beats.some(x => x.fill)) { filled++ }
      bar = next
    }
    return filled
  }
  // the busy mood's chance tops out at 100%, so doubling isn't quite double
  expect(rate(2)).toBeGreaterThan(rate(1) * 1.25)
  expect(rate(0)).toEqual(0)
})
