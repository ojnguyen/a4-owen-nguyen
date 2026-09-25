// State is one shared object
// Tweakpane writes to it, visualizer reads from it every frame
export const state = {
  sensitivity: 1, // Sensitivity of the bars to the audio
  smoothing: 0.7, // Low value = more jittery bars, High value = more smooth bars

  barCount: 48,
  maxBarHeight: 0.6, // Max height of bars as a fraction of screen height
  hue: 0,

  waveLineWidth: 2, // Width of the waveform line
  waveYPos: 0.5, // Vertical position of the waveform line, as a fraction of screen height
  waveAmplitude: 0.15, // Amplitude of the waveform line, as a fraction of screen height

  beatThreshold: 1.3, // How far above its own recent average bass must jump to count as a beat
  minBeatVolume: 0.5, // Minimum volume of bass to count as a beat
  burstSize: 50, // Relative number of particles spawned per "beat"
  particleGravity: 60, // Gravity applied to particles, pulls them down over time
  particleSpeed: 1, // Multiplier for particle speed
  particleLife: 1, // Multiplier for particle life
  pointerBurstSize: 10, // Relative number of particles spawned per mouse click
  pointerPull: 250, // How strongly particles are pulled towards the mouse pointer

  beatImpact: 1 // How strongly a bass beat affects particles 
};