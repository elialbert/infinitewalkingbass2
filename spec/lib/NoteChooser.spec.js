import NoteChooser from 'src/lib/NoteChooser.js'
import { Chord } from '@tonaljs/tonal'

let prep = function(chord, nextChord, firstNote, key, direction) {
  const notes = Chord.get(chord).notes
  let cb = jest.fn(x => x);
  let nc = new NoteChooser(chord, nextChord, firstNote,
    notes, key, direction, cb)
  return nc
}

let setRandom = function(val) {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => val;
  global.Math = mockMath;
}

it('passes through first note', () => {
  let nc = prep('C7', 'C7', 'C2', 'C')
  expect(nc.firstNote()).toEqual('C2')
})

it('chooses obvious first note', () => {
  let nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C2')
})

it('chooses last note', () => {
  setRandom(0)
  let nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.lastNote()).toEqual('B1')

  setRandom(0.65)
  nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.lastNote()).toEqual('D#2')
})