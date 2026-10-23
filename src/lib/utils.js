// All randomness in the generator goes through `random()` so that it can be
// seeded (for reproducible analysis) or stubbed (in tests).
let random = Math.random

// mulberry32: tiny, fast, good-enough seeded PRNG
function seededRandom(seed) {
  let a = seed >>> 0
  return function() {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// seed the generator; pass null/undefined to go back to Math.random
function seed(s) {
  random = (s === null || s === undefined) ? Math.random : seededRandom(s)
}

// replace the random source with any () => [0, 1) function
function setRandom(fn) {
  random = fn || Math.random
}

// Returns a random integer between min (included) and max (included)
// Using Math.round() will give you a non-uniform distribution!
function getRandomIntInclusive(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function randFromArray(arr) {
  return arr[getRandomIntInclusive(0, arr.length - 1)];
};

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(random() * (i + 1));
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
  let chosen = null
  values.forEach(function(value) {
    if (!chosen) {
      if (random() > 0.5) {
        chosen = value
      }
    }
  })
  return chosen || values[values.length - 1]
}

const utils = {
  seed: seed,
  setRandom: setRandom,
  random: () => random(),
  chooseWithProbabilities: chooseWithProbabilities,
  chooseWithProbabilityDecreasing: chooseWithProbabilityDecreasing,
  randFromArray: randFromArray,
  shuffleArray: shuffleArray
}
export default utils
