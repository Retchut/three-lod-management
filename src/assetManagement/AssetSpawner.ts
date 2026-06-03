import { Vector3, type Group, type Object3D } from "three/webgpu";
import type { AssetManager, LoadedGLTF } from "./AssetManager";

export class AssetSpawner {
	private _manager: AssetManager;

	constructor(assetCache: AssetManager) {
		this._manager = assetCache;
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

	private fetchTemplate(
		cachedData: LoadedGLTF,
		variantID: number,
		baseLOD: number = 0,
	): Object3D | null {
		// variantID === -1 -> randomize variant
		// variants length === 0 -> shouldn't happen. If no variants were provided when loading, we set the scene as a variant at least
		const { variants }: LoadedGLTF = cachedData;
		if (variants.length === 0) return null;

		const finalVariantID =
			variantID === -1 ? Math.floor(Math.random() * variants.length) : variantID;
		if (finalVariantID < 0 || finalVariantID >= variants.length) return null;

		const lodArr = variants[finalVariantID];
		if (baseLOD < 0 || baseLOD >= lodArr.length) return null;

		return lodArr[baseLOD];
	}

	private loadCachedData(assetID: string): LoadedGLTF | null {
		const cachedData: LoadedGLTF | null = this._manager.getAsset(assetID);
		if (cachedData == null) return null;

		if (cachedData.variants.length === 0) {
			console.error(`[AssetSpawner] No variants exist for asset ${assetID}.`);
			return null;
		}
		return cachedData;
	}

	private variantValid(variants: Object3D[][], variantID: number): boolean {
		// -1 means random, not a variantID
		if (variantID < -1 || variantID >= variants.length) {
			console.error(
				`[AssetSpawner] Invalid variantID provided: ${variantID}. Accepted values are -1 or integers between 0 and variants.length-1 (${variants.length - 1}).`,
			);
			return false;
		}

		return true;
	}

	private spawnObject(template: Object3D, parent: Group, position: Vector3): Object3D {
		const instance: Object3D = template.clone(true);
		instance.position.copy(position);
		parent.add(instance);
		return instance;
	}

	public spawnSingleLOD(
		parent: Group,
		assetID: string,
		position: Vector3,
		lodID: number,
		variantID: number = -1,
	): Object3D | null {
		const cachedData = this.loadCachedData(assetID);
		if (cachedData == null) return null;

		const { variants } = cachedData;
		if (!this.variantValid(variants, variantID)) return null;

		const template = this.fetchTemplate(cachedData, variantID, lodID);
		if (template === null) {
			console.error(
				`[AssetSpawner] Unable to fetch template for variant ${variantID} of assetID ${assetID}.`,
			);
			return null;
		}
		return this.spawnObject(template, parent, position);
	}

	public spawnAt(
		parent: Group,
		assetID: string,
		position: Vector3,
		variantID: number = -1,
	): Object3D | null {
		const cachedData = this.loadCachedData(assetID);
		if (cachedData == null) return null;

		const { variants } = cachedData;
		if (!this.variantValid(variants, variantID)) return null;

		const template = this.fetchTemplate(cachedData, variantID);
		if (template === null) {
			console.error(
				`[AssetSpawner] Unable to fetch template for variant ${variantID} of assetID ${assetID}.`,
			);
			return null;
		}
		return this.spawnObject(template, parent, position);
	}

	public spawnRandom(
		parent: Group,
		assetID: string,
		count: number,
		maxSpread: number,
		variantID: number = -1,
	): Object3D[] {
		const cachedData = this.loadCachedData(assetID);
		if (cachedData == null) return [];

		const { variants } = cachedData;
		if (!this.variantValid(variants, variantID)) return [];

		let spawnedObjects: Object3D[] = [];
		for (let i = 0; i < count; i++) {
			const template = this.fetchTemplate(cachedData, variantID);
			if (template === null) {
				console.error(
					`[AssetSpawner] Attempted to spawn instance number ${i} of asset with ID ${assetID}, but was unable to fetch a template.`,
				);
				continue;
			}
			const instance = this.spawnObject(template, parent, this.getRandomPos(maxSpread));
			// TODO: Setup LODs with remaining variants [1..X]
			spawnedObjects.push(instance);
		}
		return spawnedObjects;
	}
}
