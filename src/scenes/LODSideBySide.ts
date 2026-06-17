import {
	AmbientLight,
	BoxGeometry,
	Color,
	DirectionalLight,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Vector3,
} from "three/webgpu";
import { BaseScene, type AppContext } from "./BaseScene";

export class LODSideBySideScene extends BaseScene {
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
		const geometry = new BoxGeometry(1, 1, 1);
		const material = new MeshBasicMaterial({ color: 0xff6b9a });
		const cube = new Mesh(geometry, material);
		cube.position.set(5, 0, 5);
		this.root.add(cube);

		const trees: Object3D | null = context.assetSpawner.spawnAt(
			this.root,
			"tree",
			new Vector3(0, 0, 0),
			0,
		);
		trees?.children[0].position.set(trees?.children[0].position.x + 2, 0, 0);
		trees?.children[1].position.set(trees?.children[1].position.x - 2, 0, 0);
		trees?.children[2].position.set(trees?.children[2].position.x + 2, 0, 0);
		trees?.children[3].position.set(trees?.children[3].position.x - 2, 0, 0);
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}
}
