<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'

  window.Tone = Tone

  Tone.Transport.swing = 0.05

  let loopCount = -1

  // var bass = new Tone.PolySynth(Tone.Synth, {
	// 		oscillator: {
	// 			partials: [0, 2, 3, 4],
	// 		}
  // 	}).toDestination();

  var bass = new Tone.MonoSynth({
    volume: 10,
    frequency: 'C2',
    oscillator: {
      type: 'square4'
    },
    envelope: {
      attack: 0.005,
      decay: 0.991,
      sustain: 0.101,
      release: .001
    }
  })//.toDestination()

  var bass2 = new Tone.MonoSynth({
    volume: -10,
    frequency: 'C2',
    oscillator: {
      type: 'fmsine'
    },
    envelope: {
      attack: 0.005,
      decay: 0.991,
      sustain: 0.001,
      release: .001
    }
  }).toDestination()
  var reverb = new Tone.Reverb({decay: 0.3})
  var tremelo = new Tone.Tremolo({
    frequency: 10,
    type: 'sine',
    depth: 1,
    spread: 4,
    wet: 0
  })
  const bassFilter = new Tone.Filter(100, 'lowpass');
  const eq = new Tone.EQ3({
    lowLevel: 20,
    midLevel: 0,
    highLevel: -20
  })
  bass.chain(eq, reverb, tremelo, Tone.Destination)
  // bass.chain(bassFilter, tremelo, reverb)//.toDestination();
  // bass.toDestination()

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
      // Tone.Transport.cancel(0)
      // Tone.Transport.pause();
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

        // bell.triggerAttack(note, time, 0);
        bass.triggerAttackRelease(note,
                                  '8n',
                                  time);
        bass2.triggerAttackRelease(note,
          '8n',
          time);

        if (currentBeatNumber == (totalBeatCount - 1)) {
          loop.clear(); loop.stop()
          return restart(time)
        }
      },
      events: notesToPlay,
      subdivision: "8n",
      loop: false,
      loopEnd: 1,
      humanize: true
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
      // console.log('ready', time, loop, Tone.Transport.seconds, Tone.Transport.nextSubdivision('32n'))
      loop.start(time)
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