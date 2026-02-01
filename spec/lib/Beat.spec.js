import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';
import Bar from 'src/lib/Bar.js';
import Beat from 'src/lib/Beat.js';
import { Note } from 'tonal'

let setRandom = function(val) {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => val;
  global.Math = mockMath;
}

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
  // random=0 -> getRandomIntInclusive(1,100)=1, prob [10,10,17,63] -> '8M'
  const beat = makeBeat(0)
  expect(beat.octaveBounce).toEqual('8M')
  beat.generate('C3')
  const result = beat.gather()
  expect(result.length).toEqual(4)
  expect(result[0]).toEqual('C3')
  expect(result[1]).toBe(null)
  expect(result[2]).toBe(null)
  expect(result[3]).toEqual(Note.transpose('C3', '8M'))
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