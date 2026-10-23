import utils from 'src/lib/utils.js'
import Forms, { FORMS } from 'src/lib/Forms.js'
import { Chord } from 'tonal'

afterEach(() => utils.setRandom(null))

const barCount = (sections) => sections.reduce((n, s) => n + s.bars.length, 0)

it('builds each form with the right length', () => {
  utils.setRandom(() => 0.99) // no substitutions
  expect(barCount(Forms.build('blues', 'F'))).toEqual(12)
  expect(barCount(Forms.build('minor blues', 'C'))).toEqual(12)
  expect(barCount(Forms.build('rhythm changes', 'Bb'))).toEqual(32)
  expect(barCount(Forms.build('AABA', 'Eb'))).toEqual(32)
  expect(barCount(Forms.build('ABA', 'C', ['Dm7', 'G7', 'CMaj7'], ['Dm7', 'G7', 'CMaj7', 'Am7']))).toEqual(28)
})

it('writes a jazz blues in the key, with two-chord bars', () => {
  utils.setRandom(() => 0.99)
  const [blues] = Forms.build('blues', 'F')
  expect(blues.bars[0]).toEqual(['F7'])
  expect(blues.bars[3]).toEqual(['Cm7', 'F7'])
  expect(blues.bars[11]).toEqual(['Gm7', 'C7'])
})

it('substitutes a tritone dominant for a V7 resolving down a fifth', () => {
  utils.setRandom(() => 0) // every substitution fires
  const bars = Forms.substitute([['Dm7'], ['G7'], ['CMaj7']], 'C')
  expect(bars.flat()).toContain('Db7')
})

it('leaves the home dominant of a blues alone', () => {
  utils.setRandom(() => 0)
  const bars = Forms.substitute([['F7'], ['Bb7']], 'F')
  expect(bars[0]).toEqual(['F7'])
})

it('can side-slip a two-bar ii-V up a half step', () => {
  // first draw skips the tritone sub, the second fires the side-slip
  const draws = [0.99, 0]
  utils.setRandom(() => draws.length ? draws.shift() : 0.99)
  const bars = Forms.substitute([['Dm7'], ['G7'], ['CMaj7']], 'C')
  expect(bars[0]).toEqual(['Ebm7', 'Ab7'])
  expect(bars[1]).toEqual(['Dm7', 'G7'])
})

it('only picks forms it knows', () => {
  for (let i = 0; i < 20; i++) {
    expect(Object.keys(FORMS)).toContain(Forms.chooseForm())
  }
})
