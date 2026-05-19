import "./style.css";
import * as T from "three";
import { WebGPURenderer } from "three/webgpu";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";

function renderloop(time: number) {
	renderer.render(scene, camera);
	console.log(camera.position);
}

const scene: T.Scene = new T.Scene();
const renderer: WebGPURenderer = new WebGPURenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(renderloop);
document.body.appendChild(renderer.domElement);

const camera: T.PerspectiveCamera = new T.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000,
);
camera.position.set(4, 3, 4);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const axes: T.AxesHelper = new T.AxesHelper(5);
scene.add(axes);

const loader: GLTFLoader = new GLTFLoader();

// quick setup test
const geometry = new T.BoxGeometry(1, 1, 1);
const material = new T.MeshBasicMaterial({ color: 0xff6b9a });
const cube = new T.Mesh(geometry, material);
scene.add(cube);
