import { VisualizerManager } from './components/visualizer-manager.js';
import { RadialBarsVisualizer } from './components/radial-bars.js';
import { WaveformCurveVisualizer } from './components/waveform.js';

const modeItems = document.querySelectorAll('.modes-grid .mode-item');
const manager = new VisualizerManager('mainCanvas');
const visualizers = {
	'Radial Bars': new RadialBarsVisualizer(),
	'Waveform Curve': new WaveformCurveVisualizer()
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