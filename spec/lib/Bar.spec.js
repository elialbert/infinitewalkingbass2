import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';
import Bar from 'src/lib/Bar.js';

it('generates 4 beats', () => {
  let sw = new SongWriter()
  const s = new Section(sw, 'a', 0)
  const l = new Line(s, 0)
  const bar = new Bar(l, 'Cmaj7', 0)
  bar.generate()
  expect(bar.beats.length).toEqual(4)
  bar.beats.forEach((beat, idx) => {
    expect(beat.note).toEqual(bar.notes[idx])
  })
})

it('prepares next bar with same chord when no next bar exists', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  // last bar of last line of last section has no next bar
  const lastSection = sw.sectionC
  const lastLine = lastSection.lines[lastSection.lines.length - 1]
  const lastBar = lastLine.bars[lastLine.bars.length - 1]
  lastBar.prepNextBar()
  expect(lastBar.nextChord).toEqual(lastBar.chord)
})

it('gathers beat data from all 4 beats', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  const bar = sw.sectionA.lines[0].bars[0]
  const data = bar.gather()
  expect(data.length).toEqual(4)
  data.forEach(beatData => {
    expect(beatData).toBeInstanceOf(Array)
    expect(beatData.length).toBeGreaterThanOrEqual(1)
  })
})

it('determines current chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.firstNote()).toEqual('D3')
  expect(bar1.lastNote()).not.toBe(null)

  let bar2 = sw.sectionA.lines[0].bars[1]
  bar2.chooseNotes()
  expect(bar1.nextBarFirstNote).not.toBe(undefined)
  expect(bar2.firstNote()).toEqual(bar1.nextBarFirstNote)
  expect(bar2.lastNote()).not.toBe(undefined)
})

it('determines notes', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.chosenFirstNote).toEqual('D3')
  expect(bar1.chosenNotesBetween.length).toEqual(2)

  let bar2 = sw.sectionA.lines[0].bars[1]
  bar2.chooseNotes()

  let bar3 = sw.sectionA.lines[0].bars[2]
  bar3.chooseNotes()
})

it('determines notes while changing chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.chosenFirstNote).toEqual('D3')
  expect(bar1.chosenNotesBetween.length).toEqual(2)

  let bar2 = sw.sectionA.lines[0].bars[1]
  bar2.chooseNotes()

  let bar3 = sw.sectionA.lines[0].bars[2]
  bar3.chooseNotes()
})