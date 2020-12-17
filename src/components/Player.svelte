<script>
  import * as Tone from 'tone'
  import SongWriter from './../lib/SongWriter.js'
  import Score from './Score.svelte'

  var bass = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				partials: [0, 2, 3, 4],
			}
		}).toDestination();

  const sw = new SongWriter()
  sw.generate()

  let playing = false;
  let buttonText = 'Play'

  Tone.Transport.bpm.value = 70;

  sw.notes = sw.gather()
  let notesToPlay = sw.flatten(sw.notes)
  let currentBeatNumber = -1;

  const bell = new Tone.MetalSynth({
    volume: -100
  }).toDestination();

  let loop = new Tone.Sequence(((time, note) => {
    console.log('playing', note)
    bell.triggerAttack(note, time, 0);
    bass.triggerAttackRelease(note,
                              '8n',
                              time);
    currentBeatNumber += 1
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