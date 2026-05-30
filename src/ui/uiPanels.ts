import GUI, { Controller } from "lil-gui";
import { Vector3 } from "three/webgpu";
import { AssetManager } from "../assetManagement/AssetManager";
import { AssetSpawner } from "../assetManagement/AssetSpawner";
import type { AppContext, BaseScene } from "../scenes/BaseScene";

export function getSpawnUI(context: AppContext, activeScene: BaseScene) {
	const { assetManager, assetSpawner } = context;
	const gui = new GUI({ title: "Spawn Controls" });
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
			if (selectedParams.assetID === "") {
				console.warn(`[getSpawnUI] Attempted to spawn but no asset was selected.`);
				return;
			}
			if (selectedParams.assetVariant === -1) {
				console.warn(`[getSpawnUI] Attempted to spawn but no variant ID was selected.`);
				return;
			}
			if (selectedParams.randomPos) {
				assetSpawner.spawnRandom(
					activeScene.getRoot(),
					selectedParams.assetID,
					1,
					selectedParams.randomSpread,
					selectedParams.assetVariant,
				);
				return;
			}
		},
	};

	const getAssetVariants = (assetID: string) => {
		const assetVariants = assetManager.getAsset(assetID)?.variants;
		return [...Array(assetVariants?.length).keys()];
	};

	const updateSpawnButtonEnabled = (selectedAssetID: string, selectedVariantID: number) => {
		spawnButton.enable(selectedAssetID !== "" && selectedVariantID !== -1);
	};

	const updatePosSelectorsEnabled = (randomizePos: boolean) => {
		[xPosSelector, yPosSelector, zPosSelector].forEach((selector: Controller) =>
			selector.enable(!randomizePos),
		);
		randomSpreadSelector.enable(randomizePos);
	};

	gui
		.add(selectedParams, "assetID", loadedAssets)
		.name("Object")
		.onChange((newAssetID: string) => {
			const variantIDs = getAssetVariants(newAssetID);
			// assetVariant is set to -1 if no variants exist
			variantSelector.enable(variantIDs.length !== 0);
			selectedParams.assetVariant = variantIDs.length === 0 ? -1 : 0;
			variantSelector.options(variantIDs);
			variantSelector.updateDisplay();
			updateSpawnButtonEnabled(newAssetID, selectedParams.assetVariant);
		});
	const variantSelector = gui
		.add(selectedParams, "assetVariant", getAssetVariants(selectedParams.assetID))
		.name("Selected Variant")
		.disable();
	gui
		.add(selectedParams, "randomPos")
		.name("Randomize Position")
		.onChange((randomizePos: boolean) => updatePosSelectorsEnabled(randomizePos));
	const randomSpreadSelector = gui
		.add(selectedParams, "randomSpread", 0, 50)
		.name("Randomization Spread");
	const xPosSelector = gui.add(selectedParams, "x").name("Spawn x");
	const yPosSelector = gui.add(selectedParams, "y").name("Spawn y");
	const zPosSelector = gui.add(selectedParams, "z").name("Spawn z");
	const spawnButton = gui.add(selectedParams, "spawnCallback").name("Spawn Object");

	// ensure ui values are correctly enabled, just in case I forgot anything
	updatePosSelectorsEnabled(selectedParams.randomPos);
	updateSpawnButtonEnabled(selectedParams.assetID, selectedParams.assetVariant);
}
