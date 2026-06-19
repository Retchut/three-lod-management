import { Object3D } from "three/webgpu";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

// types
const Status = {
	Pending: "pending",
	Loading: "loading",
	Loaded: "loaded",
	Failed: "failed",
} as const;
type Status = (typeof Status)[keyof typeof Status];

type LoadState = {
	status: Status;
	error: unknown | null;
	loadPromise: Promise<Object3D | null> | null;
};

export type LoadedGLTF = {
	variants: LoadedAsset[][]; // should likely be keyed but it's enough for this test
	objectQuality: number; // used to control the quality ratio for this GLTF's lods, if any - defaults to 1.0
};
// ----

export class LoadedAsset {
	// cleared
	private readonly levelID: number = -1;
	private readonly sourcePath: string = "";
	private _loadedTemplate: Object3D | null = null;
	private _loadState: LoadState = { status: Status.Pending, error: null, loadPromise: null };
	private _onLoadCallbacks: Set<(template: Object3D) => void> = new Set();

	constructor(levelID: number, sourcePath: string) {
		this.levelID = levelID;
		this.sourcePath = sourcePath;
		this._loadedTemplate = null;
		this._loadState = { status: Status.Pending, error: null, loadPromise: null };
	}

	// getters
	public getLevelID(): number {
		return this.levelID;
	}

	public getSourcePath(): string {
		return this.sourcePath;
	}

	public getLoadedTemplate(): Object3D | null {
		return this._loadedTemplate;
	}

	public getLoadStatus(): Status {
		return this._loadState.status;
	}

	public getLoadPromise(): Promise<Object3D | null> | null {
		return this._loadState.loadPromise;
	}
	// --------------------

	// load status management
	public setLoadingState(promise: Promise<Object3D | null>): void {
		this._loadState.status = Status.Loading;
		this._loadState.loadPromise = promise;
	}

	public setFailedState(error: unknown): void {
		this._loadState.error = error;
		this._loadState.status = Status.Failed;
		this._loadState.loadPromise = Promise.resolve(null);
		this._onLoadCallbacks.clear();
	}

	public finalizeLoading(template: Object3D): void {
		this._loadedTemplate = template;
		this._loadState.error = null;
		this._loadState.status = Status.Loaded;
		this._loadState.loadPromise = Promise.resolve(template);

		this._onLoadCallbacks.forEach((callback) => callback(template));
		this._onLoadCallbacks.clear();
	}
	// --------------------

	// helpful for calling code when a template finishes loading
	public onLoad(callback: (template: Object3D) => void): void {
		if (this._loadedTemplate !== null) {
			callback(this._loadedTemplate); // call callback immediately
			return;
		}
		this._onLoadCallbacks.add(callback);
	}
}

export class AssetManager {
	private readonly BASE_MODEL_URL = "models/";
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

	private loadLODTemplate(asset: LoadedAsset): Promise<Object3D | null> {
		const loadedTemplate: Object3D | null = asset.getLoadedTemplate();
		if (loadedTemplate !== null) return Promise.resolve(loadedTemplate); // just effectively return the template

		const loadPromise: Promise<Object3D | null> | null = asset.getLoadPromise();
		if (loadPromise !== null) return loadPromise;

		const promise: Promise<Object3D | null> = this._gltfLoader
			.loadAsync(`${this.BASE_MODEL_URL}${asset.getSourcePath()}`)
			.then((gltf: GLTF) => {
				asset.finalizeLoading(gltf.scene);
				return gltf.scene;
			})
			.catch((err: unknown) => {
				console.error(
					`[AssetManager] Failed to load LOD ${asset.getLevelID()} from '${asset.getSourcePath()}'.`,
					err,
				);
				asset.setFailedState(err);
				return null;
			});

		asset.setLoadingState(promise);
		return promise;
	}

	private async loadLODs(modelCache: LoadedGLTF): Promise<void> {
		const upperLOD: number = Math.max(
			0,
			...modelCache.variants.map((variant: LoadedAsset[]) => variant.length),
		);
		// start loading from the highest (less complex) level
		for (let levelID = upperLOD - 1; levelID >= 0; levelID--) {
			const levelLODs: LoadedAsset[] = [];
			modelCache.variants.forEach((variantArray: LoadedAsset[]) => {
				const asset: LoadedAsset | undefined = variantArray[levelID];
				if (asset !== undefined) levelLODs.push(asset);
			});
			await Promise.all(levelLODs.map((lodAsset) => this.loadLODTemplate(lodAsset)));
		}
	}

	public loadGLTFLODs(
		modelKey: string,
		variantLODPaths: string[][],
		lodQuality: number = 1.0,
	): LoadedGLTF {
		const modelCache: LoadedGLTF = {
			variants: variantLODPaths.map((variantPaths: string[]) =>
				variantPaths.map((path: string, levelID: number) => new LoadedAsset(levelID, path)),
			),
			objectQuality: lodQuality,
		};

		if (modelCache.variants.length === 0) {
			console.warn(`[AssetManager] No variants were provided for model ${modelKey}.`);
		}

		this._assetCache.set(modelKey, modelCache);
		this.loadLODs(modelCache); // start loading in bg
		return modelCache;
	}
}
