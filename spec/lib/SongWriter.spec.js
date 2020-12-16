import SongWriter from 'src/lib/SongWriter.js';

it('it works', () => {
  const i = new SongWriter(null)
  expect(i.random()).not.toBe(null)
})

it('forces nonrandom', () => {
  function nonrandom() {
    return 1
  }

  const i = new SongWriter(nonrandom)
  expect(i.random()).toBe(1)
})