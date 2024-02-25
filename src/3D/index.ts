import * as THREE from "three";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Sky } from "three/addons/objects/Sky.js";

//https://www.unrealengine.com/marketplace/en-US/product/56-height-map-vol-3#

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let sky: Sky;
let sun: THREE.Vector3;
const textueLoader = new THREE.TextureLoader();
interface EffectController {
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  elevation: number;
  azimuth: number;
  exposure: number;
}

function init() {
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    100,
    2000000
  );
  camera.position.set(0, 100, 2000);

  scene = new THREE.Scene();

  const helper = new THREE.GridHelper(10000, 2, 0xffffff, 0xffffff);
  scene.add(helper);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);
  controls.enableZoom = true;
  controls.enablePan = false;

  initSky();
  initLandscape();
  window.addEventListener("resize", onWindowResize);
}
const initLandscape = async () => {
  const noramal = await textueLoader.loadAsync("iland-hight-map_(N).png");
  textueLoader.load("iland-hight-map_(H).png", (displacement) => {
    const geometry = new THREE.PlaneGeometry(418 * 4, 539 * 4, 550, 550); // Make sure segments match image resolution
    const material = new THREE.MeshPhysicalMaterial({
      //   color: 0xffffff, //Red
      normalMap: noramal,
      displacementMap: displacement,
      displacementScale: 100,
      side: THREE.FrontSide,
    });
    geometry.computeVertexNormals();
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotateX((Math.PI / 2) * 2.99);
    terrain.scale.set(10, 10, 10);
    scene.add(terrain);
  });
};
function initSky() {
  sky = new Sky();
  sky.scale.setScalar(450000);
  scene.add(sky);

  sun = new THREE.Vector3();
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);

  const effectController: EffectController = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 180,
    exposure: renderer.toneMappingExposure,
  };

  function guiChanged() {
    const uniforms = sky.material.uniforms as unknown as {
      turbidity: 10;
      rayleigh: 3;
      mieCoefficient: 0.005;
      mieDirectionalG: 0.7;
      elevation: 2;
      azimuth: 180;
    };
    uniforms["turbidity"].value = effectController.turbidity;
    uniforms["rayleigh"].value = effectController.rayleigh;
    uniforms["mieCoefficient"].value = effectController.mieCoefficient;
    uniforms["mieDirectionalG"].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    uniforms["sunPosition"].value.copy(sun);
    sunLight.position.copy(sun);
    scene.add(sunLight);

    renderer.toneMappingExposure = effectController.exposure;
    renderer.render(scene, camera);
  }

  const gui = new GUI();

  gui.add(effectController, "turbidity", 0.0, 20.0, 0.1).onChange(guiChanged);
  gui.add(effectController, "rayleigh", 0.0, 4, 0.001).onChange(guiChanged);
  gui
    .add(effectController, "mieCoefficient", 0.0, 0.1, 0.001)
    .onChange(guiChanged);
  gui
    .add(effectController, "mieDirectionalG", 0.0, 1, 0.001)
    .onChange(guiChanged);
  gui.add(effectController, "elevation", 0, 90, 0.1).onChange(guiChanged);
  gui.add(effectController, "azimuth", -180, 180, 0.1).onChange(guiChanged);
  gui.add(effectController, "exposure", 0, 1, 0.0001).onChange(guiChanged);

  guiChanged();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  renderer.render(scene, camera);
}

init();
