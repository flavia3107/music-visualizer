import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
// import { WaveformCurveVisualizer } from './components/waveform.js';
import { initButtons, getAudioData, audioElement, uploadedFiles, getCurrentTrackId, playTrack } from './components/file-upload.js';
import { PartyMode } from './components/full-screen.js';
import { AudioPlayerController } from './components/audio-player-controller.js';
const CONTROLLER_CONFIG = {
   getTracks: () => uploadedFiles,
   getCurrentTrackId: getCurrentTrackId,
   playTrack: playTrack
};

// Preset Color Palettes mapped to your UI themes
const COLOR_THEMES = {
   'Neon Blue/Pink': {
      blue: 'hsla(195, 100%, 50%, 1)',
      dullBlue: 'hsla(195, 45%, 45%, 0.7)',
      pink: 'hsla(320, 100%, 55%, 1)',
      dullPink: 'hsla(320, 45%, 50%, 0.7)',
      yellow: 'hsla(45, 100%, 50%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   },
   'Solar Flare': {
      blue: 'hsla(35, 100%, 55%, 1)',
      dullBlue: 'hsla(35, 50%, 40%, 0.7)',
      pink: 'hsla(10, 100%, 50%, 1)',
      dullPink: 'hsla(10, 50%, 40%, 0.7)',
      yellow: 'hsla(55, 100%, 50%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   },
   'Midnight Chroma': {
      blue: 'hsla(220, 20%, 65%, 1)',
      dullBlue: 'hsla(220, 15%, 35%, 0.7)',
      pink: 'hsla(260, 25%, 60%, 1)',
      dullPink: 'hsla(260, 20%, 35%, 0.7)',
      yellow: 'hsla(0, 0%, 85%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   }
};

/**
 * Helper to generate a vibrant random HSLA palette on demand
 */
function generateRandomPalette() {
   const baseHue1 = Math.floor(Math.random() * 360);
   const baseHue2 = (baseHue1 + 120 + Math.floor(Math.random() * 60)) % 360;
   const baseHue3 = (baseHue1 + 240 + Math.floor(Math.random() * 60)) % 360;

   return {
      blue: `hsla(${baseHue1}, 100%, 50%, 1)`,
      dullBlue: `hsla(${baseHue1}, 45%, 45%, 0.7)`,
      pink: `hsla(${baseHue2}, 100%, 55%, 1)`,
      dullPink: `hsla(${baseHue2}, 45%, 50%, 0.7)`,
      yellow: `hsla(${baseHue3}, 100%, 50%, 1)`,
      transparent: 'hsla(0, 0%, 0%, 0)'
   };
}

const modeItems = document.querySelectorAll('.modes-grid .mode-item');
const themeItems = document.querySelectorAll('.theme-container .theme-item');

// Initialize VisualizerManager with the default active palette
const manager = new VisualizerManager('mainCanvas', getAudioData, {
   colors: COLOR_THEMES['Neon Blue/Pink']
});

const visualizers = {
   'Radial Bars': new RadialBarsVisualizer(),
   // 'Waveform Curve': new WaveformCurveVisualizer()
};

manager.setVisualizer(visualizers['Radial Bars']);
manager.start();

// Mode Selection Handler
modeItems.forEach(item => {
   item.addEventListener('click', () => {
      const modeName = item.textContent.trim();
      modeItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (visualizers[modeName]) manager.setVisualizer(visualizers[modeName]);
   });
});

// Theme Selection Handler
themeItems.forEach(item => {
   item.addEventListener('click', () => {
      const themeName = item.textContent.trim();

      themeItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (themeName === 'Random Theme') {
         const randomPalette = generateRandomPalette();
         manager.setPalette(randomPalette);
      } else if (COLOR_THEMES[themeName]) {
         manager.setPalette(COLOR_THEMES[themeName]);
      }
   });
});

const partyMode = new PartyMode({
   buttonSelector: '.btn-party',
   targetSelector: '.ui-container',
   fullscreenClass: 'party-fullscreen'
});

function initPlayerControls(audio, controlsContainer, trackOptions) {
   const controller = new AudioPlayerController(audio, controlsContainer, trackOptions);
   return {
      isShuffle: () => controller.isShuffle,
      destroy: () => controller.destroy()
   };
}

initPlayerControls(audioElement, '.player-controls', CONTROLLER_CONFIG);
initButtons();

/*
   Planned Core Features:
   2. Audio Visualization: Render real-time graphics reacting to audio frequencies
   5. Visualizer Modes: Implement 4 distinct visualizer presets (e.g., Frequency Bars, Oscilloscope Waveform, Circular Spectrum, Particle Field)
   6. Custom Themes: Color palettes/themes for visualizer and UI background

   Technical Features to Add:
   - CORS & Audio CORS Handling: Set crossOrigin = "anonymous" for external audio URLs
   - Responsive Canvas Engine: Window resize listener & devicePixelRatio handling for crisp graphics
   - Performance Optimization: requestAnimationFrame loop cleanup on pause/stop to save CPU/GPU resources
   - Drag & Drop Interface: Allow dropping audio files directly onto the visualizer canvas
 */