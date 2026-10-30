import utils from 'src/lib/utils.js'
import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';
import Bar from 'src/lib/Bar.js';
import Beat from 'src/lib/Beat.js';
import { Note } from 'tonal'

let setRandom = function(val) {
  utils.setRandom(() => val)
}

afterEach(() => utils.setRandom(null))

function makeBeat(randomVal) {
  setRandom(randomVal)
  let sw = new SongWriter(0, null, 'ABA')
  const s = new Section(sw, 'a', 0)
  const l = new Line(s, 0)
  const b = new Bar(l, 'Cmaj7', 0)
  return new Beat(b, 0)
}

it('has a note', () => {
  const beat = makeBeat(0.99)
  beat.generate('C')
  expect(beat.note).toEqual('C')
  const [event] = beat.gather()
  expect(event.note).toEqual('C')
  expect(event.duration).toEqual('8n')
  expect(event.beat).toEqual(0)
})

it('updates note with chooseNote', () => {
  const beat = makeBeat(0.99)
  beat.generate('C')
  expect(beat.note).toEqual('C')
  beat.chooseNote('D')
  expect(beat.note).toEqual('D')
})

it('plays a one-note fill on the last triplet eighth', () => {
  const beat = makeBeat(0.99)
  beat.generate('C2')
  beat.fill = { kind: 'anticipation', notes: ['F2'] }
  const result = beat.gather()
  expect(result[0]).toMatchObject({ note: 'C2', duration: '8t', beat: 0 })
  expect(result[1]).toBe(null)
  expect(result[2]).toMatchObject({ note: 'F2', duration: '8t', beat: 1 })
})

it('ghosts a repeat or octave fill', () => {
  const beat = makeBeat(0.99)
  beat.generate('C2')
  beat.fill = { kind: 'octave', notes: ['C3'] }
  const skip = beat.gather()[2]
  expect(skip.velocity).toBeLessThan(0.6)
  expect(skip.duration).toEqual('32n')
})

it('numbers a run\'s notes consecutively so the score highlight stays in sync', () => {
  const beat = makeBeat(0.99)
  beat.generate('C2')
  beat.fill = { kind: 'run', notes: ['D2', 'Eb2'] }
  beat.bar.line.section.song.beatCounter = 10
  const result = beat.gather()
  expect(result.map(e => e.note)).toEqual(['C2', 'D2', 'Eb2'])
  expect(beat.beatNumbers).toEqual([10, 11, 12])
  expect(beat.bar.line.section.song.beatCounter).toEqual(13)
})

it('leans on beats 2 and 4', () => {
  const sw = new SongWriter(0, null, 'ABA')
  const l = new Line(new Section(sw, 'a', 0), 0)
  const bar = new Bar(l, 'Cmaj7', 0)
  utils.seed(4)
  const velocity = (idx) => {
    const beat = new Beat(bar, idx)
    beat.generate('C2')
    return beat.gather()[0].velocity
  }
  const avg = (idx) => Array.from({ length: 50 }, () => velocity(idx)).reduce((a, b) => a + b) / 50
  expect(avg(1)).toBeGreaterThan(avg(0))
  utils.seed(null)
})

it('holds two-feel beats, with an optional pickup on the last triplet', () => {
  const beat = makeBeat(0.99)
  beat.generate('C2')
  beat.held = true
  expect(beat.gather()).toEqual([null])
  beat.pickup = 'B1'
  const [a, b, pickup] = beat.gather()
  expect([a, b]).toEqual([null, null])
  expect(pickup.note).toEqual('B1')
})

it('describes itself for the score, numbering each sounding note', () => {
  const skip = makeBeat(0.99)
  skip.generate('C2')
  skip.fill = { kind: 'octave', notes: ['C3'] }
  skip.gather()
  expect(skip.display()).toEqual([{ text: 'C2', beat: 0 }, { text: 'C3', beat: 1, small: true }])

  const held = makeBeat(0.99)
  held.generate('C2')
  held.held = true
  held.pickup = 'B1'
  held.gather()
  expect(held.display()).toEqual([{ text: '–' }, { text: 'B1', beat: 0, small: true }])
})
