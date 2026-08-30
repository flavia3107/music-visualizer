import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
// import { WaveformCurveVisualizer } from './components/waveform.js';
import { ThemeManager } from './components/themes-manager.js';
import { AudioPlayerController } from './components/audio-player-controller.js';
import { PartyMode } from './components/full-screen.js';

import {
   initButtons,
   getAudioData,
   audioElement,
   uploadedFiles,
   getCurrentTrackId,
   playTrack
} from './components/file-upload.js';
import { THEME_CONFIG } from './config/themes.js';

const CONTROLLER_CONFIG = { getTracks: () => uploadedFiles, getCurrentTrackId, playTrack };
const visualizers = {
   'Radial Bars': new RadialBarsVisualizer(),
   // 'Waveform Curve': new WaveformCurveVisualizer()
};

const manager = new VisualizerManager('mainCanvas', getAudioData, { colors: THEME_CONFIG[0].palette });
const themeManager = new ThemeManager(manager);
const partyMode = new PartyMode({ buttonSelector: '.btn-party', targetSelector: '.ui-container', fullscreenClass: 'party-fullscreen' });

const modeItems = document.querySelectorAll('.modes-grid .mode-item');
modeItems.forEach(item => {
   item.addEventListener('click', () => {
      const modeName = item.textContent.trim();
      modeItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (visualizers[modeName]) {
         manager.setVisualizer(visualizers[modeName]);
      }
   });
});

function initPlayerControls(audio, controlsContainer, trackOptions) {
   const controller = new AudioPlayerController(audio, controlsContainer, trackOptions);
   return {
      isShuffle: () => controller.isShuffle,
      destroy: () => controller.destroy()
   };
}

manager.setVisualizer(visualizers['Radial Bars']);
manager.start();

initPlayerControls(audioElement, '.player-controls', CONTROLLER_CONFIG);
initButtons();

/*
   Planned Core Features:
   5. Visualizer Modes: Implement 4 distinct visualizer presets (e.g., Frequency Bars, Oscilloscope Waveform, Circular Spectrum, Particle Field)

   Technical Features to Add:
   - CORS & Audio CORS Handling: Set crossOrigin = "anonymous" for external audio URLs
   - Responsive Canvas Engine: Window resize listener & devicePixelRatio handling for crisp graphics
   - Performance Optimization: requestAnimationFrame loop cleanup on pause/stop to save CPU/GPU resources
   - Drag & Drop Interface: Allow dropping audio files directly onto the visualizer canvas
   - Note: Use dynamic configurations for themes, visualizers.
 */