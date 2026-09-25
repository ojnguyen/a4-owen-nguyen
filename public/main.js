import { initAudio, useDemo, useSystemAudio, onEnded } from "./audio.js";
import { startVisualizer } from './visualizer.js';
import "./panel.js";

const overlay = document.getElementById("overlay");
const startOrCloseButton = document.getElementById("start");
const helpButton = document.getElementById("help");
const demoButton = document.getElementById("demo");
const errorBox = document.getElementById("error");

let running = false;

// Display dialog overlay when page loads
overlay.showModal();

// Handles when user clicks cancel in the media permission picker
function errorMessage(err) {
  if (err.name === "NotAllowedError") {
    return "Browser blocked audio. Please click the start button to allow audio.";
  }
  if (err.name === "NotReadableError") {
    return "Your audio device blocked sharing. Try switching your Windows output device (e.g. to your speakers instead of headphones), or use the tab-audio or demo option below.";
  }
  return err.message || String(err);
}

// Called when user clicks start button, audioSource is either useDemo or useSystemAudio 
async function begin(audioSource) {
  errorBox.textContent = "";
  try {
    initAudio();
    await audioSource();
    running = true;
    overlay.close();
    startVisualizer();
  } catch (err) {
    console.error(err.name, err.message);
    errorBox.textContent = errorMessage(err);
  }
}

// Changes the callback in audio.js to this function, called when ends unexpectedly
onEnded(() => {
  running = false;
  errorBox.textContent = "Audio sharing stopped. Press start to share again.";
  overlay.showModal();
});

startOrCloseButton.addEventListener("click", () => {
  // If its clicked while running (says "Close"), then close the modal
  if (running) {
    overlay.close();
  } else {
    begin(useSystemAudio);
  }
});

demoButton.addEventListener("click", () => {
  if (!running) {
    begin(useDemo);
  }
});

helpButton.addEventListener("click", () => {
  startOrCloseButton.textContent = running ? "Close" : "Start";
  overlay.showModal();
});