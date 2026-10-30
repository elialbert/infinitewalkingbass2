import Memory from 'src/lib/Memory.js'
import SongWriter from 'src/lib/SongWriter.js'
import utils from 'src/lib/utils.js'

afterEach(() => utils.setRandom(null))

const key = Memory.key(['Dm7'], 'G7')

it('recalls nothing for harmony it has not heard', () => {
  utils.setRandom(() => 0)
  const memory = new Memory()
  expect(memory.landing(key)).toBe(null)
  expect(memory.recall(key, 50)).toBe(null)
})

it('recalls a bar played on the same harmony from the same note', () => {
  utils.setRandom(() => 0)
  const memory = new Memory()
  const bar = {}
  memory.remember(key, bar, [50, 52, 53, 54], 55)
  expect(memory.landing(key)).toEqual(50)
  expect(memory.recall(key, 50)).toEqual({ bar, midis: [50, 52, 53, 54], next: 55 })
  // a different first note, or a different next chord, is a different place
  expect(memory.recall(key, 38)).toBe(null)
  expect(memory.recall(Memory.key(['Dm7'], 'Db7'), 50)).toBe(null)
})

it('recalls only some of the time', () => {
  utils.setRandom(() => 0.99)
  const memory = new Memory()
  memory.remember(key, {}, [50, 52, 53, 54], 55)
  expect(memory.landing(key)).toBe(null)
  expect(memory.recall(key, 50)).toBe(null)
})

it('forgets a bar that is written again', () => {
  utils.setRandom(() => 0)
  const memory = new Memory()
  const bar = {}
  memory.remember(key, bar, [50, 52, 53, 54], 55)
  memory.forget(bar)
  expect(memory.recall(key, 50)).toBe(null)
})

it('keeps the memory for the choruses in one key, then starts afresh', () => {
  utils.seed(5)
  const first = new SongWriter(0, null, 'blues')
  first.generate()
  first.notes = first.gather()
  const choruses = [first]
  while (choruses[choruses.length - 1].lastChorusInKey === false) {
    const sw = new SongWriter(0, choruses[choruses.length - 1])
    sw.generate()
    sw.notes = sw.gather()
    choruses.push(sw)
  }
  choruses.forEach(sw => expect(sw.memory).toBe(first.memory))
  expect(first.memory.figures.size).toBeGreaterThan(0)
  const nextKey = new SongWriter(0, choruses[choruses.length - 1])
  expect(nextKey.key).not.toEqual(first.key)
  expect(nextKey.memory).not.toBe(first.memory)
  utils.seed(null)
})
