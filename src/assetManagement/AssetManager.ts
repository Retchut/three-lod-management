import { Object3D } from "three/webgpu";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

const BASE_MODEL_URL = "models/";

export type LoadedGLTF = {
	data: GLTF;
	variants: Object3D[][]; // should likely be keyed but it's enough for this test
};

export class AssetManager {
	private _gltfLoader: GLTFLoader;
	private _assetCache: Map<string, LoadedGLTF>;

	constructor() {
		this._gltfLoader = new GLTFLoader();
		this._assetCache = new Map<string, LoadedGLTF>();
	}

	// ----- getters -----
	public getLoadedIDs(): string[] {
		return Array.from(this._assetCache.keys());
	}

	public getAsset(assetID: string): LoadedGLTF | null {
		const cachedData = this._assetCache.get(assetID);
		if (cachedData == undefined) {
			console.warn(
				`[AssetManager] Cache miss for asset with id ${assetID}. Did you forget to load it first?`,
			);
			return null;
		}
		return cachedData;
	}
	// --------------------

	// TODO: it's probably worth making this method return the LoadedGLTF object, if nothing else, just for testing purposes
	public async loadGLTF(modelKey: string, modelPath: string, variantNames: string[][]) {
		const gltf: GLTF = await this._gltfLoader.loadAsync(`${BASE_MODEL_URL}${modelPath}`);
		const modelCache: LoadedGLTF = {
			data: gltf,
			variants: [],
		};

		// TODO: maybe it's not such a great idea to allow loading a scene without specifying lods, since the whole point of this
		// 			project is to manage lods. I know my idea is to register loads manually if I happened to export models
		// 			separately, but will I ever do that? I don't think so
		// load entire scene as a variant
		if (variantNames.length === 0) {
			modelCache.variants.push([gltf.scene]);
			this._assetCache.set(modelKey, modelCache);
			return;
		}

		// load variants
		variantNames.forEach((variantLodIDs: string[]) => {
			const variant: Object3D[] = [];
			variantLodIDs.forEach((id: string) => {
				const lodObj = gltf.scene.getObjectByName(id);
				if (lodObj) variant.push(lodObj);
				else
					console.warn(
						`[AssetManager] Unable to find variant '${id}' from the model file '${modelPath}'.`,
					);
			});
			if (variant.length === 0) return; // no lods loaded for this variant
			modelCache.variants.push(variant);
		});
		if (modelCache.variants.length === 0)
			console.warn(
				`[AssetManager] Variant names were provided, but no variants were able to be loaded for model ${modelKey}.`,
			);
		this._assetCache.set(modelKey, modelCache);
	}
}
