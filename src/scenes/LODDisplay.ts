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

export class LODDisplayScene extends BaseScene {
	constructor() {
		super("LODDisplay", new Vector3(4, 3, 4), true);
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

		for (let varIdx = 0; varIdx < 2; varIdx++) {
			for (let lod = 0; lod < 4; lod++) {
				context.assetSpawner.spawnSingleLOD(
					this.root,
					"tree",
					new Vector3(-1 + 2 * varIdx, 0, -6 + 4 * lod),
					lod,
					varIdx,
				);
			}
		}
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}

	public dispose(): void {
		super.dispose();
	}
}
