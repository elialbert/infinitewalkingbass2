import utils from 'src/lib/utils.js'

let setRandom = function(val) {
  const mockMath = Object.create(global.Math);
  mockMath.random = () => val;
  global.Math = mockMath;
}

it('gets random element from array', () => {
  setRandom(0)
  expect(utils.randFromArray([10, 20, 30])).toEqual(10)

  setRandom(0.99)
  expect(utils.randFromArray([10, 20, 30])).toEqual(30)

  setRandom(0.5)
  expect(utils.randFromArray([10, 20, 30])).toEqual(20)
})

it('chooses with decreasing probability - picks first when random > 0.5', () => {
  setRandom(0.99) // 0.99 > 0.5 is true, picks first value
  expect(utils.chooseWithProbabilityDecreasing(['a', 'b', 'c'])).toEqual('a')
})

it('chooses with decreasing probability - falls through to last when random <= 0.5', () => {
  setRandom(0.3) // 0.3 > 0.5 is false for all, falls to last
  expect(utils.chooseWithProbabilityDecreasing(['a', 'b', 'c'])).toEqual('c')
})

it('chooses two random elements in order', () => {
  setRandom(0)
  let result = utils.chooseTwoRandomElementsInOrder(['a', 'b', 'c', 'd'])
  expect(result.length).toEqual(2)
})

it('handles single element array in chooseTwoRandomElementsInOrder', () => {
  setRandom(0)
  let result = utils.chooseTwoRandomElementsInOrder(['x'])
  expect(result).toEqual(['x', 'x'])
})

it('chooses by probability distribution', () => {
  let randFunc = function(_, _2) { return 1 }
  let result = utils.chooseWithProbabilities([1, 2], [50, 50], randFunc)
  expect(result).toEqual(1)

  result = utils.chooseWithProbabilities([2, 1], [50, 50], randFunc)
  expect(result).toEqual(2)

  randFunc = function(_, _2) { return 35 }
  result = utils.chooseWithProbabilities([1, 2], [50, 50], randFunc)
  expect(result).toEqual(1)

  randFunc = function(_, _2) { return 50 }
  result = utils.chooseWithProbabilities([1, 2], [50, 50], randFunc)
  expect(result).toEqual(1)

  randFunc = function(_, _2) { return 51 }
  result = utils.chooseWithProbabilities([1, 2], [50, 50], randFunc)
  expect(result).toEqual(2)

  randFunc = function(_, _2) { return 100 }
  result = utils.chooseWithProbabilities([1, 2], [50, 50], randFunc)
  expect(result).toEqual(2)

  randFunc = function(_, _2) { return 51 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(3)

  randFunc = function(_, _2) { return 5 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(1)

  randFunc = function(_, _2) { return 30 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(2)

  randFunc = function(_, _2) { return 89 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(4)

  randFunc = function(_, _2) { return 90 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(4)

  randFunc = function(_, _2) { return 91 }
  result = utils.chooseWithProbabilities([1, 2, 3, 4, 5], [10, 20, 30, 30, 10], randFunc)
  expect(result).toEqual(5)
})