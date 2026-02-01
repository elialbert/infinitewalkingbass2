import TripletChooser from 'src/lib/TripletChooser.js'
import { Note } from 'tonal'

let setRandom = function(val) {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => val;
  global.Math = mockMath;
}

function makeMockBar(direction, notes) {
  notes = notes || ['C3', 'D3', 'E3', 'F3']
  return {
    direction: direction || 'up',
    beats: notes.map(n => ({ note: n, octaveBounce: 'no', triplet: false }))
  }
}

it('skips triplet when probability says no', () => {
  setRandom(0.99) // getRandomIntInclusive(1,100)=100, sum 65<100 -> 'no'
  const bar = makeMockBar('up')
  new TripletChooser(bar)
  bar.beats.forEach(b => expect(b.triplet).toBe(false))
})

it('adds a chromatic triplet for close intervals going up', () => {
  setRandom(0) // probability -> 'yes', pattern -> 'end'
  const bar = makeMockBar('up', ['C3', 'D3', 'E3', 'F3'])
  new TripletChooser(bar)
  // last valid candidate is beat index 3 (F3), distance E3->F3 = 1 semitone (<=3 -> chromatic)
  // direction up, pattern 'end': approach from below
  const triplet = bar.beats[3].triplet
  expect(triplet).toBeInstanceOf(Array)
  expect(triplet.length).toEqual(3)
  expect(triplet[2]).toEqual('F3') // ends on the target note
})

it('adds a chromatic triplet going down', () => {
  setRandom(0) // probability -> 'yes', pattern -> 'end'
  const bar = makeMockBar('down', ['F3', 'E3', 'D3', 'C3'])
  new TripletChooser(bar)
  // last valid candidate is beat 3 (C3), distance D3->C3 <= 3 -> chromatic
  // direction down, pattern 'end': approach from above
  const triplet = bar.beats[3].triplet
  expect(triplet).toBeInstanceOf(Array)
  expect(triplet.length).toEqual(3)
  expect(triplet[2]).toEqual('C3')
})

it('adds a stepwise triplet for large intervals', () => {
  setRandom(0)
  const bar = makeMockBar('up', ['C3', 'D3', 'E3', 'A3'])
  // distance E3->A3 = 5 semitones (> 3 -> stepwise)
  new TripletChooser(bar)
  const triplet = bar.beats[3].triplet
  expect(triplet).toBeInstanceOf(Array)
  expect(triplet.length).toEqual(3)
  expect(triplet[2]).toEqual('A3') // ends on target
})

it('skips beats with octaveBounce', () => {
  setRandom(0) // probability -> 'yes'
  const bar = makeMockBar('up')
  // mark all beats as having octaveBounce
  bar.beats.forEach(b => b.octaveBounce = '8M')
  new TripletChooser(bar)
  // no valid candidate pair found, so no triplet set
  bar.beats.forEach(b => expect(b.triplet).toBe(false))
})
