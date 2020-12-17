import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';

it('has chords to bars', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  expect(s.chordsToBars).toEqual([2, 2, 4])
})


it('generates lines for part A', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  expect(s.chordsToBars).toEqual([2, 2, 4])
  s.generate()
  expect(s.lines.length).toEqual(s.lineCount)
})

it('generates lines for part B', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'b', 1)
  s.generate()
  expect(s.lines.length).toEqual(s.lineCount)
})

it('has next line', () => {
  let sw = new SongWriter()
  sw.generate()
  const s = sw.sectionB
  let nl = s.nextLine(1)
  expect(nl.section.part).toEqual('b')
  expect(nl.lineIdx).toEqual(2)
  let nl2 = s.nextLine(2)
  expect(nl2.section.part).toEqual('a')
  expect(nl2.section.sectionIdx).toEqual(2)
  expect(nl2.lineIdx).toEqual(0)

  // end of song
  let nl3 = sw.sectionC.nextLine(1)
  expect(nl3).toBe(null)
})

it('has last line for each line besides the first', () => {
  let sw = new SongWriter()
  sw.generate()
  const s = sw.sectionB
  expect(s.lines[0].lastLine).toBe(undefined)
  expect(s.lines[1].lastLine.lineIdx).toEqual(s.lines[0].lineIdx)
  expect(s.lines[2].lastLine.lineIdx).toEqual(s.lines[1].lineIdx)
})