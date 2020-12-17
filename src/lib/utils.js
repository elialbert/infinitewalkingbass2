// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFromArray(arr) {
  return arr[getRandomIntInclusive(0, arr.length - 1)];
};

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}

// take a array of values and an array of respective integer probabilities that sum to 100
// choose a value at random weighted by the array of probabilities
function chooseWithProbabilities(values, probabilities, randFunc) {
  if (!randFunc) {
    randFunc = getRandomIntInclusive
  }
  let randVal = randFunc(1, 100)
  let chosenSum = 0
  let result = null
  probabilities.forEach(function(prob, chosenIdx) {
    chosenSum += prob
    if (!result) {
      if (chosenSum >= randVal) {
        result = values[chosenIdx]
      }
    }
  })
  return result || values[values.length - 1]
}

// assumming an ordered list of values, take each one sequentially at a .5 chance
function chooseWithProbabilityDecreasing(values) {
  const len = values.length
  let chosen = null
  values.forEach(function(value, chosenIdx) {
    if (!chosen) {
      if (Math.random() > 0.5) {
        chosen = value
      }
    }
  })
  return chosen || values[values.length - 1]
}

function chooseTwoRandomElementsInOrder(arr) {
  let c1 = randFromArray(arr)
  const ind = arr.indexOf(c1)
  arr.splice(ind, 1)
  let c2 = randFromArray(arr)
  if (!c2) { c2 = c1 }
  if (arr.indexOf(c1) <= arr.indexOf(c2)) {
    return [c1, c2]
  } else {
    return [c2, c1]
  }
}

const utils = {
  chooseWithProbabilities: chooseWithProbabilities,
  chooseWithProbabilityDecreasing: chooseWithProbabilityDecreasing,
  randFromArray: randFromArray,
  chooseTwoRandomElementsInOrder: chooseTwoRandomElementsInOrder
}
export default utils