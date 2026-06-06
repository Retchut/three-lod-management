import { LOD, Vector3, type Group, type Object3D } from "three/webgpu";
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

	private resolveVariantID(variants: Object3D[][], variantID: number): number | null {
		if (variants.length === 0) return null;

		// variantID === -1 -> randomize variant
		// else perserve variantID
		if (variantID === -1) {
			return Math.floor(Math.random() * variants.length);
		}

		// catch other illegal variants
		if (variantID < 0 || variantID >= variants.length) return null;

		return variantID;
	}

	private fetchTemplate(variants: Object3D[][], variantID: number, baseLOD: number = 0) {
		const lodArr = variants[variantID];
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

	private spawnLODs(lods: Object3D[], parent: Group, position: Vector3): Object3D {
		const lodObj: LOD = new LOD();
		lods.forEach((level: Object3D, i: number) => {
			lodObj.addLevel(level.clone(true), i * 10, 0.1);
		});
		lodObj.position.copy(position);
		parent.add(lodObj);
		return lodObj;
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

		const resolvedID = this.resolveVariantID(cachedData.variants, variantID);
		if (resolvedID == null) {
			console.error(
				`[AssetSpawner] Unable to resolve variant ID for variant ${variantID} of assetID ${assetID}.`,
			);
			return null;
		}
		const template = this.fetchTemplate(cachedData.variants, resolvedID, lodID);
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

		const resolvedID = this.resolveVariantID(cachedData.variants, variantID);
		if (resolvedID == null) {
			console.error(
				`[AssetSpawner] Unable to resolve variant ID for variant ${variantID} of assetID ${assetID}.`,
			);
			return null;
		}
		return this.spawnLODs(cachedData.variants[resolvedID], parent, position);
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
			const resolvedID: number | null = this.resolveVariantID(cachedData.variants, variantID);
			if (resolvedID == null) {
				console.error(
					`[AssetSpawner] Unable to resolve variant ID for instance number ${i} of asset with ID ${assetID}.`,
				);
				continue;
			}
			const instance = this.spawnLODs(
				cachedData.variants[resolvedID],
				parent,
				this.getRandomPos(maxSpread),
			);
			spawnedObjects.push(instance);
		}
		return spawnedObjects;
	}
}
