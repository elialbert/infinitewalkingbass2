import Line from './Line.js'
import utils from './utils'

class Section {
  constructor(song, part, sectionIdx) {
    this.song = song
    this.part = part
    this.sectionIdx = sectionIdx

    this.lineCount = part == 'a' ? 2 : 3
    this.lines = []
    this.barsPerLine = 4
    this.progression = part == 'a' ? this.song.chordProgA : this.song.chordProgB
    this.chordCount = this.progression.length
    this.chordsToBars = this.generateChordsToBars()
  }

  nextLine(lineIdx) {
    if (this.lines[lineIdx + 1]) { return this.lines[lineIdx + 1]}

    if (this.song.nextSection(this.sectionIdx)) {
      return this.song.nextSection(this.sectionIdx).lines[0]
    }
    return null
  }

  getDirectionHint(cur) {
    if (utils.chooseWithProbabilities(['change', 'stay'], [35, 65]) == 'change') {
      return cur == 'down' ? 'up' : 'down'
    }
    return cur || 'down'
  }

  generateChordsToBars() {
    // todo make this dynamic
    return this.part == 'a' ? [2, 2, 4] : [3, 3, 3, 3]
  }

  generate() {
    // console.log('generating section', this.part, this.barsPerLine, this.progression, this.chordsToBars)
    let lastLine
    Array(this.lineCount).fill(1).map((_, lineIdx) => {
      let line = new Line(this, lineIdx)
      line.lastLine = lastLine
      line.generate()

      lastLine = line
      this.lines.push(line)
    })
  }

  gather() {
    return this.lines.map(function(line) {
      return line.gather()
    })
  }
}

export default Section