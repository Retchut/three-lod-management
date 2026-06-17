import {
	LOD,
	Material,
	Mesh,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	Vector3,
} from "three/webgpu";
import { LODBlendMode } from "../assetManagement/LODManager";

// garbage collection optimization shenanigans that LOD.js was already doing. Might as well keep it
const _v1 = /*@__PURE__*/ new Vector3();
const _v2 = /*@__PURE__*/ new Vector3();

type BlendState = {
	opacity: number;
	transparent: boolean;
	alphaHash: boolean;
};

type LODMaterialState = {
	mat: Material;
	original: BlendState;
	current: BlendState;
};

export class BlendedLOD extends LOD {
	// already private in LOD.js, but it is only used for the update logic
	//		no plural because I'd rather overwrite the original variable than keep it around :p
	private _levelMats: Map<Object3D, LODMaterialState[]> = new Map();
	private _currentLevel: Object3D[] = [];
	private _blendMode: LODBlendMode = LODBlendMode.OpaqueAlphaHashTransparentBlend;

	constructor() {
		super();
	}

	public getBlendMode() {
		return this._blendMode;
	}

	public setBlendMode(newMode: LODBlendMode): void {
		if (this._blendMode === newMode) return;

		this._blendMode = newMode;
		// TODO: reload materials, I'll implement it later, but it's not a priority since everything will be effectively reset in the next frame
	}

	public addLevel(object: Object3D, distance: number = 0, hysteresis: number = 0): this {
		super.addLevel(object, distance, hysteresis);
		const levelMats: LODMaterialState[] = [];
		// TODO: eerily similar to what we're doing inside BaseScene.dispose. I'm sure I can extract this somehow
		object.traverse((obj: Object3D) => {
			if (!(obj instanceof Mesh)) return;
			const mesh = obj as Mesh;
			const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			mats.forEach((mat: Material) => {
				levelMats.push({
					mat: mat,
					original: {
						opacity: mat.opacity,
						transparent: mat.transparent,
						alphaHash: mat.alphaHash,
					},
					current: {
						opacity: mat.opacity,
						transparent: mat.transparent,
						alphaHash: mat.alphaHash,
					},
				});
			});
		});
		this._levelMats.set(object, levelMats);
		return this;
	}

	public update(camera: PerspectiveCamera | OrthographicCamera) {
		// this is very close to the original LOD.update implementation, just tweaked slightly to add the blending: https://github.com/mrdoob/three.js/blob/master/src/objects/LOD.js
		const levels = this.levels;
		if (levels.length === 0) return;

		_v1.setFromMatrixPosition(camera.matrixWorld);
		_v2.setFromMatrixPosition(this.matrixWorld);

		let blendPercent = 1; // of upper level
		this._currentLevel = [levels[levels.length - 1].object]; // fallback if we don't find any LOD within range
		const distance = _v1.distanceTo(_v2) / camera.zoom;
		// skipping lod0 since its distance is at 0
		for (let i = 1; i < this.levels.length; i++) {
			// originally, if the current level was already visible, we would use the hysteresis to reduce the distance required before swapping to the lower LOD, to avoid instantly switching at the boundary
			// I'm scrapping that and just using it as the initial point for the blending
			const blendEnd = levels[i].distance;
			const blendStart = blendEnd - blendEnd * levels[i].hysteresis;
			if (distance <= blendStart) {
				this._currentLevel = [levels[i - 1].object];
				break;
			}
			if (distance > blendStart && distance <= blendEnd) {
				this._currentLevel = [levels[i - 1].object, levels[i].object];
				blendPercent = (distance - blendStart) / (blendEnd - blendStart);
				break;
			} else {
			}
		}

		for (let i = 0; i < this.levels.length; i++) {
			const level = levels[i].object;
			const levelVisible = this._currentLevel.includes(level);
			level.visible = levelVisible;
			if (!levelVisible) this.resetMaterialState(level);
		}
		this.applyBlend(this._currentLevel, blendPercent); // blend just the remaining levels
	}

	private applyBlend(levels: Object3D[], blendPercent: number) {
		if (levels.length === 1) {
			this.resetMaterialState(levels[0]);
			return;
		}
		// TODO: this is very naive and gives odd results for  the dithering in opaque objects. I should use an easing function instead of what I'm currently doing
		this.setMaterialsBlend(levels[0], 1 - blendPercent);
		this.setMaterialsBlend(levels[1], blendPercent);
	}

	private setMaterialsBlend(level: Object3D, opacity: number) {
		let stateBuilder: ((state: LODMaterialState) => BlendState) | null;
		switch (this._blendMode) {
			case LODBlendMode.BlendTransparentOnly:
				stateBuilder = (state: LODMaterialState) => ({
					transparent: state.original.transparent ? true : false,
					opacity,
					alphaHash: false,
				});
				break;
			case LODBlendMode.AlphaHashAll:
				stateBuilder = (_state: LODMaterialState) => ({
					transparent: false,
					opacity,
					alphaHash: true,
				});
				break;
			case LODBlendMode.OpaqueAlphaHashTransparentBlend:
				stateBuilder = (state: LODMaterialState) => ({
					transparent: state.original.transparent ? true : false,
					opacity,
					alphaHash: state.original.transparent ? false : true,
				});
				break;
		}

		if (stateBuilder === null) {
			console.error(
				`[BlendedLOD] Invalid blend mode selected. Unable to calculate the stateBuilder method.`,
			);
			return;
		}
		this.setMaterialsState(level, stateBuilder);
	}

	private resetMaterialState(level: Object3D) {
		this.setMaterialsState(level, (state: LODMaterialState) => ({
			transparent: state.original.transparent,
			opacity: state.original.opacity,
			alphaHash: state.original.alphaHash,
		}));
	}

	private setMaterialsState(
		level: Object3D,
		stateBuilder: (state: LODMaterialState) => BlendState,
	) {
		const matStates: LODMaterialState[] | undefined = this._levelMats.get(level);
		if (matStates === undefined) {
			console.error(
				`[BlendedLOD] Attempted to set the material state for '${level.name}', but no material states were found for this level.`,
			);
			return;
		}
		matStates.forEach((matState: LODMaterialState) => {
			const nextState: BlendState = stateBuilder(matState);
			this.modifyMaterial(matState, nextState);
		});
	}

	private modifyMaterial(matState: LODMaterialState, nextState: BlendState) {
		const transparentChanged: boolean = matState.current.transparent !== nextState.transparent;
		const opacityChanged: boolean = matState.current.opacity !== nextState.opacity;
		const alphaHashChanged: boolean = matState.current.alphaHash !== nextState.alphaHash;

		if (!transparentChanged && !opacityChanged && !alphaHashChanged) return;

		matState.mat.transparent = nextState.transparent;
		matState.mat.opacity = nextState.opacity;
		matState.mat.alphaHash = nextState.alphaHash;
		matState.current.transparent = nextState.transparent;
		matState.current.opacity = nextState.opacity;
		matState.current.alphaHash = nextState.alphaHash;

		if (transparentChanged || alphaHashChanged) matState.mat.needsUpdate = true; // changing opacity is just updating the uniform, shouldn't need to call this in those instances
	}
}
