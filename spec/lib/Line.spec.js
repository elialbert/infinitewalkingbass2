import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';

it('determines current chord', () => {
  let sw = new SongWriter()
  sw.progA = ['IIm7', 'V7', 'IMaj7']
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
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  const l = new Line(s, 0)
  expect(l.currentChord(2)).toEqual('G7')
})

it('determines another chord', () => {
  let sw = new SongWriter()
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.key = 'C'
  const s = new Section(sw, 'a', 0)
  s.chordsToBars = [2, 2, 4]
  const l = new Line(s, 0)
  expect(l.currentChord(1)).toEqual('Dm7')
})

it('generates beats in bars', () => {
  let sw = new SongWriter()
  sw.progA = ['IIm7', 'V7', 'IMaj7']
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
