import "./style.css";
import Stats from "stats.js";
import { PerspectiveCamera, WebGPURenderer } from "three/webgpu";
import { FlyControls } from "three/examples/jsm/Addons.js";
import type { AppContext } from "./scenes/BaseScene";
import { SimpleScene } from "./scenes/Simple";
import { AssetManager } from "./assetManagement/AssetManager";
import { AssetSpawner } from "./assetManagement/AssetSpawner";
import { initUI } from "./ui/uiPanels";
import { SceneManager } from "./scenes/SceneManager";
import { LODManager } from "./assetManagement/LODManager";
import { PerformanceManager } from "./performanceManagement/PerformanceManager";

const hideLoadScreen = () => {
	const initLoadScreen: HTMLElement | null = document.querySelector("#init-load-screen");
	if (!initLoadScreen) {
		console.error(
			"[main.ts] Attempted to hide the loading screen, but was unable to locate its HTMLElement.",
		);
		return;
	}

	// the transition is set for 1s, check the variable in style.css
	initLoadScreen.classList.add("fadeout");
	setTimeout(() => initLoadScreen.remove(), 1000);
};

const getWindowRatio: () => number = () => window.innerWidth / window.innerHeight;
const updateRendererSize = (renderer: WebGPURenderer) =>
	renderer.setSize(window.innerWidth, window.innerHeight);

const resizeWindow = (ctx: AppContext) => {
	if (camera.isPerspectiveCamera) {
		camera.aspect = getWindowRatio();
		camera.updateProjectionMatrix();
	} else {
		console.warn(
			"[main.ts] Attempted to resize window with a non-perspective camera. No other camera types are supported as of now. The camera won't be resized, but the renderer will still be updated.",
		);
	}
	updateRendererSize(ctx.renderer);
};

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
updateRendererSize(renderer);
document.body.appendChild(renderer.domElement);

const camera: PerspectiveCamera = new PerspectiveCamera(75, getWindowRatio(), 0.1, 1000);

const controls: FlyControls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 5;
controls.rollSpeed = (Math.PI / 24) * 10;
controls.autoForward = false;
controls.dragToLook = true;

const lodManager = new LODManager(camera);
const performanceManager = new PerformanceManager(lodManager, 60);
const assetManager: AssetManager = new AssetManager();
const assetSpawner: AssetSpawner = new AssetSpawner(assetManager, lodManager);
// ----- asset loading -----
// TODO: move this elsewhere later, and maybe I should consider cleaning up the lod array path creation, as we're following a pattern for storing these lods right now
const emptyLODPath: string = "empty.glb";
assetManager.loadGLTFLODs(
	"tree",
	[
		[
			"lod_tree/lods_separated/variant0/lod0.glb",
			"lod_tree/lods_separated/variant0/lod1.glb",
			"lod_tree/lods_separated/variant0/lod2.glb",
			"lod_tree/lods_separated/variant0/lod3.glb",
		],
		[
			"lod_tree/lods_separated/variant1/lod0.glb",
			"lod_tree/lods_separated/variant1/lod1.glb",
			"lod_tree/lods_separated/variant1/lod2.glb",
			"lod_tree/lods_separated/variant1/lod3.glb",
		],
	],
	0.5,
);
assetManager.loadGLTFLODs(
	"building-graffiti",
	[
		[
			"graffity-building/lod0.glb",
			"graffity-building/lod1.glb",
			"graffity-building/lod2.glb",
			"graffity-building/lod3.glb",
		],
	],
	3.0,
);
assetManager.loadGLTFLODs(
	"building-realistic-1",
	[
		[
			"realistic-building/lod0.glb",
			"realistic-building/lod1.glb",
			"realistic-building/lod2.glb",
			"realistic-building/lod3.glb",
		],
	],
	2.5,
);
assetManager.loadGLTFLODs(
	"building-realistic-2",
	[
		[
			"realistic-building-pbr/lod0.glb",
			"realistic-building-pbr/lod1.glb",
			"realistic-building-pbr/lod2.glb",
			"realistic-building-pbr/lod3.glb",
		],
	],
	2.0,
);

assetManager.loadGLTFLODs(
	"streetlamp",
	[
		[
			"moscow-lamp-post/lod0.glb",
			"moscow-lamp-post/lod1.glb",
			"moscow-lamp-post/lod2.glb",
			"moscow-lamp-post/lod3.glb",
			emptyLODPath,
		],
	],
	1.5,
);
assetManager.loadGLTFLODs(
	"stone-path",
	[
		[
			"slate-stepping-stones/lod0.glb",
			"slate-stepping-stones/lod1.glb",
			"slate-stepping-stones/lod2.glb",
		],
	],
	1.0,
);
assetManager.loadGLTFLODs(
	"grass",
	[["grass/lod0.glb", "grass/lod1.glb", "grass/lod2.glb", emptyLODPath]],
	0.5,
);
assetManager.loadGLTFLODs(
	"rocks",
	[
		[
			"rocks-variants/variant1/lod0.glb",
			"rocks-variants/variant1/lod1.glb",
			"rocks-variants/variant1/lod2.glb",
			emptyLODPath,
		],
		[
			"rocks-variants/variant2/lod0.glb",
			"rocks-variants/variant2/lod1.glb",
			"rocks-variants/variant2/lod2.glb",
			emptyLODPath,
		],
		[
			"rocks-variants/variant3/lod0.glb",
			"rocks-variants/variant3/lod1.glb",
			"rocks-variants/variant3/lod2.glb",
			emptyLODPath,
		],
	],
	0.75,
);
// -------------------------

const ctx: AppContext = {
	renderer: renderer,
	camera: camera,
	camControls: controls,
	assetManager: assetManager,
	assetSpawner: assetSpawner,
	lodManager: lodManager,
	performanceManager: performanceManager,
};
const sceneManager = new SceneManager();
await sceneManager.loadScene(new SimpleScene(), ctx);
initUI(ctx, sceneManager);
hideLoadScreen();

let lastRenderTime: number | null = null;
function renderloop(time: number) {
	const deltatimeSec = lastRenderTime === null ? 0 : (time - lastRenderTime) / 1000;
	lastRenderTime = time;
	statObjs.forEach((stats: Stats) => stats.begin());
	controls.update(deltatimeSec);
	lodManager.update(deltatimeSec);
	sceneManager.update(deltatimeSec, ctx);
	performanceManager.update(lastRenderTime === null ? null : deltatimeSec);
	statObjs.forEach((stats: Stats) => stats.end());
}
renderer.setAnimationLoop(renderloop);
window.addEventListener("resize", () => resizeWindow(ctx), false);

// setTimeout(() => currentScene.dispose(), 2000); // we do a little dispose testing
