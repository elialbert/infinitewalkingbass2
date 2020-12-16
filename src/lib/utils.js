import { Chord, Note } from '@tonaljs/tonal'

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
  return result || result[result.length - 1]
}

const acceptableScales = ["ionian pentatonic", "lydian pentatonic", "augmented", "lydian", "augmented heptatonic",
  "harmonic major", "major", "bebop", "bebop major"]
function chooseScale(chord) {
  return randFromArray(Chord.chordScales(chord) && acceptableScales)
}

function chooseTwoRandomElementsInOrder(arr) {
  let c1 = randFromArray(arr)
  let c2 = randFromArray(arr)
  if (arr.indexOf(c1) <= arr.indexOf(c2)) {
    return [c1, c2]
  } else {
    return [c2, c1]
  }
}

function appendOctaveInteger(v, octave) {
  if (!octave) { octave = '4'}
  if (!/\d$/.test(v)) {
    v = `${v}${octave}`
  }
  return v
}

const utils = {
  chooseWithProbabilities: chooseWithProbabilities,
  chooseScale: chooseScale,
  randFromArray: randFromArray,
  chooseTwoRandomElementsInOrder: chooseTwoRandomElementsInOrder,
  appendOctaveInteger: appendOctaveInteger
}
export default utils