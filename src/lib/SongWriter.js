function basicRandom() {
  return Math.random();
}

class SongWriter {
  constructor(random) {
    this.random = random;
    if (!this.random) {
      this.random = basicRandom;
    }
  }
}

export default SongWriter