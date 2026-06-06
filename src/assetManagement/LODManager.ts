import type { LOD, PerspectiveCamera } from "three/webgpu";

type TrackedLOD = {
	lod: LOD;
	baseDistances: number[];
	qualityScale: number; // object specific
};

export class LODManager {
	private _trackedLODs: Set<TrackedLOD> = new Set();
	private _globalQuality: number = 1.0;
	private _camera: PerspectiveCamera;

	constructor(camera: PerspectiveCamera) {
		this._camera = camera;
	}

	public getQuality() {
		return this._globalQuality;
	}

	public setQuality(new_globalQuality: number) {
		this._globalQuality = new_globalQuality;
		this.updateAll();
	}

	private updateAll() {
		this._trackedLODs.forEach((tracked: TrackedLOD) => this.updateSingle(tracked));
	}

	private updateSingle(tracked: TrackedLOD) {
		const newDistances: number[] = tracked.baseDistances.map(
			(d) => d * tracked.qualityScale * this._globalQuality,
		);
		this.updateLOD(tracked.lod, newDistances);
	}

	private updateLOD(target: LOD, newDistances: number[]) {
		console.log(newDistances);
		target.levels.forEach((l, i) => (l.distance = newDistances[i]));
		target.update(this._camera);
	}

	public register(lod: LOD, lodQualityScale: number) {
		const newTracked = {
			lod: lod,
			baseDistances: lod.levels.map((l) => l.distance),
			qualityScale: lodQualityScale,
		};
		this._trackedLODs.add(newTracked);
		this.updateSingle(newTracked);
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
