// Generate walking lines from a fixed seed and print how they measure up.
//
//   npm run analyze                         # 300 choruses, seed 1
//   npm run analyze -- --songs 50 --seed 7
//   npm run analyze -- --json > before.json # machine-readable
//   npm run analyze -- --midi out.mid       # also write a MIDI file to listen to
//   npm run analyze -- --print 2            # print the first 2 choruses bar by bar
import fs from 'fs'
import midiPkg from '@tonejs/midi'
import { Note } from 'tonal'
import { analyze, generateSongs } from './metrics.js'
import { articulate } from '../src/lib/Articulation.js'

const { Midi } = midiPkg

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) { return fallback }
  const v = process.argv[i + 1]
  return (v === undefined || v.startsWith('--')) ? true : v
}

const songs = Number(arg('songs', 300))
const seed = Number(arg('seed', 1))
const songWriters = generateSongs(songs, seed)
const stats = analyze(songWriters)

// targets describe typical hard bop walking; they're guides, not laws
const rows = [
  ['Invalid notes', stats.invalidNotes, 'count', '0'],
  ['Notes outside E1–D3', stats.outOfRange, '%', '0%'],
  ['Awkward spellings (Fb, Abb, F##…)', stats.awkwardSpelling, '%', '0%'],
  ['Register low / p5 / median / p95 / high',
    `${stats.lowest} / ${stats.p5} / ${stats.median} / ${stats.p95} / ${stats.highest}`, 'text', 'E1 … ~D2 … D3'],
  ['Beat 1 chord tone on chord change', stats.beat1ChordToneOnChange, '%', '~100%'],
  ['Beat 1 root on chord change', stats.beat1RootOnChange, '%', '70–90%'],
  ['Beat 3 chord tone', stats.beat3ChordTone, '%', '60–80%'],
  ['Contour reversal within beats 1→2→3', stats.contourReversal, '%', '10–25%'],
  ['Bars moving one direction (all 4 beats)', stats.oneDirectionBars, '%', '40–55%'],
  ['Stepwise runs (one direction, steps ≤ 2)', stats.stepwiseRuns, '%', '10–20%'],
  ['Most common bar shape', stats.topShapeShare, '%', '< 5%'],
  ['Distinct bar shapes', stats.distinctShapes, 'count', ''],
  ['Beat 4 → 1 by half step', stats.approachHalfStep, '%', '35–55%'],
  ['Beat 4 → 1 by whole step', stats.approachWholeStep, '%', '15–30%'],
  ['Beat 4 → 1 by 4th/5th', stats.approachFourthFifth, '%', '10–25%'],
  ['Beat 4 → 1 by leap > 5th', stats.approachLeap, '%', '< 3%'],
  ['Beats 2–3 outside the harmony', stats.outsideBeats23, '%', '< 12%'],
  ['…of which not resolved by half step', stats.outsideUnresolved, '%', '< 4%'],
  ['Repeated notes', stats.repeatedNotes, '%', '< 4%'],
  ['Leaps larger than a 5th', stats.leapsOverFifth, '%', '< 5%'],
  ['Two-chord bars: beat 3 on the 2nd root', stats.splitBeat3Root, '%', '70–95%'],
  ['Bars in two-feel / pedal', `${(stats.twoFeelBars * 100).toFixed(1)}% / ${(stats.pedalBars * 100).toFixed(1)}%`, 'text', ''],
  ['Beats with a skip note', stats.skipBeats, '%', '8–13%'],
  ['Bars with a triplet figure', stats.tripletBars, '%', '10–15%']
]

function fmt(value, kind) {
  if (kind === '%') { return `${(value * 100).toFixed(1)}%` }
  return String(value)
}

function printBars(sw) {
  console.log(`\n== ${sw.formName} in ${sw.key}, chorus ${sw.chorusInKey + 1} of ${sw.chorusesInKey}`)
  sw.sections().forEach(section => section.lines.forEach(line => line.bars.forEach(bar => {
    const extras = bar.beats.map(b => b.octaveBounce !== 'no' ? 'skip' : b.triplet ? 'trip' : '').filter(Boolean)
    const feel = bar.twoFeel ? 'two' : bar.pedal ? 'pedal' : bar.direction
    console.log(`${section.part.padEnd(6)} ${bar.chords.join(' ').padEnd(13)} ${feel.padEnd(5)} ` +
      bar.beats.map(b => b.note.padEnd(4)).join(' ') + (extras.length ? `  (${extras.join(',')})` : ''))
  })))
}

// Player.svelte plays one "8n" event per beat at 67 bpm, i.e. quarters at 134
const QUARTER_BPM = 134

function writeMidi(path) {
  const midi = new Midi()
  midi.header.setTempo(QUARTER_BPM)
  const track = midi.addTrack()
  track.instrument.number = 32 // acoustic bass
  const beatSeconds = 60 / QUARTER_BPM
  let beat = 0
  songWriters.forEach(sw => {
    articulate(sw.flatten(sw.notes)).forEach(events => {
      events.forEach((event, i) => {
        if (event === null) { return }
        track.addNote({
          midi: Note.midi(event.note),
          time: (beat + i / events.length) * beatSeconds,
          duration: event.length * beatSeconds,
          velocity: event.velocity || 0.8
        })
      })
      beat += 1
    })
  })
  fs.writeFileSync(path, Buffer.from(midi.toArray()))
}

if (arg('json', false)) {
  console.log(JSON.stringify(stats, null, 2))
} else {
  const toPrint = Number(arg('print', 0))
  songWriters.slice(0, toPrint).forEach(printBars)
  console.log(`\n${songs} choruses, seed ${seed}: ${stats.bars} bars, ${stats.beats} beats\n`)
  const w = Math.max(...rows.map(r => r[0].length))
  console.log(`${'metric'.padEnd(w)}  ${'value'.padStart(9)}   hard bop target`)
  rows.forEach(([label, value, kind, target]) => {
    console.log(`${label.padEnd(w)}  ${fmt(value, kind).padStart(9)}   ${target}`)
  })
}

const midiPath = arg('midi', null)
if (midiPath) {
  writeMidi(midiPath)
  console.error(`wrote ${midiPath}`)
}
