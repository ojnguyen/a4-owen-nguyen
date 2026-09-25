// State is one shared object
// Tweakpane writes to it, visualizer reads from it every frame
export const state = {
  sensitivity: 1, // Sensitivity of the bars to the audio
  smoothing: 0.7, // Low value = more jittery bars, High value = more smooth bars

  barCount: 48,
  hue: 0, // 0 = red, matches the site theme
  // trailFade: 0.18,
};