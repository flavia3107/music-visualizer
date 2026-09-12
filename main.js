import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
import { WaveformCurveVisualizer } from './components/waveform.js';
import { ThemeManager } from './components/themes-manager.js';
import { AudioPlayerController } from './components/audio-player-controller.js';
import { PartyMode } from './components/full-screen.js';
import { SpectralPeakVisualizer } from './components/spectral-peak.js';
import { ParticleFlowVisualizer } from './components/particle-flow.js'
import { VIZUALIZATION_MODES } from './config/visualizers.js';

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
   'Waveform Curve': new WaveformCurveVisualizer(),
   'Spectral Peak': new SpectralPeakVisualizer(),
   'Particle Flow': new ParticleFlowVisualizer()
};

const manager = new VisualizerManager('mainCanvas', getAudioData, { colors: THEME_CONFIG[0].palette });
const themeManager = new ThemeManager(manager);
const partyMode = new PartyMode({ buttonSelector: '.btn-party', targetSelector: '.ui-container', fullscreenClass: 'party-fullscreen' });

function renderVisualizationModes(modes) {
   const container = document.querySelector('.modes-grid');
   if (!container) return;

   container.innerHTML = modes.map(mode => `
   <div class="mode-item ${mode.active ? 'active' : ''}" data-mode="${mode.id}">
     <div class="mode-icon-box" style="background-image: url('${mode.icon}');" aria-label="${mode.title}"></div>
     <span class="mode-title">${mode.title}</span>
   </div>
 `).join('');
}

function initVisualizationEvents() {
   const container = document.querySelector('.modes-grid');
   if (!container) return;

   container.addEventListener('click', (e) => {
      const item = e.target.closest('.mode-item');
      if (!item) return;

      const modeKey = item.dataset.mode;
      container.querySelectorAll('.mode-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      if (visualizers[modeKey]) manager.setVisualizer(visualizers[modeKey]);
   });
}

function initPlayerControls(audio, controlsContainer, trackOptions) {
   const controller = new AudioPlayerController(audio, controlsContainer, trackOptions);
   return {
      isShuffle: () => controller.isShuffle,
      destroy: () => controller.destroy()
   };
}

renderVisualizationModes(VIZUALIZATION_MODES);
initVisualizationEvents();

manager.setVisualizer(visualizers['Radial Bars']);
manager.start();

initPlayerControls(audioElement, '.player-controls', CONTROLLER_CONFIG);
initButtons();

/*
   Technical Features to Add:
   - CORS & Audio CORS Handling: Set crossOrigin = "anonymous" for external audio URLs
   - Responsive Canvas Engine: Window resize listener & devicePixelRatio handling for crisp graphics
   - Performance Optimization: requestAnimationFrame loop cleanup on pause/stop to save CPU/GPU resources
   - Drag & Drop Interface: Allow dropping audio files directly onto the visualizer canvas
   - Add configuration to main portfolio app
   - Deploy MVP
 */