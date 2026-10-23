import { Note } from 'tonal'
import SongWriter from 'src/lib/SongWriter.js';
import Section from 'src/lib/Section.js';
import Line from 'src/lib/Line.js';
import Bar from 'src/lib/Bar.js';

it('generates 4 beats', () => {
  let sw = new SongWriter(0, null, 'ABA')
  const s = new Section(sw, 'a', 0)
  const l = new Line(s, 0)
  const bar = new Bar(l, 'Cmaj7', 0)
  bar.generate()
  expect(bar.beats.length).toEqual(4)
  bar.beats.forEach((beat, idx) => {
    expect(beat.note).toEqual(bar.notes[idx])
  })
})

it('leads the last bar into the next chorus', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  // last bar of last line of last section has no next bar
  const lastSection = sw.sections()[2]
  const lastLine = lastSection.lines[lastSection.lines.length - 1]
  const lastBar = lastLine.bars[lastLine.bars.length - 1]
  lastBar.prepNextBar()
  expect(lastBar.nextChord).toEqual(sw.nextChorusChord)
})

it('gathers beat data from all 4 beats', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()
  const bar = sw.sections()[0].lines[0].bars[0]
  const data = bar.gather()
  expect(data.length).toEqual(4)
  data.forEach(beatData => {
    expect(beatData).toBeInstanceOf(Array)
    expect(beatData.length).toBeGreaterThanOrEqual(1)
  })
})

it('determines current chord', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sections()[0].lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.firstNote()).toEqual('D2')
  expect(bar1.beats[3].note).not.toBe(undefined)

  let bar2 = sw.sections()[0].lines[0].bars[1]
  bar2.chooseNotes()
  expect(bar1.nextBarFirstNote).not.toBe(undefined)
  expect(bar2.firstNote()).toEqual(bar1.nextBarFirstNote)
  expect(bar2.beats[3].note).not.toBe(undefined)
})

it('determines notes', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.chorusInKey = 1 // walking from the top, no two-feel head
  sw.generate()

  let bar1 = sw.sections()[0].lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.chosenFirstNote).toEqual('D2')
  bar1.beats.forEach(b => expect(Note.midi(b.note)).not.toBe(null))
  expect(bar1.shape.split(',').length).toEqual(3)

  let bar2 = sw.sections()[0].lines[0].bars[1]
  bar2.chooseNotes()

  let bar3 = sw.sections()[0].lines[0].bars[2]
  bar3.chooseNotes()
})

it('determines notes while changing chord', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.chorusInKey = 1 // walking from the top, no two-feel head
  sw.generate()

  let bar1 = sw.sections()[0].lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.chosenFirstNote).toEqual('D2')
  bar1.beats.forEach(b => expect(Note.midi(b.note)).not.toBe(null))
  expect(bar1.shape.split(',').length).toEqual(3)

  let bar2 = sw.sections()[0].lines[0].bars[1]
  bar2.chooseNotes()

  let bar3 = sw.sections()[0].lines[0].bars[2]
  bar3.chooseNotes()
})
it('plays the head of a new key in two', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.generate()
  const bar = sw.sections()[0].lines[0].bars[0]
  bar.chooseNotes()
  expect(bar.twoFeel).toBe(true)
  expect(bar.beats[1].held).toBe(true)
  expect(bar.beats[3].held).toBe(true)
  expect(sw.sections()[1].lines[0].bars[0].twoFeel).toBe(false)
})

it('puts the second chord of a split bar on beat 3', () => {
  let sw = new SongWriter(0, null, 'ABA')
  sw.chorusInKey = 1
  sw.generate()
  const line = sw.sections()[0].lines[0]
  const bar = new Bar(line, ['Dm7', 'G7'], 0)
  bar.generate()
  bar.lastBar = null
  bar.chooseNotes()
  expect(bar.chordAt(1)).toEqual('Dm7')
  expect(bar.chordAt(2)).toEqual('G7')
  expect(['G', 'B', 'D', 'F']).toContain(Note.pitchClass(bar.beats[2].note))
})
