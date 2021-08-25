import * as THREE from "/third_party/three.module.js";

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

const fragmentShader = `
precision mediump float;

uniform sampler2D uInputTexture;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  uv.x = 1.0-uv.x;
  vec4 originalColor = texture2D(uInputTexture, uv);
  gl_FragColor = originalColor;
}
`;

export default class MirrorLayer {
  async setup(width, height) {
    // Setup the material
    this.material = new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uInputTexture: { value: null },
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);

    this.target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false });
  }

  draw(renderer, camera, elapsedTime, prevLayer) {
    // Render the difference operation
    this.material.uniforms.uInputTexture.value = prevLayer.target.texture;
    this.mesh.material = this.material;
    renderer.setRenderTarget(this.target);
    renderer.render(this.mesh, camera);
    renderer.setRenderTarget(null);
  }
}
