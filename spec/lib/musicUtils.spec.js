import musicUtils from 'src/lib/musicUtils.js'

it('chooses a random scale from a chord', () => {
  let result = musicUtils.chooseScale('Dm7')
  expect(result).not.toBe(undefined)
  expect(result).not.toBe(null)
})