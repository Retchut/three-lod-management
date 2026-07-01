import { AmbientLight, Color, DirectionalLight, type Object3D, Vector3 } from "three/webgpu";
import { BaseScene, type AppContext } from "./BaseScene";

type BuildingPlacement = {
	assetID: string;
	x: number;
	z: number;
	rotation: number;
	scale: number;
};

export class DemoScene extends BaseScene {
	constructor() {
		super("demoscene", new Vector3(4, 4, 18), true);
	}

	protected setupLighting(): void {
		this.scene.background = new Color(0xb8c9d1);
		const ambient = new AmbientLight(0xffffff, 1.25);
		ambient.name = "light:ambient0";
		const dirLight = new DirectionalLight(0xfff1d0, 2.25);
		dirLight.name = "light:directional0";
		dirLight.position.set(-8, 16, 10);
		this.scene.add(ambient);
		this.scene.add(dirLight);
	}

	private seededRandom(seed: number): () => number {
		let value = seed;
		return () => {
			value = (value * 1664525 + 1013904223) % 4294967296;
			return value / 4294967296;
		};
	}

	private spawnAsset(
		context: AppContext,
		assetID: string,
		position: Vector3,
		variantID = 0,
		rotation = 0,
		scale = 1,
	): Object3D | null {
		const spawned = context.assetSpawner.spawnLODsAt(this.root, assetID, position, variantID);
		spawned?.rotateY(rotation);
		spawned?.scale.setScalar(scale);
		return spawned;
	}

	private spawnStreet(): void {
		this.spawnPlane(140, 140, 0x315229);
		this.spawnPlane(15, 130, 0x24282b, 0, 0, 0.01);
		this.spawnPlane(4, 130, 0xa2a29a, -10.5, 0, 0.02);
		this.spawnPlane(4, 130, 0xa2a29a, 10.5, 0, 0.02);

		// street-like plane composition
		for (let z = -56; z <= 56; z += 16) {
			this.spawnPlane(0.45, 7, 0xded9ba, 0, z, 0.03);
		}
		for (let z = -44; z <= 44; z += 22) {
			this.spawnPlane(12, 0.45, 0xd8d8cf, 0, z, 0.035);
		}
	}

	private spawnBuildings(context: AppContext): void {
		const buildings: BuildingPlacement[] = [
			{ assetID: "building-realistic-1", x: -26, z: -50, rotation: Math.PI / 2, scale: 1.15 },
			{ assetID: "building-realistic-2", x: -27, z: -30, rotation: Math.PI / 2, scale: 1.05 },
			{ assetID: "building-graffiti", x: -24, z: -9, rotation: Math.PI / 2, scale: 1.5 },
			{ assetID: "building-realistic-1", x: -28, z: 14, rotation: Math.PI / 2, scale: 1.25 },
			{ assetID: "building-realistic-2", x: -25, z: 38, rotation: Math.PI / 2, scale: 1.1 },
			{ assetID: "building-graffiti", x: -26, z: 58, rotation: Math.PI / 2, scale: 1.4 },
			{ assetID: "building-graffiti", x: 25, z: -54, rotation: -Math.PI / 2, scale: 1.35 },
			{ assetID: "building-realistic-2", x: 27, z: -34, rotation: -Math.PI / 2, scale: 1.15 },
			{ assetID: "building-realistic-1", x: 25, z: -12, rotation: -Math.PI / 2, scale: 1.2 },
			{ assetID: "building-graffiti", x: 28, z: 10, rotation: -Math.PI / 2, scale: 1.45 },
			{ assetID: "building-realistic-2", x: 26, z: 34, rotation: -Math.PI / 2, scale: 1.05 },
			{ assetID: "building-realistic-1", x: 28, z: 55, rotation: -Math.PI / 2, scale: 1.2 },
		];

		buildings.forEach((building) => {
			this.spawnAsset(
				context,
				building.assetID,
				new Vector3(building.x, 0, building.z),
				0,
				building.rotation,
				building.scale,
			);
		});
	}

	private setupStreetDetails(context: AppContext): void {
		for (let z = -54; z <= 54; z += 18) {
			this.spawnAsset(context, "streetlamp", new Vector3(-8.4, 0, z), 0, Math.PI / 2, 1.15);
			this.spawnAsset(context, "streetlamp", new Vector3(8.4, 0, z + 9), 0, -Math.PI / 2, 1.15);
		}

		for (let z = -52; z <= 52; z += 8) {
			const leftStone = this.spawnAsset(context, "stone-path", new Vector3(-10.4, 0.01, z), 0);
			leftStone?.scale.set(1.25, 1, 1.25);

			const rightStone = this.spawnAsset(context, "stone-path", new Vector3(10.4, 0.01, z + 4), 0);
			rightStone?.scale.set(1.25, 1, 1.25);
		}
	}

	private setupVegetationAndRocks(context: AppContext): void {
		const random = this.seededRandom(1337);

		for (let i = 0; i < 52; i++) {
			const side = random() > 0.5 ? 1 : -1;
			const x = side * (13 + random() * 13);
			const z = -62 + random() * 124;
			const variant = Math.floor(random() * 3);
			const rock = this.spawnAsset(
				context,
				"rocks",
				new Vector3(x, 0, z),
				variant,
				random() * Math.PI * 2,
				0.65 + random() * 0.9,
			);
			rock?.scale.multiplyScalar(side > 0 ? 1 : 0.85);
		}

		for (let i = 0; i < 36; i++) {
			const side = random() > 0.5 ? 1 : -1;
			const x = side * (12 + random() * 16);
			const z = -64 + random() * 128;
			this.spawnAsset(context, "grass", new Vector3(x, 0, z), 0, random() * Math.PI * 2, 0.75);
		}

		for (let z = -60; z <= 60; z += 20) {
			this.spawnAsset(context, "tree", new Vector3(-44, 0, z), z % 40 === 0 ? 0 : 1, 0, 0.85);
			this.spawnAsset(context, "tree", new Vector3(44, 0, z + 10), z % 40 === 0 ? 1 : 0, 0, 0.85);
		}
	}

	protected async setupGeometry(context: AppContext): Promise<void> {
		this.spawnStreet();
		this.spawnBuildings(context);
		this.setupStreetDetails(context);
		this.setupVegetationAndRocks(context);
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}
}
