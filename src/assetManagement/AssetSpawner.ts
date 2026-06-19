import { Vector3, type Group, type Object3D } from "three/webgpu";
import type { AssetManager, LoadedAsset, LoadedGLTF } from "./AssetManager";
import type { LODManager } from "./LODManager";
import { BlendedLOD } from "../components/BlendedLOD";

export class AssetSpawner {
	private _manager: AssetManager;
	private _lodManager: LODManager;
	private _BASE_LOD_DIST: number = 20;
	private _BASE_LOD_HYSTERESIS: number = 0.1;

	constructor(assetManager: AssetManager, lodManager: LODManager) {
		this._manager = assetManager;
		this._lodManager = lodManager;
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

	private resolveVariantID(variants: LoadedAsset[][], variantID: number): number | null {
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

	private loadCachedData(assetID: string): LoadedGLTF | null {
		const cachedData: LoadedGLTF | null = this._manager.getAsset(assetID);
		if (cachedData == null) return null;

		if (cachedData.variants.length === 0) {
			console.error(`[AssetSpawner] No variants exist for asset ${assetID}.`);
			return null;
		}
		return cachedData;
	}

	private variantValid(variants: LoadedAsset[][], variantID: number): boolean {
		// -1 means random, not a variantID
		if (variantID < -1 || variantID >= variants.length) {
			console.error(
				`[AssetSpawner] Invalid variantID provided: ${variantID}. Accepted values are -1 or integers between 0 and variants.length-1 (${variants.length - 1}).`,
			);
			return false;
		}

		return true;
	}

	private loadGLTFData(assetID: string, variantID: number): LoadedGLTF | null {
		const cachedData = this.loadCachedData(assetID);
		if (cachedData == null) return null;

		if (!this.variantValid(cachedData.variants, variantID)) return null;

		return cachedData;
	}

	private resolveVariant(
		variants: LoadedAsset[][],
		variantID: number,
		assetID: string,
	): LoadedAsset[] | null {
		const resolvedID = this.resolveVariantID(variants, variantID);
		if (resolvedID == null) {
			console.error(
				`[AssetSpawner] Unable to resolve variant ID for variant ${variantID} of assetID ${assetID}.`,
			);
			return null;
		}
		return variants[resolvedID];
	}

	private spawnVariantLODs(
		variantAsset: LoadedAsset[],
		parent: Group,
		position: Vector3,
		lodQuality: number,
	): Object3D {
		const lodObj: BlendedLOD = new BlendedLOD();
		lodObj.position.copy(position);
		parent.add(lodObj);
		variantAsset.forEach((asset: LoadedAsset, lodID: number) => {
			lodObj.initLevel(lodID * this._BASE_LOD_DIST, this._BASE_LOD_HYSTERESIS);
			asset.onLoad((template: Object3D) => {
				if (lodObj.parent == null) return; // in case the scene was destroyed before loading happened
				lodObj.fillLevel(lodID, template.clone(true));
			});
		});
		this._lodManager.register(lodObj, lodQuality); // this requires that the levels are initialized
		return lodObj;
	}

	public spawnLODsAt(
		parent: Group,
		assetID: string,
		position: Vector3,
		variantID: number = -1,
	): Object3D | null {
		const cachedData: LoadedGLTF | null = this.loadGLTFData(assetID, variantID);
		if (cachedData == null) return null;

		const variant: LoadedAsset[] | null = this.resolveVariant(
			cachedData.variants,
			variantID,
			assetID,
		);
		if (variant == null) return null;

		return this.spawnVariantLODs(variant, parent, position, cachedData.objectQuality);
	}

	public spawnLODsRandom(
		parent: Group,
		assetID: string,
		count: number,
		maxSpread: number,
		variantID: number = -1,
	): Object3D[] {
		const cachedData: LoadedGLTF | null = this.loadGLTFData(assetID, variantID);
		if (cachedData == null) return [];

		let spawnedObjects: Object3D[] = [];
		for (let i = 0; i < count; i++) {
			const variant: LoadedAsset[] | null = this.resolveVariant(
				cachedData.variants,
				variantID,
				assetID,
			);
			if (variant == null) {
				console.error(
					`[AssetSpawner] Unable to resolve variant ID for instance number ${i} of asset with ID ${assetID}.`,
				);
				continue;
			}
			const instance: Object3D = this.spawnVariantLODs(
				variant,
				parent,
				this.getRandomPos(maxSpread),
				cachedData.objectQuality,
			);
			spawnedObjects.push(instance);
		}
		return spawnedObjects;
	}
}
