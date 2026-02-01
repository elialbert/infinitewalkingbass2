import musicUtils from 'src/lib/musicUtils.js'

it('chooses a random scale from a chord', () => {
  let result = musicUtils.chooseScale('Dm7')
  expect(result).not.toBe(undefined)
  expect(result).not.toBe(null)
})

it('appends octave integer to note without one', () => {
  expect(musicUtils.appendOctaveInteger('C')).toEqual('C3')
  expect(musicUtils.appendOctaveInteger('D#')).toEqual('D#3')
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

it('returns default octave 3 for falsy input', () => {
  expect(musicUtils.noteOctave(null)).toEqual(3)
  expect(musicUtils.noteOctave(undefined)).toEqual(3)
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