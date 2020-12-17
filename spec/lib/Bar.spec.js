import SongWriter from 'src/lib/SongWriter.js';

it('determines current chord', () => {
  let sw = new SongWriter()
  sw.chordProgA = ['Dm7', 'A7', 'CMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.firstNote()).toEqual('D2')
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
  expect(bar1.chosenFirstNote).toEqual('D2')
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
  expect(bar1.chosenFirstNote).toEqual('D2')
  expect(bar1.chosenNotesBetween.length).toEqual(2)

  let bar2 = sw.sectionA.lines[0].bars[1]
  bar2.chooseNotes()

  let bar3 = sw.sectionA.lines[0].bars[2]
  bar3.chooseNotes()
})