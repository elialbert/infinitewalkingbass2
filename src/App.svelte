<script lang='ts'>
  import Player from './components/Player.svelte'
</script>

<main>
  <h1>Infinite Walking Bass Generator 2</h1>
  <Player></Player>
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
    padding: 10px;
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

  @media (max-width: 640px) {
		h1 {
			font-size: 1.5em
		}
	}
</style>