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

it('chooses beats 2 to 4 leading into the next bar', () => {
  utils.seed(3)
  for (let i = 0; i < 30; i++) {
    let nc = prep('Dm7', 'G7', 'D2', 'C', i % 2 ? 'up' : 'down')
    nc.firstNote()
    const beats = nc.chooseBeats([])
    expect(beats.length).toEqual(3)
    beats.forEach(n => expect(Note.midi(n)).not.toBe(null))
    const approach = Math.abs(Note.midi(nc.nextBarFirstNote) - Note.midi(beats[2]))
    expect(approach).toBeLessThanOrEqual(7)
  }
  utils.seed(null)
})
