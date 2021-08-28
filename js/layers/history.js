import * as THREE from "/third_party/three.module.js";

function randomChoice(l) {
  return l[Math.floor(Math.random() * l.length)];
}

const vertexShader = `
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  vUv = uv;
}
`;

const copyFragmentShader = `
precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec4 pixel = texture2D(uTexture, uv);
  gl_FragColor = pixel;
}
`;

export default class HistoryLayer {
  async setup(width, height) {
    // Setup the material
    this.copyMaterial = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader: copyFragmentShader,
      uniforms: { uTexture: { value: null } },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.historyTargets = [];
    for (let i = 0; i < 300; i++) {
      const target = new THREE.WebGLRenderTarget(width, height, {
        depthBuffer: false,
      });
      this.historyTargets.push(target);
    }
    this.headIndex = 0;
    this.tailIndex = 150;

    this.outputTarget = new THREE.WebGLRenderTarget(width, height, {
      depthBuffer: false,
    });
  }

  draw(renderer, camera, elapsedTime, prevLayer) {
    // Copy the output of the input layer to the most recent history texture
    this.mesh.material = this.copyMaterial;
    this.copyMaterial.uniforms.uTexture.value = prevLayer.target.texture;
    renderer.setRenderTarget(this.historyTargets[this.headIndex]);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);

    this.mesh.material = this.copyMaterial;
    this.copyMaterial.uniforms.uTexture.value = randomChoice(
      this.historyTargets
    ).texture;
    // this.copyMaterial.uniforms.uTexture.value = this.historyTargets[this.tailIndex].texture;
    renderer.setRenderTarget(this.outputTarget);
    renderer.render(this.mesh, camera);

    this.target = this.outputTarget;

    this.headIndex++;
    if (this.headIndex >= this.historyTargets.length) {
      this.headIndex = 0;
    }

    const diceRoll = Math.random();
    if (diceRoll > 0.8) {
      this.tailIndex++;
    } else if (diceRoll < 0.7) {
      this.tailIndex--;
    }
    if (this.tailIndex >= this.historyTargets.length) {
      this.tailIndex = 0;
    } else if (this.tailIndex < 0) {
      this.tailIndex = this.historyTargets.length - 1;
    }
  }
}
