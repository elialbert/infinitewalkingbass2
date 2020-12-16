import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';

it('has chords to bars', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a')
  expect(s.chordsToBars).toEqual([2, 2, 4])
})


it('generates lines for part A', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a')
  expect(s.chordsToBars).toEqual([2, 2, 4])
  s.generate()
  expect(s.lines.length).toEqual(s.lineCount)
})

it('generates lines for part B', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'b')
  s.generate()
  expect(s.lines.length).toEqual(s.lineCount)
})