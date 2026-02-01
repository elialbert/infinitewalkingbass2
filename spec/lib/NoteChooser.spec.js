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
  expect(nc.lastNote()).toEqual('F#2')
})

it('next bar first note', () => {
  setRandom(0.99)
  let nc = prep('C7', 'C7', null, 'C', 'up')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.runNextBarFirstNote()).toEqual('D3')

  nc = prep('C7', 'C7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('C3')
  expect(nc.runNextBarFirstNote()).toEqual('Bb2')

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

it('same-chord continuation prefers root on beat 1', () => {
  // With random=0.1, chooseWithProbabilities([60,20,10,10]) hits 'root' (sum 60 >= 11)
  setRandom(0.1)
  let nc = prep('C7', 'C7', 'C3', 'C', 'up')
  nc.firstNote()
  let nextFirst = nc.runNextBarFirstNote()
  // Root of C7 is C, direction up so should be transposed up from C3
  expect(nextFirst).toEqual('C4')

  nc = prep('Dm7', 'Dm7', 'D3', 'C', 'down')
  nc.firstNote()
  nextFirst = nc.runNextBarFirstNote()
  // Root of Dm7 is D, direction down so should be transposed down from D3
  expect(nextFirst).toEqual('D2')
})

it('same-chord continuation can choose fifth', () => {
  // With random=0.7, chooseWithProbabilities([60,20,10,10]) → randVal=71, sum: 60<71, 80>=71 → 'fifth'
  setRandom(0.7)
  let nc = prep('C7', 'C7', 'C3', 'C', 'up')
  nc.firstNote()
  let nextFirst = nc.runNextBarFirstNote()
  // 5th of C7 is G, direction up, semiDistance(C3, G3)=7 > 0, so no up-transpose
  // but condition is <= 0 for up, 7 <= 0 is false, so stays G3
  // wait, semiDistance(C3, G3) = 7, and condition is (<= 0 && up), 7 <= 0 is false
  // So G3 stays
  expect(nextFirst).toEqual('G3')
})

it('beat 3 can be a chord tone via notesBetween', () => {
  // Run many times and check that beat 3 is sometimes a chord tone
  const chordToneResults = []
  for (let i = 0; i < 50; i++) {
    let nc = prep('C7', 'C7', 'C3', 'C', 'down')
    nc.firstNote()
    nc.lastNote()
    let between = nc.notesBetween()
    expect(between.length).toEqual(2)
    const c7notes = Chord.get('C7').notes // ['C', 'E', 'G', 'Bb']
    const beat3NoOctave = between[1].replace(/\d$/, '')
    chordToneResults.push(c7notes.includes(beat3NoOctave))
  }
  // With 60% chord-tone preference, we should see chord tones appear frequently
  const chordToneCount = chordToneResults.filter(x => x).length
  expect(chordToneCount).toBeGreaterThan(10)
})