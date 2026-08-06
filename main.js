import { draw, adjustCanvasSize } from './components/visualizer.js';


window.addEventListener('resize', adjustCanvasSize);
adjustCanvasSize();

draw();