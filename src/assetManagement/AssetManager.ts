import { Object3D } from "three/webgpu";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

const BASE_MODEL_URL = "models/";

export type LoadedGLTF = {
	data: GLTF;
	variants: Object3D[];
};

export class AssetManager {
	private _gltfLoader: GLTFLoader;
	private _assetCache: Map<string, LoadedGLTF>;

	constructor() {
		this._gltfLoader = new GLTFLoader();
		this._assetCache = new Map<string, LoadedGLTF>();
	}

	// ----- getters -----
	public getCache(): Map<string, LoadedGLTF> {
		return this._assetCache;
	}
	// --------------------

	public async loadGLTF(modelKey: string, modelPath: string, variantNames: string[]) {
		const gltf: GLTF = await this._gltfLoader.loadAsync(`${BASE_MODEL_URL}${modelPath}`);
		const modelCache: LoadedGLTF = {
			data: gltf,
			variants: [],
		};

		// if variants are provided, load them
		if (variantNames.length != 0) {
			variantNames.forEach((id: string) => {
				const variant = gltf.scene.getObjectByName(id);
				if (variant) modelCache.variants.push(variant);
				else
					console.warn(
						`[AssetManager] Unable to find load variant '${variantNames}' from the model file '${modelPath}'. This may cause issues when spawning models later down the line.`,
					);
			});
		}
		this._assetCache.set(modelKey, modelCache);
	}
}
