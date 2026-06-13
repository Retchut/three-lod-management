import GUI, { Controller } from "lil-gui";
import { Vector3 } from "three/webgpu";
import { AssetManager } from "../assetManagement/AssetManager";
import type { AppContext, BaseScene } from "../scenes/BaseScene";
import type { SceneManager } from "../scenes/SceneManager";
import { SimpleScene } from "../scenes/Simple";
import { RandomizedScene } from "../scenes/Randomized";
import { LODDisplayScene } from "../scenes/LODDisplay";
import { LODSideBySideScene } from "../scenes/LODSideBySide";

const gui = new GUI({ title: "LOD Manager Controls" });

// some unrelated helpers
const getAssetVariants = (assetManager: AssetManager, assetID: string) => {
	return assetManager.getAsset(assetID)?.variants;
};

const getVariantIdxArray = (assetManager: AssetManager, assetID: string) => {
	return [...Array(getAssetVariants(assetManager, assetID)?.length).keys()];
};

function getSceneUI(ctx: AppContext, sceneManager: SceneManager) {
	const sceneControls = gui.addFolder("Scene Controls");
	const selectedParams = {
		sceneType: "",
		sceneLoader: () => {},
	};

	const checkLoadBtnEnable = () => {
		const currentSceneNotSelected = !(
			sceneManager.getCurrentScene()?.constructor.name === `${selectedParams.sceneType}Scene`
		);
		sceneLoadBtn.enable(currentSceneNotSelected);
	};

	// Note: Scene class names come in the format `<type>Scene`
	const sceneDropdown = sceneControls
		.add(selectedParams, "sceneType", ["Simple", "LODSideBySide", "LODDisplay", "Randomized"])
		.name("Scene to load")
		.onChange(checkLoadBtnEnable);
	const sceneLoadBtn = sceneControls
		.add(selectedParams, "sceneLoader")
		.name("Load")
		.disable()
		.onChange(async () => {
			let newScene: BaseScene;
			switch (selectedParams.sceneType) {
				case "Simple":
					newScene = new SimpleScene();
					break;
				case "LODSideBySide":
					newScene = new LODSideBySideScene();
					break;
				case "LODDisplay":
					newScene = new LODDisplayScene();
					break;
				case "Randomized":
					newScene = new RandomizedScene();
					break;
				default:
					return;
			}
			await sceneManager.loadScene(newScene, ctx);
			checkLoadBtnEnable();
		});

	const currentScene = sceneManager.getCurrentScene();
	if (currentScene != null) {
		sceneDropdown.setValue(currentScene.constructor.name.replace("Scene", ""));
	}
	checkLoadBtnEnable();
}

function getLODUI(ctx: AppContext) {
	const lodControls = gui.addFolder("LOD Quality Controls");
	const selectedParams = {
		lodQuality: 1,
		apply: () => {
			ctx.lodManager.setQuality(selectedParams.lodQuality);
		},
	};
	const qualityListener = {
		get lodQuality() {
			return ctx.lodManager.getQuality();
		},
		get fpsTarget() {
			return ctx.performanceManager.getFPSTarget();
		},
		get fpsAvg() {
			return ctx.performanceManager.getFPSAvg();
		},
	};
	lodControls.add(qualityListener, "fpsTarget").name("FPS Target").listen().decimals(3).disable();
	lodControls.add(qualityListener, "fpsAvg").name("FPS Average").listen().decimals(3).disable();
	lodControls
		.add(qualityListener, "lodQuality")
		.name("Current quality")
		.listen()
		.decimals(3)
		.onChange((val: number) => (selectedParams.lodQuality = val))
		.disable();
	lodControls
		.add(selectedParams, "lodQuality", 0, 5)
		.name("LOD Quality Ratio")
		.onChange((val: number) => applybtn.disable(val == ctx.lodManager.getQuality()));
	const applybtn = lodControls.add(selectedParams, "apply").name("Apply").disable();
}

