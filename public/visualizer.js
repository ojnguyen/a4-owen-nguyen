import { state } from "./state.js";
import { getFrame } from "./audio.js";

const canvas = document.getElementById("visualizer");
const g = canvas.getContext("2d"); // 2D rendering context for drawing on the canvas.

let W = 0, H = 0; // Size of canvas in CSS pixels (not device pixels), updated in resize()

// NOTE: CSS pixels vs Device pixels:
// CSS pixels: "logical" pixels
// Device pixels: The actual number of pixels on the screen

// The canvas width and height attributes are in device pixels, the CSS width and height properties are in CSS pixels.
// To make the canvas look sharp on high-DPI screens, we set the canvas width/height to the number of deice pixels, then scale it down to CSS pixels.
// Can keep working in CSS pixels for drawing, while canvas is actually using device pixels for rendering.
function resize() {
  const dpr = window.devicePixelRatio || 1; // How many device pixels fit into one CSS pixel
  W = window.innerWidth; // CSS pixels
  H = window.innerHeight; // CSS pixels

  // CSS Pixels x DPR = Device Pixels
  canvas.width = W * dpr; // Device pixels
  canvas.height = H * dpr; // Device pixels
  g.setTransform(dpr, 0, 0, dpr, 0, 0); // Scale drawing (vertically and horizontally by dpr) so we can keep working in CSS pixels
}
window.addEventListener("resize", resize); // Whenever window resizes, call resize() to update scales
resize(); // Initial resize to set canvas size

const F_MIN = 40, F_MAX = 14000; // Frequency ranges
const displayedBars = new Float32Array(256); // Room for 256 frequency bins, each holding the volume level of that bin

// Compresses frequency data into count bars in a logarithmic fashion, normalized to [0, 1] instead of [0, 255]
// freq: Frequency data array
// sampleRate: Sample rate of audio context, e.g. 44100 Hz
// count: Number of bars to compress freq into
function computeDisplayedBars(freq, sampleRate, count) {
  const binHz = sampleRate / (2 * freq.length); // Frequency resolution of each bin in Hz
  const ratio = F_MAX / F_MIN; // Ratio of max frequency to min frequency, used to spread out bars logarithmically


  for (let i = 0; i < count; i++) {
    const lowHz = Math.floor((F_MIN * ratio ** (i / count)) / binHz); // Bar's start frequency, converted to a bin index
    const highHz = Math.max(lowHz + 1, Math.ceil((F_MIN * ratio ** ((i + 1) / count)) / binHz)); // Bar's end frequency, converted to a bin index
    let sum = 0;

    // Computes how tall (loud) the bar is by averaging the volume levels of all frequency bins in this bar's range
    for (let j = lowHz; j < highHz; j++) {
      sum += freq[j]; // Sum the volume levels of all frequency bins in this bar's range
    }
    displayedBars[i] = sum / (highHz - lowHz) / 255; // Average volume level of this bar, normalized to [0, 1]
  }
}

// Clears canvas after each frame
function clearcanvas() {
  g.fillStyle = "rgb(29, 22, 22)";
  g.fillRect(0, 0, W, H);
}

// Displays displayedBars on the canvas
// Button-up bars, left (bass) to right (treble)
function drawBars(count) {
  const barW = W / count;
  const maxHeight = H * 0.6; // bars cap at 60% of screen height

  for (let i = 0; i < count; i++) {
    const pos = i / count; // Position of bar in [0, 1]
    const h = Math.min(1, displayedBars[i] * state.sensitivity) * maxHeight; // Height of bar scaled by sensitivity, capped at maxHeight

    // Drawing bars (color of bar is based on position)
    const lightness = 25 + pos * 35;
    g.fillStyle = `hsl(${state.hue}, 70%, ${lightness}%)`;
    g.fillRect(i * barW, H - h, Math.max(1, barW - 2), h);
  }
}

// Displays waveform line through the middle of the bars
// time: 2048 samples of waveform data, each sample in [0, 255], where 128 = no sound, 0 = max negative volume, 255 = max positive volume
function drawWave(time) {
  g.strokeStyle = "#eeeeee";
  g.lineWidth = 2;
  g.beginPath();

  // Draws line through middle of bars
  // - line's y pos is based on waveform data
  // - line's x pos is based on sample index
  for (let i = 0; i < time.length; i++) {
    const x = (i / (time.length - 1)) * W;
    const y = H / 2 + ((time[i] - 128) / 128) * (H * 0.15); // amplitude scaled to 15% of screen height
    if (i === 0) {
      g.moveTo(x, y);
    } else {
      g.lineTo(x, y);
    }
  }
  g.stroke(); // Paints line
}

// Drawing loop, called every animation frame
let running = false;

function frame() {
  const { freq, time, sampleRate } = getFrame(); // Get the latest audio frame data

  clearcanvas(); // Clear the canvas
  computeDisplayedBars(freq, sampleRate, state.barCount); // Compute the displayed bars for the current frame
  drawBars(state.barCount); // Draw the bars for the current frame
  drawWave(time); // Draw the waveform line through the middle

  requestAnimationFrame(frame); // Request the next frame
}

export function startVisualizer() {
  if (running) return;
  running = true;
  requestAnimationFrame(frame); // Start the animation loop (frame() will call itself every frame)
}