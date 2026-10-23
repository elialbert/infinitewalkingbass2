<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'
  window.Tone = Tone

  // Each Sequence slot is one walking beat, so Transport swing would push
  // beats 2 and 4 late. Swung skip notes and triplets are written into the
  // beat subdivisions instead.
  Tone.getTransport().swing = 0

  var bass = new Tone.MonoSynth({
    volume: 5,
    frequency: 'C2',
    oscillator: {
      type: 'square'
    },
    filter: {
      Q: 0,
      type: 'lowpass',
      rolloff: -24,
      frequency: 700
    },
    envelope: {
      attack: 0.02,
      decay: 0.2,
      sustain: 0.1,
      release: 0.18
    },
    filterEnvelope: {
      attack: 0.008,
      decay: 0.18,
      sustain: 0.12,
      release: 0.35,
      baseFrequency: 150,
      octaves: 1.5
    }
  })

  var reverb = new Tone.Reverb({decay: 0.6, wet: 0.2})
  var compressor = new Tone.Compressor({
    threshold: -24,
    ratio: 4,
    attack: 0.005,
    release: 0.15,
    knee: 6
  })
  compressor.set({volume: 3})
  var tremelo = new Tone.Tremolo({
    frequency: 10,
    type: 'sine',
    depth: 1,
    spread: 4,
    wet: 0.15
  })
  bass.chain(reverb, compressor, tremelo, Tone.Destination)

  // Each walking beat is one Sequence slot. Slots are '8n' long, so the
  // quarter-note tempo shown in the UI is twice the Transport bpm.
  const SLOT = '8n'
  const transport = Tone.getTransport()
  const draw = Tone.getDraw()

  let tempo = 134
  $: transport.bpm.value = tempo / 2

  let playing = false
  let started = false
  let buttonText = 'Play'
  let speakerType = 'bass'

  function applySpeakerType() {
    if (speakerType === 'bass') {
      bass.set({
        oscillator: { type: 'square' },
        filter: { Q: 0, frequency: 700, rolloff: -24 },
        filterEnvelope: { baseFrequency: 150, octaves: 1.5 }
      })
    } else {
      bass.set({
        oscillator: { type: 'sawtooth' },
        filter: { Q: 2, frequency: 2500, rolloff: -12 },
        filterEnvelope: { baseFrequency: 500, octaves: 3.5 }
      })
    }
  }

  // lines are generated at real upright-bass pitch; small speakers can't
  // reproduce that, so the tinny setting plays everything an octave up
  function playbackNote(note) {
    if (speakerType === 'tinny') {
      return Tone.Frequency(note).transpose(12).toNote()
    }
    return note
  }

  // the chorus on screen, and the score beat sounding now
  let sw = writeChorus(null)
  let currentBeatNumber = -1

  function writeChorus(prev) {
    const song = new SongWriter(0, prev)
    song.generate()
    song.notes = song.gather()
    return song
  }

  // Schedule `song` to start at transport tick `start`. When it begins, the
  // next chorus is written and scheduled for the tick right after this one's
  // last slot, so the beat never stops between choruses.
  function scheduleChorus(song, start) {
    const slots = song.flatten(song.notes)
    const end = start + slots.length * Tone.Time(SLOT).toTicks()
    const sequence = new Tone.Sequence((time, event) => {
      bass.triggerAttackRelease(playbackNote(event.note), event.duration, time, event.velocity)
      // update the score when the note sounds, not when it is scheduled
      draw.schedule(() => {
        sw = song
        currentBeatNumber = event.beat
      }, time)
    }, slots, SLOT)
    sequence.loop = false
    sequence.start(`${start}i`)
    transport.scheduleOnce(() => scheduleChorus(writeChorus(song), end), `${start}i`)
    transport.scheduleOnce(() => sequence.dispose(), `${end + Tone.Time(SLOT).toTicks()}i`)
  }

  async function togglePlay() {
    if (playing) {
      playing = false
      buttonText = 'Play'
      transport.pause()
      bass.triggerRelease()
      return
    }
    await Tone.start()
    if (!started) {
      started = true
      scheduleChorus(sw, 0)
    }
    playing = true
    buttonText = 'Pause'
    transport.start()
  }
</script>

<div class="controls">
  <button type="button" class="play-btn" on:click={togglePlay}>{buttonText}</button>
  <fieldset class="speaker-type">
    <legend>Speaker type:</legend>
    <label>
      <input type="radio" bind:group={speakerType} value="bass" on:change={applySpeakerType}>
      I have bass
    </label>
    <label>
      <input type="radio" bind:group={speakerType} value="tinny" on:change={applySpeakerType}>
      Tinny
    </label>
  </fieldset>
  <label class="tempo">
    <span>Tempo {tempo}</span>
    <input type="range" min="80" max="260" step="2" bind:value={tempo}>
  </label>
</div>
{#if sw}
  <Score songWriter={sw} {currentBeatNumber}></Score>
{/if}

<style>
  .controls {
    display: inline-flex;
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
  .tempo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9em;
    margin: 0;
  }
  .tempo span {
    min-width: 5.5em;
    text-align: left;
  }
  .speaker-type label {
    display: inline;
    cursor: pointer;
    font-size: 0.9em;
    margin: 0;
  }
</style>