function getSpawnUI(ctx: AppContext, sceneManager: SceneManager) {
	let currentScene: BaseScene | null = sceneManager.getCurrentScene();
	const { assetManager, assetSpawner } = ctx;
	const spawnControls = gui.addFolder("Spawn Controls");
	const loadedAssets = assetManager.getLoadedIDs();
	const selectedParams = {
		assetID: "",
		assetVariant: -1,
		x: 0,
		y: 0,
		z: 0,
		randomPos: false,
		randomSpread: 0,
		spawnCallback: () => {
			currentScene = sceneManager.getCurrentScene();
			if (currentScene == null) {
				console.error(`[getSpawnUI] No scene to spawn objects into. Aborting...`);
				return;
			}

			const variantNum = getAssetVariants(assetManager, selectedParams.assetID)?.length;
			if (variantNum == null) {
				console.warn(`[getSpawnUI] Attempted to spawn but the selected asset has no variants.`);
				return;
			}
			if (!canSpawn(selectedParams.assetID, selectedParams.assetVariant, variantNum)) {
				console.warn(`[getSpawnUI] Attempted to spawn but no asset was selected.`);
				return;
			}
			if (selectedParams.randomPos) {
				assetSpawner.spawnRandom(
					currentScene.getRoot(),
					selectedParams.assetID,
					1,
					selectedParams.randomSpread,
					selectedParams.assetVariant,
				);
				return;
			}
			assetSpawner.spawnAt(
				currentScene.getRoot(),
				selectedParams.assetID,
				new Vector3(selectedParams.x, selectedParams.y, selectedParams.z),
				selectedParams.assetVariant,
			);
		},
	};

	const canSpawn = (selectedAssetID: string, selectedVariantID: number, variantNum: number) =>
		selectedAssetID !== "" && selectedVariantID >= -1 && selectedVariantID < variantNum;

	const updateSpawnButtonEnabled = (selectedAssetID: string, selectedVariantID: number) => {
		const variantNum = getAssetVariants(assetManager, selectedAssetID)?.length;
		if (variantNum == null) {
			spawnButton.disable();
			return;
		}
		spawnButton.enable(canSpawn(selectedAssetID, selectedVariantID, variantNum));
	};

	const updatePosSelectorsEnabled = (randomizePos: boolean) => {
		[xPosSelector, yPosSelector, zPosSelector].forEach((selector: Controller) =>
			selector.enable(!randomizePos),
		);
		randomSpreadSelector.enable(randomizePos);
	};

	spawnControls
		.add(selectedParams, "assetID", loadedAssets)
		.name("Object")
		.onChange((newAssetID: string) => {
			const variantIDs = getVariantIdxArray(assetManager, newAssetID);
			variantSelector.enable(variantIDs.length !== 0);
			selectedParams.assetVariant = -1;
			variantSelector.options([-1, ...variantIDs]);
			variantSelector.updateDisplay();
			updateSpawnButtonEnabled(newAssetID, selectedParams.assetVariant);
		});
	const variantSelector = spawnControls
		.add(selectedParams, "assetVariant", getVariantIdxArray(assetManager, selectedParams.assetID))
		.name("Selected Variant (-1 = random)")
		.onChange((newAssetVariant: number) => {
			updateSpawnButtonEnabled(selectedParams.assetID, newAssetVariant);
		})
		.disable();
	spawnControls
		.add(selectedParams, "randomPos")
		.name("Randomize Position")
		.onChange((randomizePos: boolean) => updatePosSelectorsEnabled(randomizePos));
	const randomSpreadSelector = spawnControls
		.add(selectedParams, "randomSpread", 0, 50)
		.name("Randomization Spread");
	const xPosSelector = spawnControls.add(selectedParams, "x").name("Spawn x");
	const yPosSelector = spawnControls.add(selectedParams, "y").name("Spawn y");
	const zPosSelector = spawnControls.add(selectedParams, "z").name("Spawn z");
	const spawnButton = spawnControls.add(selectedParams, "spawnCallback").name("Spawn Object");

	// ensure ui values are correctly enabled, just in case I forgot anything
	// Note: this throws cache miss warnings because we're actually testig the cache to define the UI values
	updatePosSelectorsEnabled(selectedParams.randomPos);
	updateSpawnButtonEnabled(selectedParams.assetID, selectedParams.assetVariant);
}

function getDebugStatsUI(ctx: AppContext) {
	const statsFolder = gui.addFolder("Debug Stats");
	const camFolder = statsFolder.addFolder("Camera Stats");
	const memoryFolder = statsFolder.addFolder("Memory Stats").close();
	const renderFolder = statsFolder.addFolder("Render Stats").close();

	const aggregateMetrics = <T extends object>(parent: GUI, metrics: T) => {
		const metricKeys = Object.keys(metrics) as Array<keyof T>;
		metricKeys.forEach((key: keyof T) => parent.add(metrics, key).disable().listen());
	};
	camFolder.add(ctx.camera.position, "x").decimals(3).disable().listen();
	camFolder.add(ctx.camera.position, "y").decimals(3).disable().listen();
	camFolder.add(ctx.camera.position, "z").decimals(3).disable().listen();
	aggregateMetrics(memoryFolder, ctx.renderer.info.memory);
	aggregateMetrics(renderFolder, ctx.renderer.info.render);
}

export function initUI(ctx: AppContext, sceneManager: SceneManager) {
	getSceneUI(ctx, sceneManager);
	getLODUI(ctx);
	getSpawnUI(ctx, sceneManager);
	getDebugStatsUI(ctx);
}
