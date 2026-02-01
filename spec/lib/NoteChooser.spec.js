import NoteChooser from 'src/lib/NoteChooser.js'
import { Chord } from 'tonal'

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
  expect(nc.firstNote()).toEqual('C3')
})

it('chooses last note', () => {
  setRandom(0)
  let nc = prep('C7', 'C7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.lastNote()).toEqual('B1')

  setRandom(0.65)
  nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.lastNote()).toEqual('A#2')
})

it('next bar first note', () => {
  setRandom(0.99)
  let nc = prep('C7', 'C7', null, 'C', 'up')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.runNextBarFirstNote()).toEqual('D3')

  nc = prep('C7', 'C7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.runNextBarFirstNote()).toEqual('B2')

  setRandom(0.5)
  nc = prep('Dm7', 'Dm7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('D3')
  expect(nc.runNextBarFirstNote()).toEqual('D2')
})

it('sets note options relative to a target note', () => {
  let nc = prep('C7', 'C7', 'C3', 'C')
  nc.setNoteOptions('C3')
  expect(nc.noteBelow).not.toBe(undefined)
  expect(nc.noteAbove).not.toBe(undefined)
  expect(nc.noteStepDown).not.toBe(undefined)
  expect(nc.noteStepUp).not.toBe(undefined)
  expect(nc.noteDominantBelow).not.toBe(undefined)
  expect(nc.noteDominantAbove).not.toBe(undefined)
})

it('chooses last note when chord changes', () => {
  setRandom(0)
  let nc = prep('C7', 'Dm7', 'C3', 'C', 'down')
  nc.firstNote()
  nc.lastNote() // calls lastNoteNewChord internally since chords differ
  expect(nc.chosenLastNote).not.toBe(undefined)
})

it('chooses notes between first and last', () => {
  setRandom(0)
  let nc = prep('C7', 'C7', 'C3', 'C', 'down')
  nc.firstNote()
  nc.lastNote()
  let between = nc.notesBetween()
  expect(between.length).toEqual(2)
})

it('chooses notes between when direction is up', () => {
  setRandom(0)
  let nc = prep('C7', 'C7', 'C3', 'C', 'up')
  nc.firstNote()
  nc.lastNote()
  let between = nc.notesBetween()
  expect(between.length).toEqual(2)
})