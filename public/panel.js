import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";
import { state } from "./state.js";

// https://tweakpane.github.io/docs/getting-started/

const presets = {
  normal: {
    sensitivity: 1,
    smoothing: 0.7,
    barCount: 48,
    maxBarHeight: 0.6,
    hue: 0,
    waveLineWidth: 2,
    waveYPos: 0.5,
    waveAmplitude: 0.15,
    beatThreshold: 1.3,
    minBeatVolume: 0.5,
    burstSize: 50,
    particleGravity: 60,
    particleSpeed: 1,
    particleLife: 1,
    pointerBurstSize: 10,
    pointerPull: 250,
    beatImpact: 1
  },
  crazy: {
    sensitivity: 1,
    smoothing: 0,
    barCount: 256,
    maxBarHeight: 0.65,
    hue: 0,
    waveLineWidth: 2,
    waveYPos: 0.15,
    waveAmplitude: 0.5,
    beatThreshold: 1,
    minBeatVolume: 0.5,
    burstSize: 75,
    particleGravity: 300,
    particleSpeed: 2,
    particleLife: 10,
    pointerBurstSize: 65,
    pointerPull: 1000,
    beatImpact: 1.5
  },
  chill: {
    sensitivity: 0.2,
    smoothing: 0.8,
    barCount: 256,
    maxBarHeight: 1,
    hue: 200,
    waveLineWidth: 1,
    waveYPos: 0.05,
    waveAmplitude: 0.15,
    beatThreshold: 2,
    minBeatVolume: 1,
    burstSize: 0,
    particleGravity: 60,
    particleSpeed: 1,
    particleLife: 1,
    pointerBurstSize: 5,
    pointerPull: 100,
    beatImpact: 0.5
  }
};

const pane = new Pane({ title: "Controls" });

const presetSelector = { preset: "normal" };
pane.addBinding(presetSelector, "preset", {
  label: "Preset",
  options: Object.keys(presets).map((key) => ({ text: key, value: key })) // e.g. text: "normal", value: "normal"
}).on("change", (newPreset) => {
  const preset = presets[newPreset.value]; // e.g. presets["normal"]
  Object.assign(state, preset);
  pane.refresh();
});

pane.addBlade({ view: "separator" });

const audio = pane.addFolder({ title: "Audio" });
audio.addBinding(state, "sensitivity", { min: 0, max: 5, step: 0.01 });
audio.addBinding(state, "smoothing", { min: 0, max: 1, step: 0.01 });

const bars = pane.addFolder({ title: "Bars & Color" });
bars.addBinding(state, "barCount", { min: 1, max: 256, step: 1 });
bars.addBinding(state, "maxBarHeight", { label: "max bar height", min: 0, max: 1, step: 0.01 });
bars.addBinding(state, "hue", { min: 0, max: 360, step: 1 });

const waveForm = pane.addFolder({ title: "Waveform" });
waveForm.addBinding(state, "waveLineWidth", { label: "line width", min: 0.1, max: 10, step: 0.1 });
waveForm.addBinding(state, "waveYPos", { label: "vertical position", min: 0, max: 1, step: 0.01 });
waveForm.addBinding(state, "waveAmplitude", { label: "amplitude", min: 0, max: 1, step: 0.01 });

const beat = pane.addFolder({ title: "Beat Detection" });
beat.addBinding(state, "beatThreshold", { label: "threshold", min: 1, max: 2, step: 0.01 });
beat.addBinding(state, "minBeatVolume", { label: "min volume", min: 0, max: 1, step: 0.01 });

const particles = pane.addFolder({ title: "Particles" });
particles.addBinding(state, "burstSize", { label: "beat burst size", min: 0, max: 150, step: 1 });
particles.addBinding(state, "particleGravity", { label: "gravity", min: 0, max: 500, step: 1 });
particles.addBinding(state, "particleSpeed", { label: "speed", min: 0.1, max: 10, step: 0.01 });
particles.addBinding(state, "particleLife", { label: "lifetime", min: 0.1, max: 10, step: 0.01 });
particles.addBinding(state, "pointerBurstSize", { label: "click burst size", min: 0, max: 100, step: 1 });
particles.addBinding(state, "pointerPull", { label: "pointer pull", min: 0, max: 2000, step: 10 });
particles.addBinding(state, "beatImpact", { label: "particle beat impact", min: 0, max: 10, step: 0.01 });