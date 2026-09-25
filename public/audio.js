import { state } from "./state.js";

let ctx; // The AudioContext, the audio engine
let analyzer; // The AnalyzerNode, reads audio data from the AudioContext
let gainNode; // The GainNode, volume control for the audio output

let freqData; // Holds frequency data for current frame 
let timeData; // Holds waveform data for current frame

let cleanup = null; // Undoes whatever source is currently being used (osc, system audio, etc.)
let onEndedCallback = () => { }; // Callback to be called when audio ends

// Called inside the start button click handler (has to be or else browser will block it due to browser autoplay policy)
// audio source (osc, system audio) -> analyzer -> gainNode -> ctx.destination (speakers; although will be setting gain to 0 if not demo)
export function initAudio() {
  // Create audio context

  // If context already exists, just resume it
  if (ctx) {
    ctx.resume();
    return;
  }

  ctx = new AudioContext(); // Creates audio engine

  analyzer = ctx.createAnalyser(); // Creates analyzer node, used each frame to read audio data from the source (osc or system audio)
  analyzer.fftSize = 2048; // Number of samples per frame

  gainNode = ctx.createGain(); // Creates gain node, used to control volume of audio output
  analyzer.connect(gainNode); // Connects analyzer to gain node, after the analyzer reads the audio data, it sends it to the gain node to control volume
  gainNode.connect(ctx.destination); // Connects gain node to audio output (speakers)

  freqData = new Uint8Array(analyzer.frequencyBinCount); // Holds frequency data for current frame, size is half of fftSize (due to FFT symmetry)
  timeData = new Uint8Array(analyzer.fftSize); // Holds waveform data for current frame, size is fftSize
}

// Test sound
export async function useDemo() {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 440; // A4
  osc.connect(analyzer); // osc -> analyzer -> gainNode -> ctx.destination
  osc.start();

  gainNode.gain.value = 0.1; // Actually producing sound, so need to set gain to something other than 0.
}

// Called every animation frame to get latest audio data
export function getFrame() {
  analyzer.smoothingTimeConstant = state.smoothing; // Applies smoothing to audio data

  // Write frequency data to freqData array (For each index (freq bin) in the array, the value represents the volume of that frequency bin (0-255, 0 = no sound, 255 = max volume))
  // Combining these frequency bins produces a frequency visualizer (bars)
  analyzer.getByteFrequencyData(freqData);

  // Write waveform data to timeData array (For each index (sample) in the array, the value represents the amplitude (e.g. speaker position) of the waveform at that point (0-255, 128 = no sound, 0 = max negative volume, 255 = max positive volume))
  // Combining these samples produces a waveform visualizer
  analyzer.getByteTimeDomainData(timeData);

  return { freq: freqData, time: timeData, sampleRate: ctx.sampleRate };
}

// Sets the callback to be called when audio ends unexpectedly, set by main.js
export function onEnded(fn) {
  onEndedCallback = fn;
}

// Cleans up the current audio source (osc, system audio, etc.) and calls the onEnded callback
function handleTrackEnded() {
  if (cleanup) cleanup();
  cleanup = null;
  onEndedCallback();
}

export async function useSystemAudio() {
  // Handle browser compatibility
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error("System audio not supported on this browser. Try using Chrome or Edge.");
  }

  // Get system audio stream
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 1 }, // Required by API but we don't use it https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
    audio: true
  });

  const audioTracks = stream.getAudioTracks();
  const [track] = audioTracks; // [track] gets the first audio track from the stream

  if (!track) {
    stream.getTracks().forEach(track => track.stop());
    throw new Error("No audio track found in system audio stream.");
  }

  const source = ctx.createMediaStreamSource(new MediaStream(audioTracks)); // Creates a MediaStreamAudioSourceNode from the audio stream
  source.connect(analyzer); // Connects the source to the analyzer (then, analyzer -> gainNode -> ctx.destination)
  gainNode.gain.value = 0; // Prevents double playback (OS already playing system audio once)

  track.addEventListener("ended", handleTrackEnded); // Fires if user stops sharing system audio

  // Declaring cleanup function
  cleanup = () => {
    track.removeEventListener("ended", handleTrackEnded);
    stream.getTracks().forEach(track => track.stop());
  };
}