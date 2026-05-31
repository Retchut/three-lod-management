import "./style.css";
import Stats from "stats.js";
import { PerspectiveCamera, WebGPURenderer } from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import type { AppContext } from "./scenes/BaseScene";
import { SimpleScene } from "./scenes/Simple";
import { RandomizedScene } from "./scenes/Randomized";
import { AssetManager } from "./assetManagement/AssetManager";
import { AssetSpawner } from "./assetManagement/AssetSpawner";
import { getDebugStatsUI, getSceneUI, getSpawnUI } from "./ui/uiPanels";
import { SceneManager } from "./scenes/SceneManager";
import { context } from "three/tsl";

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

const assetManager: AssetManager = new AssetManager();
const assetSpawner: AssetSpawner = new AssetSpawner(assetManager);
await assetManager.loadGLTF("tree", "lod_tree/tree_decimating_modifiers_applied.glb", [
	["Tree", "Tree002", "Tree004", "Tree006"],
	["Tree001", "Tree003", "Tree005", "Tree007"],
]);
await assetManager.loadGLTF("original tree", "realistic_tree/scene.gltf", []);

const ctx: AppContext = {
	renderer: renderer,
	camera: camera,
	camControls: controls,
	assetManager: assetManager,
	assetSpawner: assetSpawner,
};
const sceneManager = new SceneManager();
await sceneManager.loadScene(new SimpleScene(), ctx);
getSceneUI(ctx, sceneManager);
getSpawnUI(ctx, sceneManager);
getDebugStatsUI(ctx);

let lastRenderTime: number = 0;
function renderloop(time: number) {
	const deltaTime = (time - lastRenderTime) / 1000;
	lastRenderTime = time;
	statObjs.forEach((stats: Stats) => stats.begin());
	sceneManager.update(deltaTime, ctx);
	statObjs.forEach((stats: Stats) => stats.end());
}
renderer.setAnimationLoop(renderloop);

// setTimeout(() => currentScene.dispose(), 2000); // we do a little dispose testing
