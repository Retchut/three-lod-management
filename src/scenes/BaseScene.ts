import {
	AxesHelper,
	Camera,
	GridHelper,
	Group,
	Light,
	Material,
	Mesh,
	Object3D,
	Scene,
	Texture,
	Vector3,
	WebGPURenderer,
} from "three/webgpu";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import type { AssetManager } from "../assetManagement/AssetManager";
import type { AssetSpawner } from "../assetManagement/AssetSpawner";

export type AppContext = {
	renderer: WebGPURenderer;
	camera: Camera;
	camControls: OrbitControls; // TODO: replace with basecontrols and check in scenes which ones are active
	assetManager: AssetManager;
	assetSpawner: AssetSpawner;
};

export abstract class BaseScene {
	protected readonly name: string;
	protected readonly scene: Scene;
	protected readonly root: Group;
	protected readonly debugRoot: Group;
	protected readonly _debug: boolean;
	private readonly _initCamPos: Vector3;
	private _loaded: boolean;

	constructor(sceneName: string, initCamPos: Vector3, debug: boolean = false) {
		this._loaded = false;
		this.name = sceneName;
		this._initCamPos = initCamPos.clone();
		this._debug = debug;
		this.scene = new Scene();
		this.scene.name = sceneName;
		this.root = new Group();
		this.root.name = `${this.name}:root`;
		this.debugRoot = new Group();
		this.debugRoot.name = `${this.name}:debugRoot`;
		this.scene.add(this.root);

		if (this._debug) this.scene.add(this.debugRoot);
	}

	// ----- getters -----
	public getScene(): Scene {
		return this.scene;
	}

	public getRoot(): Group {
		return this.root;
	}

	public isLoaded(): boolean {
		return this._loaded;
	}
	// --------------------

	// ----- initialization -----
	// - abstract methods -
	protected abstract setupLighting(): void;
	protected abstract setupGeometry(context: AppContext): Promise<void>;
	// --------------------

	private setupSceneHelpers(): void {
		const axes: AxesHelper = new AxesHelper(5);
		const grid = new GridHelper(100, 50);
		grid.position.set(0, 0.5, 0);
		this.debugRoot.add(axes);
		this.debugRoot.add(grid);
	}

	protected updateCamera(context: AppContext, camPos: Vector3): void {
		// TODO: it's probably best that receive more info about the camera, and definitely support different camera controls, later down the line.... or make this abstract as well and setup in the parent scene. only time will tell, and for now this will do
		context.camera.position.copy(camPos);
		context.camControls.target.set(0, 0, 0);
		context.camControls.update();
	}

	public async load(context: AppContext): Promise<void> {
		if (this._loaded) return;
		if (this._debug) this.setupSceneHelpers();

		this.updateCamera(context, this._initCamPos);
		this.setupLighting();
		await this.setupGeometry(context);

		this._loaded = true;
	}
	// --------------------------

	// ----- runtime -----
	public update(deltaTime: number, context: AppContext): void {}
	// -------------------

	// ----- cleanup -----
	// TODO: I'll have to review this, as I don't really want to dispose of geometry that is owned by the asset manager, since my
	//			original idea was to have those assets be usable in other scenes
	public dispose(): void {
		// TODO: this feels weird, as I'm pretty sure the debug helpers, at the very least, are not instances of the Mesh class,
		//			so I think I'm missing some cleanup there at least
		[this.root, this.debugRoot].forEach((rootObj: Object3D) => {
			rootObj.traverse((obj: Object3D) => {
				if (!(obj instanceof Mesh)) return;
				const mesh = obj as Mesh;
				mesh.geometry.dispose();
				const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
				mats.forEach((mat: Material) => {
					for (const value of Object.values(mat)) {
						if (value && typeof value === "object" && "isTexture" in value) {
							(value as Texture).dispose();
						}
					}
					mat.dispose();
				});
			});
			rootObj.clear();
		});

		// I should only have lights left
		this.scene.traverse((obj: Object3D) => {
			if (!(obj instanceof Light)) return;
			(obj as Light).dispose();
		});
		this.scene.background = null;
		this.scene.environment = null;
		this.scene.clear();
		// this._loaded = false; // I obviously cannot just turn this off or else the scene won't render. I'll have to rethink this
	}
	// -------------------
}
