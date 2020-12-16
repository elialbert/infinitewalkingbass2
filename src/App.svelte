<script>
  import * as Tone from 'tone'
  import SongWriter from './lib/SongWriter.js'

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

  let notes = sw.gather().flat()
  console.log('grabbed notes', notes)
  const bell = new Tone.MetalSynth({
    volume: -100
  }).toDestination();

  let loop = new Tone.Sequence(((time, note) => {
    console.log('playing', note)
    bell.triggerAttack(note, time, 0);
    bass.triggerAttackRelease(note,
                              '8n',
                              time);
    }), notes, "8n");

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

<main>
  <h1>Infinite Walking Bass Generator Version 2</h1>
  <button type="button" class="btn btn-info btn-lg" data-toggle="button"
    on:click={togglePlay}
          id='play-pause'>{buttonText}</button>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>