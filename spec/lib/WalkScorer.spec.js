import utils from 'src/lib/utils.js'
import WalkScorer, { degrees } from 'src/lib/WalkScorer.js'
import { Note } from 'tonal'

afterEach(() => utils.setRandom(null))

const m = (n) => Note.midi(n)

it('reads chord degrees from the chord and its mode', () => {
  const d = degrees('C7')
  expect([d['2'], d['3'], d['5'], d['6'], d['7']]).toEqual([2, 4, 7, 9, 10])
  expect(degrees('Dm7')['3']).toEqual(3)
  expect(degrees('Cmaj7')['7']).toEqual(11)
})

it('only offers in-range candidates whose outside notes resolve by half step', () => {
  const ws = new WalkScorer('Dm7')
  const cands = ws.candidates(m('D2'), m('G2'))
  expect(cands.length).toBeGreaterThan(100)
  cands.forEach(([b2, b3, b4]) => {
    ;[b2, b3, b4].forEach(n => {
      expect(n).toBeGreaterThanOrEqual(m('E1'))
      expect(n).toBeLessThanOrEqual(m('D3'))
    })
    if (!ws.isInside(b2)) { expect(Math.abs(b3 - b2)).toEqual(1) }
    if (!ws.isInside(b3)) { expect(Math.abs(b4 - b3)).toEqual(1) }
  })
})

it('recognizes vocabulary cells from any starting degree', () => {
  const ws = new WalkScorer('Cmaj7')
  expect(ws.matchCell(['C2', 'D2', 'E2', 'G2'].map(m))).toEqual(['1-2-3-5', true])
  expect(ws.matchCell(['C2', 'D2', 'E2', 'F#2'].map(m))).toEqual(['1-2-3-5', false])
  expect(ws.matchCell(['G1', 'G#1', 'A1', 'B1'].map(m))).toEqual(['5-#5-6-7', true])
  // 1-2-b3-3 needs a major third
  expect(new WalkScorer('Dm7').cells.map(c => c[0])).not.toContain('1-2-b3-3')
})

it('scores a half-step approach above a leap into the next bar', () => {
  const ws = new WalkScorer('C7')
  const first = m('C2'), target = m('F2')
  const halfStep = ws.score(first, [m('D2'), m('E2'), m('F#2')], target, [])
  const leap = ws.score(first, [m('D2'), m('E2'), m('B1')], target, [])
  expect(halfStep).toBeGreaterThan(leap)
})

it('penalizes repeating a recent bar shape', () => {
  const ws = new WalkScorer('C7')
  const cand = [m('D2'), m('E2'), m('E2') + 1]
  const fresh = ws.score(m('C2'), cand, m('G2'), [])
  const repeated = ws.score(m('C2'), cand, m('G2'), ['2,2,1'])
  expect(repeated).toBeLessThan(fresh)
})

it('chooses reproducibly from the seeded random source', () => {
  utils.seed(5)
  const a = new WalkScorer('Dm7').choose(m('D2'), m('G2'))
  utils.seed(5)
  const b = new WalkScorer('Dm7').choose(m('D2'), m('G2'))
  utils.seed(null)
  expect(a).toEqual(b)
  expect(a.notes.length).toEqual(3)
})
