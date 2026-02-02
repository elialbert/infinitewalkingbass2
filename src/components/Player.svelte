<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'
  window.Tone = Tone

  Tone.Transport.swing = 0.04

  let loopCount = -1

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

  let sw, notesToPlay, loop, totalBeatCount
  let nextSw, nextNotesToPlay, nextLoop, nextTotalBeatCount

  let playing = false;
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

  Tone.Transport.bpm.value = 67;


  let currentBeatNumber = -1;

  const bell = new Tone.MetalSynth({
    volume: -100
  }).toDestination();

  function togglePlay() {
    if (playing) {
      // console.log('stopping');
      playing = false;
      buttonText = "Play";
      bass.triggerRelease();
      loop.stop()
    } else {
      // console.log('starting');
      playing = true;
      buttonText = 'Pause'

      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }
      loop.start(Tone.Transport.seconds);
      Tone.Transport.start();


    }
  }

  function makeLoop(notesToPlay) {
    return new Tone.Sequence({
      callback: (time, event) => {
        currentBeatNumber += 1
        if (typeof event === 'object' && event !== null) {
          bass.triggerAttackRelease(event.note, event.duration, time, event.velocity)
        } else {
          bass.triggerAttackRelease(event, '8n', time)
        }

        if (currentBeatNumber == (totalBeatCount - 1)) {
          loop.stop()
          return restart(time)
        }
      },
      events: notesToPlay,
      subdivision: "8n",
      loop: false,
      loopEnd: 1,
      humanize: 0.003
    });
  }

  function prepareNext() {
    let nextLoopCount = loopCount + 1
    nextSw = new SongWriter(nextLoopCount)
    nextSw.generate()
    nextSw.notes = nextSw.gather()
    nextNotesToPlay = nextSw.flatten(nextSw.notes)
    nextTotalBeatCount = nextNotesToPlay.flat().filter(function (el) {
      return el != null;
    }).length
    nextLoop = makeLoop(nextNotesToPlay)
  }

  function restart(time) {
    currentBeatNumber = -1
    loopCount += 1

    if (nextLoop) {
      sw = nextSw
      notesToPlay = nextNotesToPlay
      totalBeatCount = nextTotalBeatCount
      loop = nextLoop
      nextSw = null
      nextNotesToPlay = null
      nextLoop = null
      nextTotalBeatCount = null
    } else {
      sw = new SongWriter(loopCount)
      sw.generate()
      sw.notes = sw.gather()
      notesToPlay = sw.flatten(sw.notes)
      totalBeatCount = notesToPlay.flat().filter(function (el) {
        return el != null;
      }).length
      loop = makeLoop(notesToPlay)
    }

    if (time) {
      const eighthNote = Tone.Time('8n').toSeconds()
      const lookahead = time - Tone.context.currentTime
      Tone.Transport.seconds = 0
      loop.start(lookahead + eighthNote)
    }

    prepareNext()
  }
  restart()
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
  .speaker-type label {
    display: inline;
    cursor: pointer;
    font-size: 0.9em;
    margin: 0;
  }
</style>