import type { LOD, PerspectiveCamera } from "three/webgpu";
import { BlendedLOD } from "../components/BlendedLOD";

export const LODBlendMode = {
	OpaqueAlphaHashTransparentBlend: "Alpha Hash Opaque + Blend Transparent",
	AlphaHashAll: "Alpha Hash All",
	BlendTransparentOnly: "Blend Transparent Only",
} as const;
export type LODBlendMode = (typeof LODBlendMode)[keyof typeof LODBlendMode];
type TrackedLOD = {
	lod: LOD;
	baseDistances: number[];
	qualityScale: number; // object specific
};

export class LODManager {
	private _trackedLODs: Set<TrackedLOD> = new Set();
	private _globalQuality: number = 1.0;
	private _camera: PerspectiveCamera;
	private _LOD_QUALITY_MIN = 0.01;
	private _LOD_QUALITY_MAX = 5;
	private _blendMode: LODBlendMode = LODBlendMode.OpaqueAlphaHashTransparentBlend;

	constructor(camera: PerspectiveCamera) {
		this._camera = camera;
	}

	public getBlendMode() {
		return this._blendMode;
	}

	public setBlendMode(newMode: LODBlendMode): void {
		if (this._blendMode === newMode) return;

		this._blendMode = newMode;
		this._trackedLODs.forEach((tracked: TrackedLOD) => this.setLODBlendMode(tracked.lod));
	}

	public getQuality() {
		return this._globalQuality;
	}

	public setQuality(new_globalQuality: number) {
		this._globalQuality = Math.min(
			Math.max(new_globalQuality, this._LOD_QUALITY_MIN),
			this._LOD_QUALITY_MAX,
		);
		this._trackedLODs.forEach((trackedLOD: TrackedLOD) => this.setLODQuality(trackedLOD));
	}

	private setLODQuality(trackedLOD: TrackedLOD) {
		const newDistances: number[] = trackedLOD.baseDistances.map(
			(d) => d * trackedLOD.qualityScale * this._globalQuality,
		);
		this.setLODDistances(trackedLOD.lod, newDistances);
		this.setLODBlendMode(trackedLOD.lod);
	}

	private setLODBlendMode(lod: LOD) {
		if (lod instanceof BlendedLOD) lod.setBlendMode(this._blendMode);
	}

	private setLODDistances(lod: LOD, newDistances: number[]) {
		lod.levels.forEach((l, i) => (l.distance = newDistances[i]));
		lod.update(this._camera);
	}

	public register(lod: LOD, lodQualityScale: number) {
		const newTracked = {
			lod: lod,
			baseDistances: lod.levels.map((l) => l.distance),
			qualityScale: lodQualityScale,
		};
		this._trackedLODs.add(newTracked);
		this.setLODQuality(newTracked);
	}

	public unregister(lod: LOD) {
		for (const entry of this._trackedLODs) {
			if (entry.lod === lod) {
				this._trackedLODs.delete(entry);
				return;
			}
		}
	}
}
