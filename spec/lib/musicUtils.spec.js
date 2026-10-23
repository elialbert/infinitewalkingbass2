import musicUtils from 'src/lib/musicUtils.js'
import { Chord } from 'tonal'

it('chooses a random scale from a chord', () => {
  let result = musicUtils.chooseScale('Dm7')
  expect(result).not.toBe(undefined)
  expect(result).not.toBe(null)
})

it('chooses a scale compatible with the chord', () => {
  const chords = ['Dm7', 'C7', 'GMaj7', 'Am7', 'Bdim']
  chords.forEach(chord => {
    const compatibleScales = Chord.chordScales(chord)
    for (let i = 0; i < 20; i++) {
      const chosen = musicUtils.chooseScale(chord)
      expect(compatibleScales).toContain(chosen)
    }
  })
})

it('appends octave integer to note without one', () => {
  expect(musicUtils.appendOctaveInteger('C')).toEqual('C2')
  expect(musicUtils.appendOctaveInteger('D#')).toEqual('D#2')
  expect(musicUtils.appendOctaveInteger('C', '4')).toEqual('C4')
  expect(musicUtils.appendOctaveInteger('Bb', '5')).toEqual('Bb5')
})

it('does not double-append octave integer', () => {
  expect(musicUtils.appendOctaveInteger('C3')).toEqual('C3')
  expect(musicUtils.appendOctaveInteger('D#5')).toEqual('D#5')
})

it('extracts octave from note', () => {
  expect(musicUtils.noteOctave('C3')).toEqual('3')
  expect(musicUtils.noteOctave('D#5')).toEqual('5')
  expect(musicUtils.noteOctave('Bb2')).toEqual('2')
})

it('returns default octave 2 for falsy input', () => {
  expect(musicUtils.noteOctave(null)).toEqual(2)
  expect(musicUtils.noteOctave(undefined)).toEqual(2)
})

it('checks if note is in list ignoring octave', () => {
  expect(musicUtils.noteInList(['C', 'E', 'G'], 'C')).toBe(true)
  expect(musicUtils.noteInList(['C', 'E', 'G'], 'C3')).toBe(true)
  expect(musicUtils.noteInList(['C', 'E', 'G'], 'D')).toBe(false)
  expect(musicUtils.noteInList(['D', 'F', 'A', 'C'], 'A')).toBe(true)
})

it('calculates semitone distance between notes', () => {
  expect(musicUtils.semiDistance('C3', 'D3')).toEqual(2)
  expect(musicUtils.semiDistance('C3', 'C4')).toEqual(12)
  expect(musicUtils.semiDistance('C3', 'G3')).toEqual(7)
  expect(musicUtils.semiDistance('D3', 'C3')).toEqual(-2)
})

it('chooses a progression for a key', () => {
  const prog = musicUtils.chooseProgression('C')
  expect(prog).toBeInstanceOf(Array)
  expect(prog.length).toBeGreaterThanOrEqual(3)
  prog.forEach(chord => expect(typeof chord).toBe('string'))
})

it('preps progression by replacing #d7 with #dim7', () => {
  expect(musicUtils.prepProgression(['C#d7', 'Dm7'])).toEqual(['C#dim7', 'Dm7'])
  expect(musicUtils.prepProgression(['Dm7', 'G7'])).toEqual(['Dm7', 'G7'])
  expect(musicUtils.prepProgression(['F#d7', 'A#d7'])).toEqual(['F#dim7', 'A#dim7'])
})
it('chooses the conventional scale for each chord quality', () => {
  for (let i = 0; i < 20; i++) {
    expect(['dorian', 'bebop minor']).toContain(musicUtils.chooseScale('Dm7'))
    expect(['mixolydian', 'bebop']).toContain(musicUtils.chooseScale('G7'))
    expect(['major', 'lydian', 'bebop major']).toContain(musicUtils.chooseScale('CMaj7'))
    expect(musicUtils.chooseScale('Dbo7')).toEqual('diminished')
  }
})

it('respells awkward chord roots in progressions', () => {
  expect(musicUtils.prepProgression(['Ebbo7', 'Fb7', 'B#m7', 'Dm7'])).toEqual(['Do7', 'E7', 'Cm7', 'Dm7'])
})

it('spells notes readably for the key and chord', () => {
  expect(musicUtils.spell('Fb2', 'C', 'Dbo7')).toEqual('E2')
  expect(musicUtils.spell('Abb2', 'C', 'Dbo7')).toEqual('G2')
  expect(musicUtils.spell('C#3', 'Bb', 'Cm7')).toEqual('Db3')
  expect(musicUtils.spell('Db2', 'A', 'A7')).toEqual('C#2')
  expect(musicUtils.spell('Fb')).toEqual('E')
})

it('folds notes into the bass range by octaves', () => {
  expect(musicUtils.foldIntoRange('C1')).toEqual('C2')
  expect(musicUtils.foldIntoRange('G4')).toEqual('G2')
  expect(musicUtils.foldIntoRange('A2')).toEqual('A2')
})

it('places a pitch class in the nearest octave', () => {
  expect(musicUtils.nearest('B', 'C2')).toEqual('B1')
  expect(musicUtils.nearest('E', 'C2')).toEqual('E2')
})
