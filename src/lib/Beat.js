class Beat {
  constructor(bar, beatIdx) {
    this.bar = bar
    this.beatIdx = beatIdx
  }

  generate(note) {
    this.note = note
  }

  gather() {
    return [this.note]
  }
}

export default Beat