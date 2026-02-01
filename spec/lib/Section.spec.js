import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';

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

it('returns a direction hint', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  const hint = s.getDirectionHint('down')
  expect(['up', 'down']).toContain(hint)
})

it('defaults direction to down when no current direction', () => {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => 0.99; // probability -> 'stay'
  global.Math = mockMath;
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  expect(s.getDirectionHint(null)).toEqual('down')
})

it('maps chords to bars for part a with 3 chords', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'G7', 'CMaj7']
  const s = new Section(sw, 'a', 0)
  expect(s.chordsToBars).toEqual([2, 2, 4])
})

it('maps chords to bars for part a with 4 chords', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'G7', 'CMaj7', 'Am7']
  const s = new Section(sw, 'a', 0)
  expect(s.chordsToBars).toEqual([2, 2, 2, 2])
})

it('maps chords to bars for part b with 3 chords', () => {
  let sw = new SongWriter()
  sw.chordProgB = ['Dm7', 'G7', 'CMaj7']
  const s = new Section(sw, 'b', 1)
  expect(s.chordsToBars).toEqual([4, 4, 4])
})

it('maps chords to bars for part b with 4 chords', () => {
  let sw = new SongWriter()
  sw.chordProgB = ['Dm7', 'G7', 'CMaj7', 'Am7']
  const s = new Section(sw, 'b', 1)
  expect(s.chordsToBars).toEqual([3, 3, 3, 3])
})

it('gathers data from all lines', () => {
  let sw = new SongWriter()
  sw.generate()
  const data = sw.sectionA.gather()
  expect(data.length).toEqual(sw.sectionA.lineCount)
})