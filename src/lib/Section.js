import Line from './Line.js'
import Forms from './Forms.js'

class Section {
  // bars: one entry per bar, each [chord] or [chord, chord]
  constructor(song, part, sectionIdx, bars, twoFeel = false) {
    this.song = song
    this.part = part
    this.sectionIdx = sectionIdx
    // without bars, this is that section of the original ABA form
    this.bars = bars || Forms.build('ABA', song.key, song.chordProgA, song.chordProgB)[part == 'a' ? 0 : 1].bars
    this.twoFeel = twoFeel
    this.barsPerLine = 4
    this.lineCount = Math.ceil(this.bars.length / this.barsPerLine)
    this.lines = []
  }

  nextLine(lineIdx) {
    if (this.lines[lineIdx + 1]) { return this.lines[lineIdx + 1]}

    if (this.song.nextSection(this.sectionIdx)) {
      return this.song.nextSection(this.sectionIdx).lines[0]
    }
    return null
  }

  generate() {
    // link to the previous section so its last bar's beat 4 approaches
    // this section's first note
    const prev = this.song.prevSection(this.sectionIdx)
    let lastLine = prev && prev.lines[prev.lines.length - 1]
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