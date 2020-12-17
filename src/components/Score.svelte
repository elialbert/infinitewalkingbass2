<script>
  export let songWriter
  export let currentBeatNumber;
</script>

<div class='score'>
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
            {#each bar.beats as beat}
              <span class='beat'>
                <span class:red={currentBeatNumber == beat.beatNumber}>{beat.note}</span> |
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
    padding: 20px;
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
    padding: 30px;
    display: flex;
    flex-wrap: wrap
  }

  .beat {
    padding-right: 4px;
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