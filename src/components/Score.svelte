<script>
  export let songWriter
  export let currentBeatNumber;
</script>

<div class='score'>
  <!-- <div>{currentBeatNumber}</div> -->
  {#each songWriter.sections() as section}
    <div class='section'>Section: {section.part}</div>
    {#each section.lines as line}
      <div class='line'>
        {#each line.bars as bar}
          <span class='chord flex-child'>
            {bar.chord}
          </span>
        {/each}
        {#each line.bars as bar}
          <span class='bar flex-child' class:green={bar.direction == 'up'} class:yellow={bar.direction == 'down'}>
            {#each bar.beats as beat, i}
              <span class='beat'>
                <span class:red={beat.beatNumbers.includes(currentBeatNumber)}>{beat.note}</span> {#if i != bar.beats.length - 1} | {/if}
              </span>
            {/each}
          </span>
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
  }

  .line {
    padding-top: 30px;
    padding-bottom: 30px;
    display: flex;
    flex-wrap: wrap
  }

  .beat {
    padding-right: 4px;
  }

  .bar {
    padding-top: 4px;
  }

  .flex-child {
    flex: 1;
    flex-basis: 25%;
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