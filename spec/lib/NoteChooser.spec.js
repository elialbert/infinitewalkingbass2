import utils from 'src/lib/utils.js'
import NoteChooser from 'src/lib/NoteChooser.js'
import { Chord, Note } from 'tonal'

let prep = function(chord, nextChord, firstNote, key, direction) {
  const notes = Chord.get(chord).notes
  let cb = jest.fn(x => x);
  let nc = new NoteChooser(chord, nextChord, firstNote,
    notes, key, direction, cb)
  return nc
}

let setRandom = function(val) {
  utils.setRandom(() => val)
}

afterEach(() => utils.setRandom(null))

it('passes through first note', () => {
  let nc = prep('C7', 'C7', 'C2', 'C')
  expect(nc.firstNote()).toEqual('C2')
})

it('chooses obvious first note', () => {
  let nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C2')
})

it('chooses last note', () => {
  // random=0 -> root for the next bar. C1 would be below the bass range,
  // so the line turns around and heads up to C3; beat 4 approaches from below
  setRandom(0)
  let nc = prep('C7', 'C7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.lastNote()).toEqual('B2')
  expect(nc.direction).toEqual('up')

  // random=0.65 -> fifth (G1, below C2), then the 7th option: half step below
  setRandom(0.65)
  nc = prep('C7', 'C7', null, 'C')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.lastNote()).toEqual('F#1')
})

it('next bar first note', () => {
  // random=0.99 -> 'scale' choice, C bebop scale (on the chord's root),
  // and the first note in the walking direction
  setRandom(0.99)
  let nc = prep('C7', 'C7', null, 'C', 'up')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.runNextBarFirstNote()).toEqual('D2')

  nc = prep('C7', 'C7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('C2')
  expect(nc.runNextBarFirstNote()).toEqual('B1')

  // random=0.5 -> root; D1 is below the range so it goes up to D3 instead
  setRandom(0.5)
  nc = prep('Dm7', 'Dm7', null, 'C', 'down')
  expect(nc.firstNote()).toEqual('D2')
  expect(nc.runNextBarFirstNote()).toEqual('D3')
})

it('builds scales on the chord root, not the key', () => {
  setRandom(0)
  let nc = prep('A7', 'A7', 'A1', 'C', 'up')
  // A mixolydian: C# and G natural, not C major's C natural
  expect(nc.scaleRange('A1', 'A2')).toEqual(['A1', 'B1', 'C#2', 'D2', 'E2', 'F#2', 'G2', 'A2'])
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
  let nc = prep('C7', 'C7', 'C2', 'C', 'up')
  nc.firstNote()
  expect(nc.runNextBarFirstNote()).toEqual('C3')

  nc = prep('Dm7', 'Dm7', 'D3', 'C', 'down')
  nc.firstNote()
  expect(nc.runNextBarFirstNote()).toEqual('D2')
})

it('turns down near the top of the range', () => {
  setRandom(0.1)
  // C3 is high for a walking line, so even though the hint is up it heads down
  let nc = prep('C7', 'C7', 'C3', 'C', 'up')
  nc.firstNote()
  expect(nc.runNextBarFirstNote()).toEqual('C2')
  expect(nc.direction).toEqual('down')
})

it('same-chord continuation can choose fifth', () => {
  // With random=0.7, chooseWithProbabilities([60,20,10,10]) → randVal=71 → 'fifth'
  setRandom(0.7)
  let nc = prep('C7', 'C7', 'C2', 'C', 'up')
  nc.firstNote()
  expect(nc.runNextBarFirstNote()).toEqual('G2')
})

it('keeps beats 2 and 3 moving in one direction', () => {
  for (let i = 0; i < 50; i++) {
    let nc = prep('Dm7', 'G7', 'D2', 'C', i % 2 ? 'up' : 'down')
    nc.firstNote()
    nc.lastNote()
    const [b2, b3] = nc.notesBetween().map(Note.midi)
    const b1 = Note.midi('D2')
    expect(Math.sign(b2 - b1)).toEqual(Math.sign(b3 - b2))
  }
})

it('beat 3 can be a chord tone via notesBetween', () => {
  // Run many times and check that beat 3 is sometimes a chord tone
  const chordToneResults = []
  for (let i = 0; i < 50; i++) {
    let nc = prep('C7', 'C7', 'C2', 'C', 'down')
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