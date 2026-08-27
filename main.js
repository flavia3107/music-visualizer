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

const COLOR_THEMES = {
   default: {
      blue: 'hsla(195, 100%, 50%, 1)',
      dullBlue: 'hsla(195, 45%, 45%, 0.7)',
      pink: 'hsla(320, 100%, 55%, 1)',
      dullPink: 'hsla(320, 45%, 50%, 0.7)',
      yellow: 'hsla(45, 100%, 50%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   },
   cyberpunk: {
      blue: 'hsla(180, 100%, 50%, 1)',
      dullBlue: 'hsla(180, 50%, 35%, 0.7)',
      pink: 'hsla(300, 100%, 50%, 1)',
      dullPink: 'hsla(300, 50%, 40%, 0.7)',
      yellow: 'hsla(60, 100%, 50%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   },
   sunset: {
      blue: 'hsla(260, 100%, 65%, 1)',
      dullBlue: 'hsla(260, 45%, 45%, 0.7)',
      pink: 'hsla(15, 100%, 60%, 1)',
      dullPink: 'hsla(15, 45%, 50%, 0.7)',
      yellow: 'hsla(45, 100%, 60%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   },
   matrix: {
      blue: 'hsla(140, 100%, 50%, 1)',
      dullBlue: 'hsla(140, 45%, 35%, 0.7)',
      pink: 'hsla(100, 100%, 60%, 1)',
      dullPink: 'hsla(100, 45%, 40%, 0.7)',
      yellow: 'hsla(160, 100%, 70%, 1)',
      transparent: 'hsla(0, 0%, 0%, 0)'
   }
};

const modeItems = document.querySelectorAll('.modes-grid .mode-item');
const manager = new VisualizerManager('mainCanvas', getAudioData, {
   colors: COLOR_THEMES.default
});

const visualizers = {
   'Radial Bars': new RadialBarsVisualizer(),
   // 'Waveform Curve': new WaveformCurveVisualizer()
};

manager.setVisualizer(visualizers['Radial Bars']);
manager.start();

modeItems.forEach(item => {
   item.addEventListener('click', () => {
      const modeName = item.textContent.trim();
      modeItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (visualizers[modeName]) manager.setVisualizer(visualizers[modeName]);
   });
});

const themeItems = document.querySelectorAll('.theme-option, [data-theme]');
themeItems.forEach(item => {
   item.addEventListener('click', () => {
      const themeKey = item.dataset.theme || item.textContent.trim().toLowerCase();
      if (COLOR_THEMES[themeKey]) {
         manager.setPalette(COLOR_THEMES[themeKey]);

         themeItems.forEach(el => el.classList.remove('active'));
         item.classList.add('active');
      }
   });
});

const colorInputs = document.querySelectorAll('input[data-color-key]');
colorInputs.forEach(input => {
   input.addEventListener('input', (e) => {
      const key = e.target.dataset.colorKey;
      manager.setColors({ [key]: e.target.value });
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