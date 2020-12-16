import SongWriter from 'src/lib/SongWriter.js';

it('determines current chord', () => {
  let sw = new SongWriter()
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  expect(bar1.firstNote()).toEqual('D4')
  expect(bar1.lastNote()).not.toBe(null)

  let bar2 = sw.sectionA.lines[0].bars[1]
  expect(bar2.firstNote()).toEqual(bar1.nextBarFirstNote)
  expect(bar2.lastNote()).not.toBe(null)
})

it('determines notes', () => {
  let sw = new SongWriter()
  sw.progA = ['IIm7', 'V7', 'IMaj7']
  sw.key = 'C'
  sw.generate()

  let bar1 = sw.sectionA.lines[0].bars[0]
  bar1.chooseNotes()
  expect(bar1.chosenFirstNote).toEqual('D4')
  expect(bar1.chosenNotesBetween.length).toEqual(2)
})