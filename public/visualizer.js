import { state } from "./state.js";
import { getFrame } from "./audio.js";

const canvas = document.getElementById("visualizer");
const g = canvas.getContext("2d"); // 2D rendering context for drawing on the canvas.

let bassAvg = 0; // Recent average bass level
let lastBeatTime = 0; // Timestamp of last beat 
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
  const maxHeight = H * state.maxBarHeight; // bars cap at maxBarHeight% of screen height

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

// Returns "strength" of beat detected (0 if no beat)
function detectBeat(freq, sampleRate, now) {
  const binHz = sampleRate / (2 * freq.length); // Frequency resolution of each bin in Hz (e.g. 44100 Hz sample rate and 1024 bins = 21.53 Hz per bin)
  const bassBins = Math.max(3, Math.round(150 / binHz)); // Number of bins to consider as "bass"
  let sum = 0;
  for (let i = 1; i < bassBins; i++) { // Ignore bin 0 (DC offset)
    sum += freq[i]; // Sum the volume levels of all bass frequency bins
  }
  const bass = sum / (bassBins - 1) / 255; // Avg volume of bass frequencies, [0, 1]
  const isBeat = bass > state.minBeatVolume && bass > bassAvg * state.beatThreshold && now - lastBeatTime > 100;
  bassAvg += (bass - bassAvg) * 0.05; // Update bass avg
  if (isBeat) {
    lastBeatTime = now;
  }
  return isBeat ? bass : 0;
}

const MAX_PARTICLES = 800;
const particles = [];

// Spawns a burst of count particles at x, y
function spawnBurst(x, y, count, hue) {
  for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const speed = (80 + Math.random() * 160) * state.particleSpeed;
    const life = (0.6 + Math.random() * 0.6) * state.particleLife;

    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: life,
      maxLife: life,
      hue: hue + Math.random() * 20 - 10
    });
  }
}

// Updates particle positions and removes dead particles
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1); // Remove dead particle
      continue;
    }

    // Updating positions based on velocity and dt
    p.vy += state.particleGravity * dt;   // gentle gravity, pulls sparks back downward over time
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

// Draws particles on the canvas
function drawParticles() {
  g.globalCompositeOperation = "lighter"; // Overlapping particles glow brighter (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)
  for (const p of particles) {
    const t = p.life / p.maxLife; // Transparency based on how much life is left
    g.fillStyle = `hsl(${p.hue}, 90%, 65%, ${t})`;
    g.beginPath();
    g.arc(p.x, p.y, 1.5 + 2.5 * t, 0, Math.PI * 2); // Particle radius shrinks over time
    g.fill();
  }
  g.globalCompositeOperation = "source-over"; // reset global composite operation (to prevent fillRect blending)
}

// Finds which bar is currently loudest (so particle bursts spawn from the right spot)
function indexOfLoudestBassBar(count) {
    const bassBars = Math.max(1, Math.round(count * 0.15));
  let loudest = 0;
  for (let i = 1; i < bassBars; i++) {
    if (displayedBars[i] > displayedBars[loudest]) {
      loudest = i;
    }
  }
  return { i: loudest, value: displayedBars[loudest] };
}

// Drawing loop, called every animation frame
let running = false;
let last = 0;

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05); // Time (in seconds) since last frame
  last = now;

  const { freq, time, sampleRate } = getFrame(); // Get the latest audio frame data

  clearcanvas(); // Clear the canvas
  computeDisplayedBars(freq, sampleRate, state.barCount); // Compute the displayed bars for the current frame
  drawBars(state.barCount); // Draw the bars for the current frame
  drawWave(time); // Draw the waveform line through the middle

  const beatStrength = detectBeat(freq, sampleRate, now);
  if (beatStrength > 0) {
    const barW = W / state.barCount;
    const { i, value } = indexOfLoudestBassBar(state.barCount);
    const barH = Math.min(1, displayedBars[i] * state.sensitivity) * (H * state.maxBarHeight); // Height of bar scaled by sensitivity, capped at maxHeight
    spawnBurst((i + 0.5) * barW, H - barH, state.burstSize * value, state.hue); //  Spawns burst at x: center of bar, y: top of bar
    // console.log("Particles spawned:", state.burstSize * value, "at bar", i, "with strength", beatStrength.toFixed(2));
  }
  updateParticles(dt);
  drawParticles();

  requestAnimationFrame(frame); // Request the next frame
}

export function startVisualizer() {
  if (running) return;
  running = true;
  requestAnimationFrame(frame); // Start the animation loop (frame() will call itself every frame)
}