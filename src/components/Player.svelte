<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'


  // var bass = new Tone.PolySynth(Tone.Synth, {
	// 		oscillator: {
	// 			partials: [0, 2, 3, 4],
	// 		}
  // 	}).toDestination();

  var bass = new Tone.MonoSynth({
    volume: 10,
    frequency: 'C2',
    oscillator: {
      type: 'triangle'
    },
    envelope: {
      attack: 0.005,
      decay: 0.991,
      sustain: 0.01,
      release: .004
    }
  })//.toDestination()

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

  const sw = new SongWriter()
  sw.generate()

  let playing = false;
  let buttonText = 'Play'

  Tone.Transport.bpm.value = 50;

  sw.notes = sw.gather()
  let notesToPlay = sw.flatten(sw.notes)
  let currentBeatNumber = -1;

  const bell = new Tone.MetalSynth({
    volume: -100
  }).toDestination();

  let loop = new Tone.Sequence(((time, note) => {
    console.log('playing', note)
    currentBeatNumber += 1
    bell.triggerAttack(note, time, 0);
    bass.triggerAttackRelease(note,
                              '8n',
                              time);

    }), notesToPlay, "8n");

  function togglePlay() {
    if (playing) {
      console.log('stopping'); playing = false;
      buttonText = "Play";
      bass.triggerRelease();
      // Tone.Transport.cancel(0)
      Tone.Transport.pause();

    } else {
      console.log('starting'); playing = true;
      buttonText = 'Pause'

      if (Tone.context.state !== 'running') {
        Tone.context.resume();
      }
      Tone.Transport.start();
      loop.start(0);

    }
  }
</script>

<button type="button" class="btn btn-info btn-lg" data-toggle="button"
    on:click={togglePlay}
          id='play-pause'>{buttonText}</button>

<Score songWriter={sw} {currentBeatNumber}></Score>