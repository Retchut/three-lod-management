import {
	LOD,
	Material,
	Mesh,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	Vector3,
} from "three/webgpu";

// garbage collection optimization shenanigans that LOD.js was already doing. Might as well keep it
const _v1 = /*@__PURE__*/ new Vector3();
const _v2 = /*@__PURE__*/ new Vector3();

type LODMaterialState = {
	mat: Material;
	originalOpacity: number;
	originalTransparent: boolean;
	originalAlphaHash: boolean;
};

export class BlendedLOD extends LOD {
	// already private in LOD.js, but it is only used for the update logic
	//		no plural because I'd rather overwrite the original variable than keep it around :p
	private _levelMats: Map<number, LODMaterialState[]> = new Map();
	private _currentLevel: number[] = [];

	constructor() {
		super();
	}

	public addLevel(object: Object3D, distance: number = 0, hysteresis: number = 0): this {
		// TODO: this code assumes that the levels are sorted, but this is only true if we're adding levels sequentially.
		// 			the moment we start loading levels in different orders (for example, when I implement assynchronous loading
		// 			of LODs, this will start working.
		// 			That's why we're first calling super.addLevel, to first to push the object into this.levels
		//			I need to refactor this so we don't map an id, but instead map a reference to the Object3D object of that level
		super.addLevel(object, distance, hysteresis);
		const lodID: number = this.levels.length - 1;
		this._levelMats.set(lodID, []);
		// TODO: eerily similar to what we're doing inside BaseScene.dispose. I'm sure I can extract this somehow
		object.traverse((obj: Object3D) => {
			if (!(obj instanceof Mesh)) return;
			const mesh = obj as Mesh;
			const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			mats.forEach((mat: Material) => {
				this._levelMats.get(lodID)?.push({
					mat: mat,
					originalOpacity: mat.opacity,
					originalTransparent: mat.transparent,
					originalAlphaHash: mat.alphaHash,
				});
			});
		});
		return this;
	}

	public update(camera: PerspectiveCamera | OrthographicCamera) {
		// this is very close to the original LOD.update implementation, just tweaked slightly to add the blending: https://github.com/mrdoob/three.js/blob/master/src/objects/LOD.js
		const levels = this.levels;
		if (levels.length === 0) return;

		_v1.setFromMatrixPosition(camera.matrixWorld);
		_v2.setFromMatrixPosition(this.matrixWorld);

		let blendPercent = 1; // of upper level
		this._currentLevel = [this.levels.length - 1]; // fallback if we don't find any LOD within range
		const distance = _v1.distanceTo(_v2) / camera.zoom;
		// skipping lod0 since its distance is at 0
		for (let i = 1; i < this.levels.length; i++) {
			// originally, if the current level was already visible, we would use the hysteresis to reduce the distance required before swapping to the lower LOD, to avoid instantly switching at the boundary
			// I'm scrapping that and just using it as the initial point for the blending
			const blendEnd = levels[i].distance;
			const blendStart = blendEnd - blendEnd * levels[i].hysteresis;
			if (distance <= blendStart) {
				this._currentLevel = [i - 1];
				break;
			}
			if (distance > blendStart && distance <= blendEnd) {
				this._currentLevel = [i - 1, i];
				blendPercent = (distance - blendStart) / (blendEnd - blendStart);
				break;
			} else {
			}
		}

		for (let i = 0; i < this.levels.length; i++) {
			const levelVisible = this._currentLevel.includes(i);
			levels[i].object.visible = levelVisible;
			if (!levelVisible) this.resetMaterialState(i);
		}
		this.applyBlend(this._currentLevel, blendPercent); // blend just the remaining levels
	}

	private applyBlend(levelIDs: number[], blendPercent: number) {
		if (levelIDs.length === 1) {
			this.resetMaterialState(levelIDs[0]);
			return;
		}
		// TODO: this is very naive and gives odd results for  the dithering in opaque objects. I should use an easing function instead of what I'm currently doing
		this.setMaterialsBlend(levelIDs[0], 1 - blendPercent, true);
		this.setMaterialsBlend(levelIDs[1], blendPercent, true);
	}

	private setMaterialsBlend(lodID: number, opacity: number, transparent: boolean) {
		// TODO: allow selecting the blending mode: 1) blend transparent only | 2) blend transparent with opacity + opaque dithering | 3) blend transparent and opaque with dithering
		this.setMaterialsState(lodID, (state: LODMaterialState) => ({
			transparent: state.originalTransparent ? transparent : false,
			opacity,
			alphaHash: state.originalTransparent ? false : true,
		}));
	}

	private resetMaterialState(lodID: number) {
		this.setMaterialsState(lodID, (state: LODMaterialState) => ({
			transparent: state.originalTransparent,
			opacity: state.originalOpacity,
			alphaHash: state.originalAlphaHash,
		}));
	}

	private setMaterialsState(
		lodID: number,
		stateFetcher: (state: LODMaterialState) => {
			transparent: boolean;
			opacity: number;
			alphaHash: boolean;
		},
	) {
		const matStates: LODMaterialState[] | undefined = this._levelMats.get(lodID);
		if (matStates === undefined) {
			console.error(
				`[BlendedLOD] Attempted to set the material state for LOD ${lodID}, but no material states were found for this level.`,
			);
			return;
		}
		matStates.forEach((matState: LODMaterialState) => {
			const { transparent, opacity, alphaHash } = stateFetcher(matState);
			matState.mat.transparent = transparent;
			matState.mat.opacity = opacity;
			matState.mat.alphaHash = alphaHash;
			matState.mat.needsUpdate = true; // TODO: this is only really required for materials whose original transparent value was false, as these sometimes fail to blend with the alphahash. Marking every single material for update might get costly, especially after every re-render while blending. I could probably get away with setting this on the first modification of transparent and alphaHash, but then I'd have to figure out a way to run that on the first time that state changes......
		});
	}
}
