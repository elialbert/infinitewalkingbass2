import Line from './Line.js'

class Section {
  constructor(song, part) {
    this.song = song
    this.part = part

    this.lineCount = part == 'a' ? 2 : 3
    this.lines = []
    this.barsPerLine = 4
    this.progression = part == 'a' ? this.song.chordProgA : this.song.chordProgB
    this.chordCount = this.progression.length
    this.chordsToBars = this.generateChordsToBars()
  }

  generateChordsToBars() {
    // todo make this dynamic
    return this.part == 'a' ? [2, 2, 4] : [3, 3, 3, 3]
  }

  generate() {
    // console.log('generating section', this.part, this.barsPerLine, this.progression, this.chordsToBars)
    Array(this.lineCount).fill(1).map((_, lineIdx) => {
      let line = new Line(this, lineIdx)
      line.generate()
      this.lines.push(line)
    })
  }

  gather() {
    return this.lines.map(function(line) {
      return line.gather()
    }).flat()
  }
}

export default Section