import { Vector3, type Group, type Object3D } from "three/webgpu";
import type { LoadedGLTF } from "./AssetManager";

export class AssetSpawner {
	private _assetCache: Map<string, LoadedGLTF>;

	constructor(assetCache: Map<string, LoadedGLTF>) {
		this._assetCache = assetCache;
	}

	private retrieveFromCache(assetID: string): LoadedGLTF | null {
		const cachedData = this._assetCache.get(assetID);
		if (cachedData == undefined) {
			console.error(
				`[AssetSpawner] Cache miss for asset with id ${assetID}. Did you forget to load it first?`,
			);
			return null;
		}
		return cachedData;
	}

	private getRandomVal(maxSpread: number): number {
		return (Math.random() - 0.5) * maxSpread;
	}

	private getRandomPos(maxSpread: number, randomizeY = false): Vector3 {
		return new Vector3(
			this.getRandomVal(maxSpread),
			randomizeY ? this.getRandomVal(maxSpread) : 0,
			this.getRandomVal(maxSpread),
		);
	}

	private spawnObject(template: Object3D, parent: Group, position: Vector3): void {
		const instance: Object3D = template.clone(true);
		instance.position.copy(position);
		parent.add(instance);
	}

	private fetchTemplate(cachedData: LoadedGLTF, variantID: number): Object3D | null {
		const { data, variants }: LoadedGLTF = cachedData;
		// variants length === 0 -> no variants, load scene
		//              ignore variantID
		if (variants.length === 0) return data.scene;
		// variantID === -1 -> randomize variant
		if (variantID === -1) return variants[Math.floor(Math.random() * variants.length)];
		// has variants + defined variantID
		if (variantID >= 0 && variantID < variants.length) return variants[variantID];
		return null;
	}

	public spawnRandom(
		parent: Group,
		assetID: string,
		count: number,
		maxSpread: number,
		variantID: number = -1,
	) {
		const cachedData: LoadedGLTF | null = this.retrieveFromCache(assetID);
		if (cachedData == null) return;
		const { variants }: LoadedGLTF = cachedData;

		if (variantID < -1) {
			console.error(
				`[AssetSpawner] Invalid variantID provided: ${variantID}. Accepted values are integers >= -1.`,
			);
			return;
		}

		// has variants + invalid variant requested (-1 means random, not a variantID)
		if (variants.length > 0 && variantID >= variants.length) {
			console.error(
				`[AssetSpawner spawnRandom()] Attempted to spawn variant ${variantID} of asset ${assetID}, but the asset only contains ${variants.length} variants`,
			);
			return;
		}

		// no variants
		if (cachedData.variants.length === 0)
			console.warn(
				`[AssetSpawner] The provided asset with id '${assetID}' does not contain variants. The entire GLTF scene will be spawned instead.` +
					(variantID !== -1 ? `. The provided variantID ('${variantID}') will be ignored}.` : ""),
			);

		for (let i = 0; i < count; i++) {
			const template = this.fetchTemplate(cachedData, variantID);
			if (template === null) {
				console.error(
					`[AssetSpawner] Attempted to spawn instance number ${i} of asset with ID ${assetID}, but was unable to fetch a template.`,
				);
				continue;
			}
			this.spawnObject(template, parent, this.getRandomPos(maxSpread));
		}
	}
}
