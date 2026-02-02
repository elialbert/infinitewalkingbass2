<script>
  export let songWriter
  export let currentBeatNumber;
</script>

<div class='score'>
  <!-- <div>{currentBeatNumber}</div> -->
  {#each songWriter.sections() as section}
    <div class='section'>{section.part}</div>
    {#each section.lines as line}
      <div class='line'>
        {#each line.bars as bar}
          <div class='bar-group'>
            <div class='chord'>{bar.chord}</div>
            <div class='bar' class:green={bar.direction == 'up'} class:yellow={bar.direction == 'down'}>
              {#each bar.beats as beat, i}
                <span class='beat'>
                  <span class:red={beat.beatNumbers.includes(currentBeatNumber)}>{beat.note}</span> {#if i != bar.beats.length - 1} | {/if}
                </span>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  {/each}
</div>

<style>
  .score {
    padding-top: 20px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    text-align: left;
  }

  .section {
    padding-top: 20px;
    padding-bottom: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .line {
    padding-top: 20px;
    padding-bottom: 20px;
    display: flex;
    flex-wrap: wrap
  }

  .beat {
    padding-right: 4px;
  }

  .bar {
    padding-top: 4px;
  }

  .bar-group {
    flex: 1 1 25%;
  }

  @media (max-width: 640px) {
    .bar-group {
      flex: 0 0 50%;
      padding-bottom: 0.5rem;
    }
  }

  .red {
    color: red;
  }

  .green {
    color: #027041;
  }

  .yellow {
    color: #cca843;
  }
</style>