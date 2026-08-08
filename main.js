import { draw, adjustCanvasSize } from './components/visualizer.js';
import { initButtons } from './components/file-upload.js';
import { drawWaveformCurveUI } from './components/waveform.js';

// window.addEventListener('resize', adjustCanvasSize);
// adjustCanvasSize();

initButtons();
// draw();
drawWaveformCurveUI();