<script>
  export let bass;
  export let reverb;
  export let tremelo;
  export let Tone;
  export let playing;
  export let buttonText;
  export let onTogglePlay;

  let open = false;

  // Tone controls
  let oscType = bass.oscillator.type;
  let volume = bass.volume.value;
  let attack = bass.envelope.attack;

  // Filter controls
  let filterFreq = bass.filter.frequency.value;
  let filterRolloff = bass.filter.rolloff;

  // Effects controls
  let reverbWet = reverb.wet.value;
  let reverbDecay = 0.3;
  let tremeloWet = tremelo.wet.value;

  // Timing controls
  let bpm = Tone.Transport.bpm.value;
  let swing = Tone.Transport.swing;

  // Debounce timer for reverb decay
  let decayTimeout;

  function setOscType(e) {
    oscType = e.target.value;
    bass.oscillator.type = oscType;
  }

  function setVolume(e) {
    volume = +e.target.value;
    bass.volume.value = volume;
  }

  function setAttack(e) {
    attack = +e.target.value;
    bass.envelope.attack = attack;
  }

  function setFilterFreq(e) {
    filterFreq = +e.target.value;
    bass.filter.frequency.value = filterFreq;
  }

  function setFilterRolloff(e) {
    filterRolloff = +e.target.value;
    bass.filter.rolloff = filterRolloff;
  }

  function setReverbWet(e) {
    reverbWet = +e.target.value;
    reverb.wet.value = reverbWet;
  }

  function setReverbDecay(e) {
    reverbDecay = +e.target.value;
    clearTimeout(decayTimeout);
    const val = reverbDecay;
    decayTimeout = setTimeout(() => {
      reverb.set({ decay: val });
    }, 150);
  }

  function setTremeloWet(e) {
    tremeloWet = +e.target.value;
    tremelo.wet.value = tremeloWet;
  }

  function setBpm(e) {
    bpm = +e.target.value;
    Tone.Transport.bpm.value = bpm;
  }

  function setSwing(e) {
    swing = +e.target.value;
    Tone.Transport.swing = swing;
  }
</script>

<div class="controls-wrapper">
  <div class="top-bar">
    <button class="play-btn" class:active={playing} on:click={onTogglePlay}>
      {buttonText}
    </button>
    <button class="toggle-btn" class:open on:click={() => open = !open}>
      Controls {open ? '▲' : '▼'}
    </button>
  </div>

  <div class="panel" class:open>
    <div class="panel-inner">
      <div class="group">
        <span class="group-label">TONE</span>
        <label>
          Wave
          <select value={oscType} on:change={setOscType}>
            <option value="triangle">triangle</option>
            <option value="sine">sine</option>
            <option value="square">square</option>
            <option value="sawtooth">sawtooth</option>
          </select>
        </label>
        <label>
          Vol
          <input type="range" min="-12" max="12" step="0.5" value={volume} on:input={setVolume} />
          <span class="val">{volume}dB</span>
        </label>
        <label>
          Atk
          <input type="range" min="0.01" max="0.5" step="0.01" value={attack} on:input={setAttack} />
          <span class="val">{attack.toFixed(2)}s</span>
        </label>
      </div>

      <div class="group">
        <span class="group-label">FILTER</span>
        <label>
          Freq
          <input type="range" min="80" max="2000" step="10" value={filterFreq} on:input={setFilterFreq} />
          <span class="val">{filterFreq}Hz</span>
        </label>
        <label>
          Roll
          <select value={filterRolloff} on:change={setFilterRolloff}>
            <option value={-12}>-12</option>
            <option value={-24}>-24</option>
            <option value={-48}>-48</option>
            <option value={-96}>-96</option>
          </select>
        </label>
      </div>

      <div class="group">
        <span class="group-label">FX</span>
        <label>
          Rev
          <input type="range" min="0" max="1" step="0.01" value={reverbWet} on:input={setReverbWet} />
          <span class="val">{reverbWet.toFixed(2)}</span>
        </label>
        <label>
          Dcy
          <input type="range" min="0.1" max="8" step="0.1" value={reverbDecay} on:input={setReverbDecay} />
          <span class="val">{reverbDecay.toFixed(1)}s</span>
        </label>
        <label>
          Trem
          <input type="range" min="0" max="1" step="0.01" value={tremeloWet} on:input={setTremeloWet} />
          <span class="val">{tremeloWet.toFixed(2)}</span>
        </label>
      </div>

      <div class="group">
        <span class="group-label">TIME</span>
        <label>
          BPM
          <input type="range" min="30" max="200" step="1" value={bpm} on:input={setBpm} />
          <span class="val">{bpm}</span>
        </label>
        <label>
          Swng
          <input type="range" min="0" max="1" step="0.01" value={swing} on:input={setSwing} />
          <span class="val">{swing.toFixed(2)}</span>
        </label>
      </div>
    </div>
  </div>
</div>

<style>
  .controls-wrapper {
    font-family: 'Courier New', monospace;
    color: #ccc;
    width: 100%;
  }

  .top-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
  }

  .play-btn {
    background: #1a1a2e;
    color: #ff3e00;
    border: 2px solid #ff3e00;
    padding: 8px 24px;
    font-size: 16px;
    font-family: inherit;
    cursor: pointer;
    border-radius: 4px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .play-btn:hover {
    background: #ff3e00;
    color: #1a1a2e;
  }

  .play-btn.active {
    background: #ff3e00;
    color: #1a1a2e;
  }

  .toggle-btn {
    background: #1a1a2e;
    color: #888;
    border: 1px solid #333;
    padding: 8px 16px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    border-radius: 4px;
  }

  .toggle-btn:hover, .toggle-btn.open {
    color: #ccc;
    border-color: #555;
  }

  .panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .panel.open {
    max-height: 500px;
  }

  .panel-inner {
    display: flex;
    flex-wrap: wrap;
    background: #1a1a2e;
    border: 1px solid #2a2a4e;
    border-radius: 4px;
    padding: 12px;
    gap: 0;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-right: 1px solid #2a2a4e;
    flex-wrap: wrap;
  }

  .group:last-child {
    border-right: none;
  }

  .group-label {
    color: #ff3e00;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 1px;
    min-width: 42px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #888;
    white-space: nowrap;
  }

  select {
    background: #0d0d1a;
    color: #ccc;
    border: 1px solid #333;
    padding: 2px 4px;
    font-size: 12px;
    font-family: inherit;
    border-radius: 2px;
  }

  input[type="range"] {
    width: 80px;
    accent-color: #ff3e00;
    cursor: pointer;
  }

  .val {
    color: #666;
    font-size: 11px;
    min-width: 40px;
  }

  @media (max-width: 640px) {
    .panel-inner {
      flex-direction: column;
    }

    .group {
      border-right: none;
      border-bottom: 1px solid #2a2a4e;
      width: 100%;
    }

    .group:last-child {
      border-bottom: none;
    }
  }
</style>
