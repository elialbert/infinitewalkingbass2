import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';

it('determines current chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  const l = new Line(s, 0)
  expect(s.progression[0]).toEqual('Dm7')
  expect(s.chordsToBars).toEqual([2, 2, 4])
  expect(l.currentChord(0)).toEqual(s.progression[0])
})

it('determines another chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  const l = new Line(s, 0)
  expect(l.currentChord(2)).toEqual('A7')
})

it('determines another chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  const l = new Line(s, 0)
  expect(l.currentChord(1)).toEqual('Dm7')
})

it('generates beats in bars', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  s.barsPerLine = 4
  const l = new Line(s, 1)
  expect(l.currentChord(4)).toEqual('CMaj7')
  // should be 4 bars of CMaj7
  l.generate()
  expect(l.bars.length).toEqual(4)
  expect(l.bars[0].chord).toEqual('CMaj7')
  expect(l.bars[1].chord).toEqual('CMaj7')
  expect(l.gather()[0]).not.toBe(undefined)

})

it('returns next bar within the line', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  s.barsPerLine = 4
  const l = new Line(s, 0)
  l.generate()
  expect(l.nextBar(0)).toBe(l.bars[1])
  expect(l.nextBar(1)).toBe(l.bars[2])
  expect(l.nextBar(2)).toBe(l.bars[3])
})

it('returns null for nextBar at end of song', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  const lastSection = sw.sectionC
  const lastLine = lastSection.lines[lastSection.lines.length - 1]
  const lastBarIdx = lastLine.bars.length - 1
  expect(lastLine.nextBar(lastBarIdx)).toBe(null)
})

it('returns previous bar with lastBar', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  s.barsPerLine = 4
  const l = new Line(s, 0)
  l.generate()
  expect(l.lastBar(1)).toBe(l.bars[0])
  expect(l.lastBar(2)).toBe(l.bars[1])
  expect(l.lastBar(3)).toBe(l.bars[2])
})

it('returns null for lastBar at first bar with no previous line', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  s.barsPerLine = 4
  const l = new Line(s, 0)
  l.generate()
  expect(l.lastBar(0)).toBe(null)
})

it('returns last bar of previous line for first bar', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  const s = sw.sectionA
  const secondLine = s.lines[1]
  const firstLine = s.lines[0]
  expect(secondLine.lastBar(0)).toBe(firstLine.bars[firstLine.bars.length - 1])
})
