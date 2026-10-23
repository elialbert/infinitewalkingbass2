<script>
  import { onMount } from 'svelte'

  export let settings
  export let rig
  export let defaults

  const pct = v => `${Math.round(v)}%`
  const ms = v => `${v > 0 ? '+' : ''}${v} ms`
  const db = v => `${v > 0 ? '+' : ''}${v} dB`
  const x = v => `×${Number(v).toFixed(2)}`
  const beats = v => `${Number(v).toFixed(2)} beat`

  const groups = [
    {
      name: 'Time',
      dials: [
        { key: 'tempo', label: 'Tempo', min: 80, max: 320, step: 2, fmt: v => `${v} bpm` },
        { key: 'laidBack', label: 'Laid back', min: -20, max: 40, step: 1, fmt: ms,
          hint: 'behind (+) or on top of (−) the beat' },
        { key: 'humanize', label: 'Humanize', min: 0, max: 25, step: 1, fmt: v => `±${v} ms` }
      ]
    },
    {
      name: 'Feel',
      dials: [
        { key: 'legato', label: 'Legato', min: 0.4, max: 1, step: 0.01, fmt: v => pct(v * 100),
          hint: 'how much of the beat a note rings' },
        { key: 'shortChance', label: 'Short notes', min: 0, max: 60, step: 1, fmt: pct },
        { key: 'shortLength', label: 'Short length', min: 0.15, max: 0.9, step: 0.05, fmt: beats },
        { key: 'liftChance', label: 'Two-feel lifts', min: 0, max: 100, step: 5, fmt: pct,
          hint: 'half notes cut on the and of two' },
        { key: 'dynamics', label: 'Accents', min: 0, max: 2.5, step: 0.05, fmt: x },
        { key: 'ghost', label: 'Ghost notes', min: 0, max: 1.5, step: 0.05, fmt: x }
      ]
    },
    {
      name: 'Lines',
      note: 'rewrites the line from the next bar',
      dials: [
        { key: 'skips', label: 'Skip notes', min: 0, max: 4, step: 0.1, fmt: x,
          hint: 'octave and repeated-note skips' },
        { key: 'triplets', label: 'Triplets', min: 0, max: 5, step: 0.1, fmt: x },
        { key: 'pedals', label: 'Pedals', min: 0, max: 5, step: 0.1, fmt: x,
          hint: 'repeated roots under a dominant' },
        { key: 'pickups', label: 'Pickups', min: 0, max: 3, step: 0.1, fmt: x,
          hint: 'short notes leading out of two-feel half notes' },
        { key: 'adventure', label: 'Adventure', min: 0.3, max: 3, step: 0.05, fmt: x,
          hint: 'how far from the most textbook bar it strays' },
        { key: 'chromatic', label: 'Chromatic', min: -3, max: 3, step: 0.1,
          fmt: v => `${v > 0 ? '+' : ''}${Number(v).toFixed(1)}`,
          hint: 'favor (+) or avoid (−) notes outside the chord scale' }
      ]
    },
    {
      name: 'Tone',
      dials: [
        { key: 'octave', label: 'Octave', min: -1, max: 2, step: 1, fmt: v => v > 0 ? `+${v}` : `${v}` },
        { key: 'brightness', label: 'Brightness', min: 80, max: 1500, step: 10, fmt: v => `${v} Hz` },
        { key: 'pluck', label: 'Pluck', min: 0, max: 5, step: 0.1, fmt: v => `${Number(v).toFixed(1)} oct`,
          hint: 'how far the filter snaps open' },
        { key: 'honk', label: 'Honk', min: 0, max: 8, step: 0.1, fmt: v => `Q ${Number(v).toFixed(1)}`,
          hint: 'filter resonance; turn up for froggy' },
        { key: 'ring', label: 'Ring', min: 0.15, max: 3, step: 0.05, fmt: v => `${Number(v).toFixed(2)} s` },
        { key: 'bite', label: 'String bite', min: 0, max: 60, step: 1, fmt: v => `${v} ¢` },
        { key: 'fingerNoise', label: 'Finger noise', min: 0, max: 1, step: 0.01, fmt: v => pct(v * 100) }
      ]
    },
    {
      name: 'Mix',
      dials: [
        { key: 'low', label: 'Low', min: -12, max: 12, step: 1, fmt: db },
        { key: 'mid', label: 'Mid', min: -12, max: 12, step: 1, fmt: db },
        { key: 'high', label: 'High', min: -12, max: 12, step: 1, fmt: db },
        { key: 'room', label: 'Room', min: 0, max: 0.6, step: 0.01, fmt: v => pct(v * 100) },
        { key: 'roomSize', label: 'Room size', min: 0.3, max: 4, step: 0.1, fmt: v => `${Number(v).toFixed(1)} s` },
        { key: 'compression', label: 'Squash', min: 1, max: 12, step: 0.5, fmt: v => `${v}:1` },
        { key: 'volume', label: 'Volume', min: -24, max: 6, step: 1, fmt: db }
      ]
    }
  ]

  const presets = [
    { value: 'upright', label: 'Upright' },
    { value: 'round', label: 'Round' },
    { value: 'classic', label: 'Classic synth' }
  ]

  function reset(keys) {
    const next = { ...settings }
    keys.forEach(k => { next[k] = defaults[k] })
    settings = next
  }

  // a scope and a level meter, drawn only while the panel is open
  let canvas
  let level = -Infinity
  onMount(() => {
    let frame
    const ctx = canvas.getContext('2d')
    const tick = () => {
      const w = canvas.width = canvas.clientWidth * devicePixelRatio
      const h = canvas.height = canvas.clientHeight * devicePixelRatio
      const values = rig.scope.getValue()
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = getComputedStyle(canvas).color
      ctx.lineWidth = 1.5 * devicePixelRatio
      ctx.beginPath()
      values.forEach((v, i) => {
        const px = (i / (values.length - 1)) * w
        const py = h / 2 - v * h * 0.45
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      })
      ctx.stroke()
      level = rig.meter.getValue()
      frame = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(frame)
  })
  $: levelPct = Math.max(0, Math.min(100, ((level + 60) / 60) * 100))
</script>

<section class="dials" aria-label="Dials">
  <div class="top">
    <label class="preset">
      <span>Voice</span>
      <select bind:value={settings.preset}>
        {#each presets as p}<option value={p.value}>{p.label}</option>{/each}
      </select>
    </label>
    <div class="scope-wrap">
      <canvas class="scope" bind:this={canvas}></canvas>
      <div class="meter" title="output level"><div style="width: {levelPct}%"></div></div>
    </div>
    <button type="button" class="btn" on:click={() => reset(Object.keys(defaults).filter(k => k !== 'tempo'))}>
      Reset all
    </button>
  </div>
  <div class="groups">
    {#each groups as group}
      <fieldset class="group">
        <legend>
          {group.name}
          <button type="button" class="btn reset" on:click={() => reset(group.dials.map(d => d.key))}>reset</button>
        </legend>
        {#if group.note}<p class="note">{group.note}</p>{/if}
        {#each group.dials as d}
          <label class="dial" title={d.hint || ''}>
            <span class="name">{d.label}</span>
            <input type="range" min={d.min} max={d.max} step={d.step} bind:value={settings[d.key]}
              on:dblclick={() => reset([d.key])}>
            <span class="value">{d.fmt(settings[d.key])}</span>
          </label>
        {/each}
      </fieldset>
    {/each}
  </div>
  <p class="tip">Double-click a slider to reset it. Settings are remembered in this browser.</p>
</section>

<style>
  .dials {
    max-width: 1000px;
    margin: 0 auto 1rem;
    border: 1px solid #555;
    border-radius: 4px;
    padding: 0.75rem;
    text-align: left;
    font-size: 0.9em;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }
  .preset {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
  .preset select {
    margin: 0;
  }
  /* the same outlined look as the Play and Dials buttons */
  .btn {
    border: 1px solid #555;
    border-radius: 4px;
    background: none;
    color: #333;
    padding: 0.4rem 1.2rem;
    font-size: 0.9em;
    cursor: pointer;
    margin: 0;
  }
  .btn:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  .btn:active {
    background: rgba(0, 0, 0, 0.1);
  }
  .scope-wrap {
    flex: 1;
    min-width: 0;
  }
  .scope {
    display: block;
    width: 100%;
    height: 48px;
    color: #ff3e00;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 2px;
  }
  .meter {
    height: 3px;
    background: rgba(0, 0, 0, 0.08);
    margin-top: 3px;
  }
  .meter div {
    height: 100%;
    background: #555;
    transition: width 60ms linear;
  }
  .groups {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .group {
    border: 1px solid #ccc;
    border-radius: 4px;
    margin: 0;
    padding: 0.4rem 0.6rem 0.6rem;
    min-width: 0;
  }
  .group legend {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.85em;
    padding: 0 0.25rem;
  }
  .btn.reset {
    font-weight: normal;
    text-transform: none;
    padding: 0 0.5rem;
    margin-left: 0.25rem;
    font-size: 0.85em;
  }
  .dial {
    display: grid;
    grid-template-columns: 6.5em 1fr 5.2em;
    align-items: center;
    gap: 0.4rem;
    margin: 0.15rem 0;
  }
  .dial input {
    width: 100%;
    margin: 0;
    padding: 0;
    min-width: 0;
  }
  .value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #555;
    white-space: nowrap;
  }
  .note {
    color: #888;
    font-size: 0.85em;
    margin: 0 0 0.25rem;
  }
  .tip {
    color: #888;
    font-size: 0.85em;
    margin: 0.6rem 0 0;
  }
  @media (max-width: 760px) {
    .groups {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 640px) {
    .top {
      flex-wrap: wrap;
    }
    .scope-wrap {
      flex-basis: 100%;
      order: 3;
    }
  }
</style>
