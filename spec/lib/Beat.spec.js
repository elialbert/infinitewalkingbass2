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
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  const l = new Line(s, 0)
  const b = new Bar(l, 'Cmaj7', 0)
  return new Beat(b, 0)
}

it('has a note', () => {
  const beat = makeBeat(0.99)
  beat.generate('C')
  expect(beat.note).toEqual('C')
  expect(beat.gather()).toEqual(['C'])
})

it('updates note with chooseNote', () => {
  const beat = makeBeat(0.99)
  beat.generate('C')
  expect(beat.note).toEqual('C')
  beat.chooseNote('D')
  expect(beat.note).toEqual('D')
})

it('gathers with octave bounce', () => {
  // random=0 -> getRandomIntInclusive(1,100)=1 -> skip 'yes', then '8M'
  const beat = makeBeat(0)
  expect(beat.octaveBounce).toEqual('8M')
  beat.generate('C2')
  const result = beat.gather()
  // the skip falls on the last triplet eighth of the beat
  expect(result).toEqual(['C2', null, { note: 'C3', velocity: 0.5, duration: '32n' }])
})

it('bounces down instead of up when the note is already high', () => {
  const beat = makeBeat(0)
  expect(beat.octaveBounce).toEqual('8M')
  beat.generate('C3')
  expect(beat.gather()[2].note).toEqual('C2')
})

it('gathers with triplet', () => {
  // random=0.99 -> octaveBounce='no'
  const beat = makeBeat(0.99)
  expect(beat.octaveBounce).toEqual('no')
  beat.generate('C3')
  beat.triplet = ['C3', 'D3', 'E3']
  const result = beat.gather()
  expect(result).toEqual(['C3', 'D3', 'E3'])
})
it('numbers triplet notes consecutively so the score highlight stays in sync', () => {
  const beat = makeBeat(0.99)
  beat.generate('C2')
  beat.triplet = [{ note: 'Bb1' }, { note: 'B1' }, { note: 'C2' }]
  beat.bar.line.section.song.beatCounter = 10
  beat.gather()
  expect(beat.beatNumbers).toEqual([10, 11, 12])
  expect(beat.bar.line.section.song.beatCounter).toEqual(13)
})

it('ghosts the skip note', () => {
  const beat = makeBeat(0)
  beat.generate('C2')
  const skip = beat.gather()[2]
  expect(skip.velocity).toBeLessThan(0.6)
  expect(skip.duration).toEqual('32n')
})
