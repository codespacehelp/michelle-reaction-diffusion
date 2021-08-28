import * as THREE from "/third_party/three.module.js";
import * as dat from "/third_party/dat.gui.module.js";

import ColorMapLayer from "./layers/color-map.js";
import DifferenceLayer from "./layers/difference.js";
import ImageLayer from "./layers/image.js";
import ReactionDiffusionLayer from "./layers/reaction-diffusion.js";
import WebcamLayer from "./layers/webcam.js";
import MirrorLayer from "./layers/mirror.js";
import HistoryLayer from "./layers/history.js";

let canvas, camera, renderer, mesh, material, scenes, activeSceneIndex;

async function createScene1(width, height) {
  const colorMapLayer = new ColorMapLayer("./img/Black-W.png");
  const historyLayer = new HistoryLayer();
  const webcamLayer = new WebcamLayer();
  const differenceLayer = new DifferenceLayer();
  const mirrorLayer = new MirrorLayer();

  const layers = [
    webcamLayer,
    mirrorLayer,
    historyLayer,
    differenceLayer,
    colorMapLayer,
  ];

  for (const layer of layers) {
    await layer.setup(width, height);
  }
  return {
    name: "scene1",
    layers,
  };
}

async function createScene2(width, height) {
  const colorMapLayer = new ColorMapLayer("./img/B.png");
  const historyLayer = new HistoryLayer();
  const webcamLayer = new WebcamLayer();
  const differenceLayer = new DifferenceLayer();
  const mirrorLayer = new MirrorLayer();

  const layers = [webcamLayer, colorMapLayer];

  for (const layer of layers) {
    await layer.setup(width, height);
  }
  return {
    name: "scene2",
    layers,
  };
}

async function main() {
  canvas = document.getElementById("c");
  let width = canvas.width;
  let height = canvas.height;

  const gui = new dat.GUI();
  window.gui = gui;

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer = new THREE.WebGLRenderer({
    canvas,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
    depth: false,
    stencil: false,
  });
  renderer.autoClear = false;
  renderer.setSize(width, height);

  const geometry = new THREE.PlaneGeometry(2, 2);
  material = new THREE.MeshBasicMaterial({ color: "white" });
  mesh = new THREE.Mesh(geometry, material);

  // Scenes
  scenes = [];
  scenes.push(await createScene1(width, height));
  scenes.push(await createScene2(width, height));

  activeSceneIndex = 0;

  requestAnimationFrame(animate);
}
function animate(elapsedTime) {
  const activeScene = scenes[activeSceneIndex];
  const layers = activeScene.layers;
  for (let i = 0; i < layers.length; i++) {
    layers[i].draw(renderer, camera, elapsedTime, layers[i - 1]);
  }

  let lastLayer = layers[layers.length - 1];
  material.map = lastLayer.target.texture;

  renderer.setRenderTarget(null);
  renderer.render(mesh, camera);

  requestAnimationFrame(animate);
}

function switchScene() {
  const oldScene = scenes[activeSceneIndex];
  const oldLayers = oldScene.layers;
  const oldColorMapLayer = oldLayers[oldLayers.length - 1];

  let newSceneIndex = activeSceneIndex + 1;
  if (newSceneIndex >= scenes.length) {
    newSceneIndex = 0;
  }

  const newScene = scenes[newSceneIndex];
  const newLayers = newScene.layers;
  const newColorMapLayer = newLayers[newLayers.length - 1];

  const timeline = gsap.timeline();
  timeline.to(oldColorMapLayer.material.uniforms.uOpacity, {
    value: 0,
    duration: 3,
  });
  timeline.add(() => {
    console.log("switch");
    activeSceneIndex = newSceneIndex;
  });
  timeline.set(newColorMapLayer.material.uniforms.uOpacity, { value: 0 });
  timeline.to(newColorMapLayer.material.uniforms.uOpacity, {
    value: 1,
    duration: 3,
  });
}

main();
window.addEventListener("dblclick", switchScene);
window.addEventListener("keydown", (e) => {
  if (e.key === "E") {
    switchScene();
  }
});
