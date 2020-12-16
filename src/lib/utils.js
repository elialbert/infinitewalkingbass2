/**************************************************
 * Utilities functions
 **************************************************/

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

const utils = {
  chooseWithProbabilities: chooseWithProbabilities
}
export default utils