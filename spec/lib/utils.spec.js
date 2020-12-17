import utils from 'src/lib/utils.js'

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