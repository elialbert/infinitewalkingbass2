class Beat {
  constructor(bar, beatIdx) {
    this.bar = bar
    this.beatIdx = beatIdx
    this.onlyRoot = true
  }

  // actual note choosing logic happens during second pass ie gather
  generate(note) {
    this.note = note
  }

  chooseNote(note) {
    this.note = note
  }

  gather() {
    return [this.note]
  }
}

export default Beat