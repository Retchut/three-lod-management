import {
	AmbientLight,
	BoxGeometry,
	Color,
	DirectionalLight,
	Mesh,
	MeshBasicMaterial,
	Vector3,
} from "three/webgpu";
import { BaseScene, type AppContext } from "./BaseScene";

export class SimpleScene extends BaseScene {
	constructor() {
		super("simplescene", new Vector3(0, 3, 4), true);
	}

	protected setupLighting(): void {
		this.scene.background = new Color(0xc6cfce);
		const ambient = new AmbientLight(0xffffff, 1);
		ambient.name = "light:ambient0";
		const dirLight = new DirectionalLight(0xffffff, 2);
		dirLight.name = "light:directional0";
		dirLight.position.set(5, 10, 5);
		this.scene.add(ambient);
		this.scene.add(dirLight);
	}

	protected async setupGeometry(context: AppContext): Promise<void> {
		context.assetSpawner.spawnLODsAt(this.root, "tree", new Vector3(-5, 0, -25), 0);
		context.assetSpawner.spawnLODsAt(this.root, "tree", new Vector3(-10, 0, -10), 0);

		const b1 = context.assetSpawner.spawnLODsAt(
			this.root,
			"building-graffiti",
			new Vector3(17, 0, -10),
			0,
		);
		const b2 = context.assetSpawner.spawnLODsAt(
			this.root,
			"building-realistic-1",
			new Vector3(4, 0, -20),
			0,
		);
		const b3 = context.assetSpawner.spawnLODsAt(
			this.root,
			"building-realistic-2",
			new Vector3(-15, 0, -20),
			0,
		);
		b1?.scale.set(1.5, 1.5, 1.5);
		b1?.rotateY(-150);
		b2?.scale.set(2, 2, 2);
		b3?.scale.set(2, 2, 2);
		context.assetSpawner.spawnLODsAt(this.root, "streetlamp", new Vector3(-10, 0, -10), 0);
		const path1 = context.assetSpawner.spawnLODsAt(
			this.root,
			"stone-path",
			new Vector3(0, 0, 0),
			0,
		);
		path1?.position.add(new Vector3(-5, 0, -5)); // TODO: recenter path model
		path1?.scale.set(2, 1, 2);

		context.assetSpawner.spawnLODsAt(this.root, "grass", new Vector3(0, 0, 0), 0);
		context.assetSpawner.spawnLODsAt(this.root, "rocks", new Vector3(-4, 0, -2), 0);
		context.assetSpawner.spawnLODsAt(this.root, "rocks", new Vector3(0, 0, -2), 1);
		context.assetSpawner.spawnLODsAt(this.root, "rocks", new Vector3(4, 0, -2), 2);
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}
}
