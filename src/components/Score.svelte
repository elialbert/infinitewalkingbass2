<script>
  export let songWriter
  console.log(songWriter.notes)
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
          <span class='bar flex-child'>
            {#each bar.beats as beat}
              <span class='beat'>{beat.note} | </span>
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
</style>