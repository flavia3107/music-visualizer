import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
// import { WaveformCurveVisualizer } from './components/waveform.js';
import { initButtons, getAudioData, audioElement } from './components/file-upload.js';
import { initPlayerControls } from './components/audio-control.js';
import { PartyMode } from './components/full-screen.js';

const playerController = initPlayerControls(audioElement, '.player-controls');
const modeItems = document.querySelectorAll('.modes-grid .mode-item');
const manager = new VisualizerManager('mainCanvas', getAudioData);
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

const partyMode = new PartyMode({
	buttonSelector: '.btn-party',
	targetSelector: '.ui-container',
	fullscreenClass: 'party-fullscreen'
});

initButtons();

/* ==========================================================================
   MUSIC VISUALIZER - FEATURE ROADMAP & TODO
   ==========================================================================

   Planned Core Features:
   1. Audio Input: Upload local audio files or fetch track via URL
   2. Audio Visualization: Render real-time graphics reacting to audio frequencies
   3. Playlist Management: Upload, store, and manage a queue/list of songs
   4. Media Controls:  skip next/previous
   5. Visualizer Modes: Implement 4 distinct visualizer presets (e.g., Frequency Bars, Oscilloscope Waveform, Circular Spectrum, Particle Field)
   6. Custom Themes: Color palettes/themes for visualizer and UI background

   Technical Features to Add:
   - CORS & Audio CORS Handling: Set crossOrigin = "anonymous" for external audio URLs
   - Responsive Canvas Engine: Window resize listener & devicePixelRatio handling for crisp graphics
   - Performance Optimization: requestAnimationFrame loop cleanup on pause/stop to save CPU/GPU resources
   - Drag & Drop Interface: Allow dropping audio files directly onto the visualizer canvas
   ========================================================================== */