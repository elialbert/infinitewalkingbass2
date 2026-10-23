<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import { articulate } from './../lib/Articulation.js'
  import { BassRig, DEFAULT_SETTINGS } from './../audio/BassRig.js'
  import Score from './Score.svelte'
  import Dials from './Dials.svelte'
  window.Tone = Tone

  // Each Sequence slot is one walking beat, so Transport swing would push
  // beats 2 and 4 late. Swung skip notes and triplets are written into the
  // beat subdivisions instead.
  Tone.getTransport().swing = 0

  const rig = new BassRig()

  // Each walking beat is one Sequence slot. Slots are '8n' long, so the
  // quarter-note tempo shown in the UI is twice the Transport bpm.
  const SLOT = '8n'
  const transport = Tone.getTransport()
  const draw = Tone.getDraw()

  // only dials moved off their defaults are saved, so a retuned default
  // still reaches anyone who never touched that dial
  const STORAGE_KEY = 'iwb-dials-changed'
  function loadSettings() {
    try {
      localStorage.removeItem('iwb-dials')
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return { ...DEFAULT_SETTINGS, ...(saved || {}) }
    } catch (e) {
      return { ...DEFAULT_SETTINGS }
    }
  }
  function saveSettings(s) {
    const changed = Object.fromEntries(Object.entries(s).filter(([k, v]) => v !== DEFAULT_SETTINGS[k]))
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(changed)) } catch (e) {}
  }

  let settings = loadSettings()
  let dialsOpen = false

  $: transport.bpm.value = settings.tempo / 2
  $: {
    rig.apply(settings)
    saveSettings(settings)
  }
  // only the feel dials change note lengths; moving any other dial keeps
  // the lengths already drawn
  const FEEL_KEYS = ['legato', 'shortChance', 'shortLength', 'liftChance']
  $: feelKey = FEEL_KEYS.map(k => settings[k]).join()
  $: rearticulate(feelKey)

  // the old speaker switch is now just the octave dial
  $: speakerType = settings.octave > 0 ? 'tinny' : 'bass'
  function setSpeakerType(type) {
    settings = { ...settings, octave: type === 'tinny' ? 1 : 0 }
  }

  let playing = false
  let started = false

  // the chorus on screen, and the score beat sounding now
  let sw = writeChorus(null)
  let currentBeatNumber = -1

  function writeChorus(prev) {
    const song = new SongWriter(0, prev)
    song.generate()
    song.notes = song.gather()
    return song
  }

  // choruses scheduled but not yet finished; their note lengths are worked
  // out again whenever a feel dial moves, so changes are heard right away
  const live = new Set()
  function rearticulate() {
    live.forEach(song => { song.articulated = articulate(song.beats, settings) })
  }

  // Schedule `song` to start at transport tick `start`. When it begins, the
  // next chorus is written and scheduled for the tick right after this one's
  // last slot, so the beat never stops between choruses.
  function scheduleChorus(song, start) {
    song.beats = song.flatten(song.notes)
    song.articulated = articulate(song.beats, settings)
    live.add(song)
    // the sequence carries positions; the event is looked up as it plays
    const slots = song.beats.map((events, b) => events.map((e, i) => e && { b, i }))
    const end = start + slots.length * Tone.Time(SLOT).toTicks()
    const sequence = new Tone.Sequence((time, { b, i }) => {
      const event = song.articulated[b][i]
      rig.play(event, time, Tone.Time(SLOT).toSeconds())
      // update the score when the note sounds, not when it is scheduled
      draw.schedule(() => {
        sw = song
        currentBeatNumber = event.beat
      }, time)
    }, slots, SLOT)
    sequence.loop = false
    sequence.start(`${start}i`)
    transport.scheduleOnce(() => scheduleChorus(writeChorus(song), end), `${start}i`)
    transport.scheduleOnce(() => {
      sequence.dispose()
      live.delete(song)
    }, `${end + Tone.Time(SLOT).toTicks()}i`)
  }

  async function togglePlay() {
    if (playing) {
      playing = false
      transport.pause()
      rig.stop()
      return
    }
    await Tone.start()
    if (!started) {
      started = true
      scheduleChorus(sw, 0)
    }
    playing = true
    transport.start()
  }
</script>

<div class="controls">
  <button type="button" class="play-btn" on:click={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
  <fieldset class="speaker-type">
    <legend>Speaker type:</legend>
    <label>
      <input type="radio" name="speaker" checked={speakerType === 'bass'} on:change={() => setSpeakerType('bass')}>
      I have bass
    </label>
    <label>
      <input type="radio" name="speaker" checked={speakerType === 'tinny'} on:change={() => setSpeakerType('tinny')}>
      Tinny
    </label>
  </fieldset>
  <button type="button" class="play-btn"
    aria-expanded={dialsOpen} on:click={() => dialsOpen = !dialsOpen}>
    Dials {dialsOpen ? '▴' : '▾'}
  </button>
</div>
{#if dialsOpen}
  <Dials bind:settings {rig} defaults={DEFAULT_SETTINGS}></Dials>
{/if}
{#if sw}
  <Score songWriter={sw} {currentBeatNumber}></Score>
{/if}

<style>
  .controls {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .play-btn {
    border: 1px solid #555;
    border-radius: 4px;
    background: none;
    color: #333;
    padding: 0.4rem 1.2rem;
    font-size: 0.9em;
    cursor: pointer;
    margin: 0;
  }
  .play-btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  .play-btn:active {
    background: rgba(0, 0, 0, 0.1);
  }
  .speaker-type {
    border: 1px solid #555;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .speaker-type legend {
    font-size: 0.85em;
    padding: 0 0.25rem;
  }
  .speaker-type label {
    display: inline;
    cursor: pointer;
    font-size: 0.9em;
    margin: 0;
  }
</style>
