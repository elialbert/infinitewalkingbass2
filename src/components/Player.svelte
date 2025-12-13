<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'

  window.Tone = Tone

  Tone.Transport.swing = 0.05

  let loopCount = -1

  var bass = new Tone.MonoSynth({
    volume: 15,
    frequency: 'C2',
    oscillator: {
      type: 'sawtooth'
    },
    filter: {
      Q: 1,
      type: 'lowpass',
      rolloff: -24,
      frequency: 400
    },
    envelope: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.4,
      release: 0.8
    },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.3,
      release: 0.5,
      baseFrequency: 150,
      octaves: 1.5
    }
  })

  var reverb = new Tone.Reverb({decay: 0.3})
  var tremelo = new Tone.Tremolo({
    frequency: 10,
    type: 'sine',
    depth: 1,
    spread: 4,
    wet: 0
  })
  bass.chain(reverb, tremelo, Tone.Destination)

  let sw, notesToPlay, loop, totalBeatCount


  let playing = false;
  let buttonText = 'Play'

  Tone.Transport.bpm.value = 60;


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
      callback: (time, note) => {
        currentBeatNumber += 1
        // console.log('playing', note, currentBeatNumber, time, Tone.Transport.seconds)
        bass.triggerAttackRelease(note, '8n', time);

        if (currentBeatNumber == (totalBeatCount - 1)) {
          loop.clear(); loop.stop()
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

  function restart(time) {
    currentBeatNumber = -1
    loopCount += 1
    sw = new SongWriter(loopCount)
    sw.generate()
    sw.notes = sw.gather()
    notesToPlay = sw.flatten(sw.notes)
    totalBeatCount = notesToPlay.flat().filter(function (el) {
      return el != null;
    }).length
    loop = makeLoop(notesToPlay)
    if (time) {
      Tone.Transport.seconds = time
      // console.log('ready', time, loop, Tone.Transport.seconds, )
      loop.start(Tone.Transport.nextSubdivision('8n'))
    }
  }
  restart()
</script>

<button type="button" class="btn btn-info btn-lg" data-toggle="button"
    on:click={togglePlay}
          id='play-pause'>{buttonText}</button>
{#if sw}
  <Score songWriter={sw} {currentBeatNumber}></Score>
{/if}