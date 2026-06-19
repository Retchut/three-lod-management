import type { LODManager } from "../assetManagement/LODManager";

export class PerformanceManager {
	private _lodManager: LODManager;
	private _fpsTarget: number = 60;
	private _fpsAvg: number = 0;
	private _timeSinceRefreshMS: number = 0;
	private _autoQualityEnabled: boolean = false;
	private _BASE_REFRESH_TIME_MS = 1000; // TODO: change (and use) refresh time based on average
	private _QUALITY_DECREMENT = 0.9;
	private _QUALITY_INCREMENT = 1.1;

	constructor(lodManager: LODManager, targetFPS: number) {
		this._lodManager = lodManager;
		this._fpsTarget = targetFPS;
	}

	public setAutoQualityEnabled(newVal: boolean): void {
		this._autoQualityEnabled = newVal;
	}

	public getAutoQualityEnabled(): boolean {
		return this._autoQualityEnabled;
	}

	public getFPSTarget(): number {
		return this._fpsTarget;
	}

	public getFPSAvg(): number {
		return this._fpsAvg;
	}

	update(deltaTime: number | null) {
		if (deltaTime === null || deltaTime === 0) return;
		const fps = 1 / deltaTime;
		const deltaTimeMS = deltaTime * 1000;

		// fps tracking
		if (this._fpsAvg == 0) this._fpsAvg = fps;
		else {
			this._fpsAvg = this._fpsAvg * 0.95 + fps * 0.05;
		}

		// quality updating
		if (!this._autoQualityEnabled) return;
		this._timeSinceRefreshMS += deltaTimeMS;
		if (this._timeSinceRefreshMS < this._BASE_REFRESH_TIME_MS) {
			return;
		}
		this._timeSinceRefreshMS = 0;

		let tweakedQuality: number = this._lodManager.getQuality();
		if (this._fpsAvg < this._fpsTarget) tweakedQuality *= this._QUALITY_DECREMENT;
		else tweakedQuality *= this._QUALITY_INCREMENT;

		this._lodManager.setQuality(tweakedQuality);
	}
}
