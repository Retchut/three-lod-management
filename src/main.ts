import "./style.css";
import Stats from "stats.js";
import { PerspectiveCamera, WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { SimpleScene } from "./scenes/Simple";
import type { AppContext } from "./scenes/BaseScene";
import { RandomizedScene } from "./scenes/Randomized";

// performance monitoring
// TODO: test mem stats panel on chromium - run w/ `--enable-precise-memory-info`
const statObjs = [new Stats(), new Stats(), new Stats()];
statObjs.forEach((stats: Stats, i: number) => {
	stats.showPanel(i);
	// by default these panels seem to be 80px wide, absolutely positioned in the top left corner
	const panelLeft: string = i * 80 + "px";
	stats.dom.style.left = panelLeft;
	document.body.appendChild(stats.dom);
});

const renderer: WebGPURenderer = new WebGPURenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera: PerspectiveCamera = new PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);

const ctx: AppContext = {
	renderer: renderer,
	camera: camera,
	camControls: controls,
};

// let currentScene = new SimpleScene();
let currentScene = new RandomizedScene();
await currentScene.load(ctx);

let lastRenderTime: number = 0;
function renderloop(time: number) {
	const deltaTime = (time - lastRenderTime) / 1000;
	lastRenderTime = time;
	statObjs.forEach((stats: Stats) => stats.begin());
	if (currentScene.isLoaded()) {
		currentScene.update(deltaTime, ctx);
		renderer.render(currentScene.getScene(), camera);
	}
	statObjs.forEach((stats: Stats) => stats.end());
}
renderer.setAnimationLoop(renderloop);
