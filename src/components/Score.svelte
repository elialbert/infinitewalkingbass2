<script>
  export let songWriter
  export let currentBeatNumber;
</script>

<div class='score'>
  <div class='form'>
    {songWriter.formName} in {songWriter.key}
    · chorus {songWriter.chorusInKey + 1} of {songWriter.chorusesInKey}
  </div>
  {#each songWriter.sections() as section}
    <div class='section'>
      {section.part}
      {#if section.twoFeel}<span class='feel'>two-feel, then walking</span>{/if}
    </div>
    {#each section.lines as line}
      <div class='line'>
        {#each line.bars as bar}
          <div class='bar-group'>
            <div class='chord'>{bar.chords.join('  ')}{#if bar.pedal}<span class='feel'> pedal</span>{/if}</div>
            <div class='bar' class:green={bar.direction == 'up'} class:yellow={bar.direction == 'down'}>
              {#each bar.beats as beat, i}
                <span class='beat'>
                  {#each beat.display() as item}
                    <span class:small={item.small} class:red={item.beat !== undefined && item.beat === currentBeatNumber}>{item.text}</span>
                  {/each}
                  {#if i != bar.beats.length - 1} | {/if}
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

  .form {
    font-size: 0.9em;
    color: #555;
  }

  .section {
    padding-top: 20px;
    padding-bottom: 10px;
    font-weight: bold;
    text-transform: uppercase;
  }

  .feel {
    font-weight: normal;
    text-transform: none;
    font-size: 0.8em;
    color: #777;
    padding-left: 0.5em;
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

  .small {
    font-size: 0.7em;
    padding-left: 1px;
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
