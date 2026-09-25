import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";
import { state } from "./state.js";

// https://tweakpane.github.io/docs/getting-started/

const pane = new Pane({ title: "Controls" });

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
particles.addBinding(state, "pointerPull", { label: "pointer pull", min: 0, max: 1000, step: 10 });
particles.addBinding(state, "beatImpact", { label: "particle beat impact", min: 0, max: 10, step: 0.01 });