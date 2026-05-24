import { AmbientLight, Color, DirectionalLight, Object3D, Vector3 } from "three/webgpu";
import { BaseScene, type AppContext } from "./BaseScene";

export class RandomizedScene extends BaseScene {
	constructor() {
		super("randomizedscene", new Vector3(4, 3, 4), true);
	}

	protected setupLighting(): void {
		this.scene.background = new Color(0xc6cfce);
		const ambient = new AmbientLight(0xffffff, 1);
		const dirLight = new DirectionalLight(0xffffff, 2);
		dirLight.position.set(5, 10, 5);
		this.scene.add(ambient);
		this.scene.add(dirLight);
	}

	protected async setupGeometry(context: AppContext): Promise<void> {
		const trees: Object3D[] = context.assetSpawner.spawnRandom(this.root, "tree", 10, 50, -1);
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}

	public dispose(): void {
		super.dispose();
	}
}
