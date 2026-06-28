import {
	Group,
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

// maps each LOD Object3D key to a "visibility ratio", from which we derive the BlendProps
type BlendWeights = Map<Object3D, number>;

type BlendProps = {
	opacity: number;
	transparent: boolean;
	alphaHash: boolean;
};

type LODTransition = {
	startWeights: BlendWeights;
	endWeights: BlendWeights;
	timer: number;
};

type LODMaterialState = {
	mat: Material;
	original: BlendProps;
	current: BlendProps;
};

type LODLevel = {
	object: Object3D;
	distance: number;
	hysteresis: number;
};

export class BlendedLOD extends LOD {
	private _TRANSITION_DURATION_SECS: number = 0.5;
	private _TRANSITION_DISTANCE_THRESHOLD: number = 0.1;
	// already private in LOD.js, but it is only used for the update logic
	//		no plural because I'd rather overwrite the original variable than keep it around :p
	private _levelMats: Map<Object3D, LODMaterialState[]> = new Map();
	private _loadedLevels: Set<Object3D> = new Set();
	private _loadedLevelsChanged: boolean = false;
	private _blendMode: LODBlendMode = LODBlendMode.OpaqueAlphaHashTransparentBlend;
	private _currentTransition: LODTransition | null = null;
	private _previousWeights: BlendWeights = new Map();
	private _previousDistance: number = 0;

	constructor() {
		super();
		this.autoUpdate = false;
	}

	public getBlendMode() {
		return this._blendMode;
	}

	public setBlendMode(newMode: LODBlendMode): void {
		if (this._blendMode === newMode) return;

		this._blendMode = newMode;
		// TODO: reload materials, I'll implement it later, but it's not a priority since everything will be effectively reset in the next frame
	}

	public initLevel(distance: number = 0, hysteresis: number = 0): this {
		// these still get added in order, starting with lod0 and working up to less complex LODs
		// 		accessing this.levels has to be done with the correct keys
		const levelWrapper = new Group();
		levelWrapper.visible = false;
		super.addLevel(levelWrapper, distance, hysteresis);
		this._levelMats.set(levelWrapper, []);
		return this;
	}

	public fillLevel(lodID: number, object: Object3D): this {
		const level: LODLevel | undefined = this.levels[lodID];
		if (level === undefined) {
			console.warn(`[BlendedLOD] Attempted to fill undefined LOD with level ${lodID}.`);
			return this;
		}

		const levelWrapper = level.object;
		levelWrapper.clear();
		levelWrapper.add(object);
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
		this._levelMats.set(levelWrapper, levelMats);
		this._loadedLevels.add(levelWrapper);
		this._loadedLevelsChanged = true;
		return this;
	}

	private getLevelIndex(level: Object3D): number {
		return this.levels.findIndex((entry: LODLevel) => entry.object === level);
	}

	private getLoadedWeights(desiredWeights: BlendWeights): BlendWeights {
		if (this._loadedLevels.size === 0) return new Map();

		// base scenario: at least one desiredLevel is visible, maybe both, we just return these
		const loadedWeights: BlendWeights = new Map();
		let highestDesiredID = -1; // used later to compare against upper/lower levels if we don't find any loaded right now
		desiredWeights.forEach((blendVal: number, objKey: Object3D) => {
			if (this._loadedLevels.has(objKey)) loadedWeights.set(objKey, blendVal);

			const requestedID = this.getLevelIndex(objKey);
			if (requestedID > highestDesiredID) highestDesiredID = requestedID;
		});
		// Note: loadedWeights should only have 0, 1 or 2 elements at this point
		if (loadedWeights.size === 1) {
			const onlyKey: Object3D = loadedWeights.keys().next().value!; // this is always guaranteed to exist, as the size is 1, hence the non-null assertion
			loadedWeights.set(onlyKey, 1);
		}
		if (loadedWeights.size > 0) return loadedWeights;
		if (highestDesiredID === -1) return new Map();

		// no desired level was loaded. We opt for:
		//		1) the closest level above
		//		2) the closest level below, if none was found for 1)
		let closestLowerID = -1;
		let closestHigherID = this.levels.length; // this.levels might be filled with mesh-less levels, but that's fine because this is always higher than the highest level id
		let closestLower: Object3D | null = null;
		let closestHigher: Object3D | null = null;

		this.levels.forEach((levelEntry: LODLevel, levelID: number) => {
			const levelObj: Object3D = levelEntry.object;
			if (!this._loadedLevels.has(levelObj)) return;

			if (levelID >= highestDesiredID) {
				if (levelID < closestHigherID) {
					closestHigher = levelObj;
					closestHigherID = levelID;
				}
			} else {
				if (levelID > closestLowerID) {
					closestLower = levelObj;
					closestLowerID = levelID;
				}
			}
		});

		// loadedWeights is empty at this point
		if (closestHigher !== null) {
			loadedWeights.set(closestHigher, 1);
			return loadedWeights;
		}
		if (closestLower !== null) loadedWeights.set(closestLower, 1);
		return loadedWeights;
	}

	// this only exists to allow me to derive from LOD.js now.....
	public update(_camera: PerspectiveCamera | OrthographicCamera): void {}

	public updateBlended(camera: PerspectiveCamera | OrthographicCamera, deltatimeSec: number): void {
		// this is very close to the original LOD.update implementation, just tweaked slightly to add the blending: https://github.com/mrdoob/three.js/blob/master/src/objects/LOD.js
		// in this implementation, however we're using hysteresis as a way to indicate the window for blending between LODs

		// reset LODs
		if (this.levels.length === 0) return;
		if (this._loadedLevels.size === 0) {
			this.levels.forEach((level: LODLevel) => (level.object.visible = false));
			return;
		}

		// build blend weights using the distance to the object
		_v1.setFromMatrixPosition(camera.matrixWorld);
		_v2.setFromMatrixPosition(this.matrixWorld);
		const distance: number = _v1.distanceTo(_v2) / camera.zoom;
		const distanceWeights: BlendWeights = this.computeDistanceWeights(distance);
		const loadedWeights: BlendWeights = this.getLoadedWeights(distanceWeights);

		let frameWeights: BlendWeights = new Map();
		if (this._currentTransition === null) {
			if (this.shouldStartTransition(distance, loadedWeights)) {
				// this new transition's interpolated weights will effectively lag behind the current loadedWeights
				this._currentTransition = {
					startWeights: this._previousWeights,
					endWeights: loadedWeights,
					timer: 0,
				};
				frameWeights = this.getInterpolatedWeights(this._currentTransition);
			} else {
				frameWeights = loadedWeights;
			}
		} else {
			// during transition we need to update the end weights if they changed because of movement
			// TODO: what if we are transitioning and then the "correct" LOD for the distance finishes loading?
			// 		Might get popping here if it happens near the end of the transition. The cornerest of corner cases but yeah
			//		The solution might be to also check for shouldStartTransition here, and if a transition occured because
			// 		a new LOD loaded, we'll re-start the transition to that LOD
			if (!this.sameWeights(loadedWeights, this._currentTransition.endWeights)) {
				this._currentTransition.endWeights = loadedWeights;
			}

			// update transition timer
			const newTimer = Math.min(
				this._TRANSITION_DURATION_SECS,
				this._currentTransition.timer + deltatimeSec,
			);
			this._currentTransition.timer = newTimer;

			frameWeights = this.getInterpolatedWeights(this._currentTransition);
			if (this.shouldEndTransition(this._currentTransition)) this._currentTransition = null;
		}

		// filter lods to whichever are currently loaded
		this.updateLODs(frameWeights);
		this._previousWeights = frameWeights;
		this._previousDistance = distance;
	}

	private sameWeightKeys(w1: BlendWeights, w2: BlendWeights) {
		if (w1.size !== w2.size) return false;
		for (const key of w1.keys()) {
			if (!w2.has(key)) return false;
		}
		return true;
	}

	private sameWeights(w1: BlendWeights, w2: BlendWeights) {
		if (w1.size !== w2.size) return false;
		for (const key of w1.keys()) {
			if (w1.get(key) !== w2.get(key)) return false;
		}
		return true;
	}

	private shouldStartTransition(currentDistance: number, loadedWeights: BlendWeights): boolean {
		const suddenDistanceChange =
			Math.abs(currentDistance - this._previousDistance) > this._TRANSITION_DISTANCE_THRESHOLD;
		const loadedLODsTriggerTransition =
			this._loadedLevelsChanged && !this.sameWeightKeys(loadedWeights, this._previousWeights);
		this._loadedLevelsChanged = false;
		return suddenDistanceChange || loadedLODsTriggerTransition;
	}

	private shouldEndTransition(transition: LODTransition): boolean {
		return transition.timer >= this._TRANSITION_DURATION_SECS;
	}

	private getInterpolatedWeights(transition: LODTransition): BlendWeights {
		// TODO: this currently perserves weights that have an interpolated "opacity" value of 0. These will be rendered despite being fully transparent,
		// 		for at least one frame, but it is corrected on the next frame. It's probably best to just remove those keys from the weights map
		const interpolatedWeights: BlendWeights = new Map();
		const referencedLODs = [...transition.startWeights.keys(), ...transition.endWeights.keys()];
		const normalizedTimer = transition.timer / this._TRANSITION_DURATION_SECS;
		referencedLODs.forEach((lodKey: Object3D) => {
			const startVal = transition.startWeights.get(lodKey) ?? 0;
			const endVal = transition.endWeights.get(lodKey) ?? 0;
			interpolatedWeights.set(lodKey, startVal + (endVal - startVal) * normalizedTimer);
		});
		return interpolatedWeights;
	}

	private computeDistanceWeights(distance: number): BlendWeights {
		const levels: LODLevel[] = this.levels;
		if (levels.length === 0) return new Map(); // shouldn't happen, but still
		const distanceWeights: BlendWeights = new Map();
		distanceWeights.set(levels[levels.length - 1].object, 1); // fallback if we go past the transition between the penultimate and last LOD
		// skipping lod0 since its distance is at 0
		for (let i = 1; i < levels.length; i++) {
			const blendEnd = levels[i].distance;
			const blendStart = blendEnd - blendEnd * levels[i].hysteresis;
			if (distance <= blendStart) {
				distanceWeights.clear();
				distanceWeights.set(levels[i - 1].object, 1);
				break;
			}
			if (distance > blendStart && distance <= blendEnd) {
				const blendPercent = (distance - blendStart) / (blendEnd - blendStart);
				distanceWeights.clear();
				distanceWeights.set(levels[i - 1].object, 1 - blendPercent);
				distanceWeights.set(levels[i].object, blendPercent);
				break;
			}
		}
		return distanceWeights;
	}

	private updateLODs(frameWeights: BlendWeights): void {
		const levels: LODLevel[] = this.levels;
		for (let i = 0; i < levels.length; i++) {
			const level = levels[i].object;
			const levelVisible = frameWeights.has(level);
			level.visible = levelVisible;
			if (!levelVisible && this._loadedLevels.has(level)) this.resetMaterialState(level);
		}
		this.applyBlend(frameWeights); // blend just the remaining levels
	}

	private applyBlend(weights: BlendWeights) {
		if (weights.size === 0) return;
		if (weights.size === 1) {
			const onlyKey: Object3D = weights.keys().next().value!; // this is always guaranteed to exist, as the size is 1, hence the non-null assertion
			if (weights.get(onlyKey) === 1) {
				// in the case that we are blending from 0 loaded LODs to a single loaded LOD, we will interpolate from no weights to a fully opaque LOD
				//		in that situation we only want to reset after blending is finalized, i.e. when the blendWeight for that LOD is 1
				this.resetMaterialState(onlyKey);
				return;
			}
		}

		weights.forEach((blendVal: number, objKey: Object3D) =>
			this.setMaterialsBlend(objKey, blendVal),
		);
	}

	private setMaterialsBlend(level: Object3D, opacity: number) {
		let stateBuilder: ((state: LODMaterialState) => BlendProps) | null;
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
		stateBuilder: (state: LODMaterialState) => BlendProps,
	) {
		const matStates: LODMaterialState[] | undefined = this._levelMats.get(level);
		if (matStates === undefined) {
			console.error(
				`[BlendedLOD] Attempted to set the material state for '${level.name}', but no material states were found for this level.`,
			);
			return;
		}
		matStates.forEach((matState: LODMaterialState) => {
			const nextState: BlendProps = stateBuilder(matState);
			this.modifyMaterial(matState, nextState);
		});
	}

	private modifyMaterial(matState: LODMaterialState, nextState: BlendProps) {
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
