import type { AppContext, BaseScene } from "./BaseScene";

export class SceneManager {
	private _currentScene: BaseScene | null;

	constructor() {
		this._currentScene = null;
	}

	// ----- getters -----
	public getCurrentScene(): BaseScene | null {
		return this._currentScene;
	}
	// --------------------

	public async loadScene(scene: BaseScene, context: AppContext): Promise<void> {
		if (this._currentScene != null) this._currentScene.dispose(context);

		this._currentScene = scene;
		await scene.load(context);
	}

	public update(deltaTime: number, context: AppContext): void {
		if (this._currentScene != null && this._currentScene.isLoaded()) {
			this._currentScene.update(deltaTime, context);
			context.renderer.render(this._currentScene.getScene(), context.camera);
		}
	}
}
