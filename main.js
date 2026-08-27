import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
// import { WaveformCurveVisualizer } from './components/waveform.js';
import { initButtons, getAudioData, audioElement, uploadedFiles, getCurrentTrackId, playTrack } from './components/file-upload.js';
import { PartyMode } from './components/full-screen.js';
import { AudioPlayerController } from './components/audio-player-controller.js';
import { ThemeManager } from './components/themes-manager.js';

import { COLOR_THEMES } from './config/themes.js';

const CONTROLLER_CONFIG = {
   getTracks: () => uploadedFiles,
   getCurrentTrackId: getCurrentTrackId,
   playTrack: playTrack
};

const manager = new VisualizerManager('mainCanvas', getAudioData, { colors: COLOR_THEMES['Neon Blue/Pink'] });
const themeManager = new ThemeManager(manager);

const visualizers = {
   'Radial Bars': new RadialBarsVisualizer(),
   // 'Waveform Curve': new WaveformCurveVisualizer()
};

manager.setVisualizer(visualizers['Radial Bars']);
manager.start();

const modeItems = document.querySelectorAll('.modes-grid .mode-item');

modeItems.forEach(item => {
   item.addEventListener('click', () => {
      const modeName = item.textContent.trim();
      modeItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (visualizers[modeName]) manager.setVisualizer(visualizers[modeName]);
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