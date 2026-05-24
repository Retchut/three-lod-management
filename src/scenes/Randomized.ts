import { AmbientLight, Color, DirectionalLight, Group, Object3D, Vector3 } from "three/webgpu";
import { BaseScene, type AppContext } from "./BaseScene";
import { GLTFLoader, type GLTF } from "three/examples/jsm/Addons.js";

// ------------------------------------------------------------------
// TODO: extract into AssetManager module
async function loadModels() {
	const loader: GLTFLoader = new GLTFLoader();
	const gltf: GLTF = await loader.loadAsync("models/realistic_tree/scene.gltf");
	const treeVariants = [];
	const tree0 = gltf.scene.getObjectByName("Tree_0");
	const tree1 = gltf.scene.getObjectByName("Tree001_1");
	if (tree0) treeVariants.push(tree0);
	if (tree1) treeVariants.push(tree1);

	return treeVariants;
}

function placeRandom(parent: Group, count: number, variants: Object3D[]) {
	for (let i = 0; i < count; i++) {
		const randIdx: number = Math.floor(Math.random() * variants.length);
		const instance: Object3D = variants[randIdx].clone(true);
		instance.position.set((Math.random() - 0.5) * 50, 0, (Math.random() - 0.5) * 50);
		parent.add(instance);
	}
}
// ------------------------------------------------------------------

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

	protected async setupGeometry(): Promise<void> {
		const variants: Object3D[] = await loadModels();
		placeRandom(this.root, 10, variants);
	}

	public update(deltaTime: number, context: AppContext): void {
		super.update(deltaTime, context);
	}

	public dispose(): void {
		super.dispose();
	}
}
