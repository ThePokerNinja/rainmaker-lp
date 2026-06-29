/**
 * Hero singularity backdrop � adapted from CodePen VoXelo/VYKMNwE.
 * OrbitControls + GSAP state transitions; container-scoped renderer.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import gsap from "gsap";

const NOISE_CHUNK = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const STATES = [
  { morph: 0.1, compress: 1.0, intensity: 1.0, rotate: 0.4, camY: 25, camDist: 85, orbit: 1.0 },
  { morph: 4.5, compress: 1.15, intensity: 1.4, rotate: 1.5, camY: 45, camDist: 95, orbit: 1.8 },
  { morph: 0.8, compress: 0.38, intensity: 3.5, rotate: 5.0, camY: 12, camDist: 55, orbit: 4.5 },
];

export function initHeroSingularity(container, opts = {}) {
  if (!container) return { destroy() {} };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(60, 30, 60);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.85;
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.03;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.minDistance = 35;
  controls.maxDistance = 140;
  controls.enablePan = false;

  const coreGroup = new THREE.Group();
  scene.add(coreGroup);
  coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(4, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000 })));

  const auraMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1.0 } },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 4.0);
        gl_FragColor = vec4(vec3(1.0, 0.45, 0.1) * rim * uIntensity * 6.5, 1.0);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });
  coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(4.25, 64, 64), auraMat));

  const instanceCount = 5000;
  const streakGeo = new THREE.CylinderGeometry(0.01, 0.12, 2.2, 3);
  streakGeo.rotateX(Math.PI / 2);

  const diskMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0.1 },
      uCompression: { value: 1.0 },
      uIntensity: { value: 1.0 },
      uOrbitScale: { value: 1.0 },
    },
    vertexShader: `
      ${NOISE_CHUNK}
      uniform float uTime;
      uniform float uMorph;
      uniform float uCompression;
      uniform float uIntensity;
      uniform float uOrbitScale;
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float rOriginal = length(instPos.xz);
        float r = rOriginal * uCompression;
        float initialAngle = atan(instPos.z, instPos.x);
        float orbitalVelocity = (1.5 / sqrt(rOriginal)) * uOrbitScale;
        float currentAngle = initialAngle + (uTime * orbitalVelocity);
        vec3 morphedWorldPos = vec3(cos(currentAngle) * r, instPos.y, sin(currentAngle) * r);
        float noise = snoise(vec3(morphedWorldPos.x * 0.08, morphedWorldPos.z * 0.08, uTime * 0.3));
        morphedWorldPos.y += noise * uMorph * 4.0;
        vec3 viewDir = normalize(cameraPosition - morphedWorldPos);
        vec3 orbitDir = normalize(vec3(-sin(currentAngle), 0.0, cos(currentAngle)));
        float doppler = dot(orbitDir, viewDir);
        vec3 hot = vec3(1.0, 0.95, 0.9);
        vec3 warm = vec3(1.0, 0.45, 0.1);
        vec3 cool = vec3(0.1, 0.35, 1.0);
        vec3 color = mix(cool, warm, smoothstep(45.0, 12.0, r));
        color = mix(color, hot, smoothstep(10.0, 4.0, r));
        vColor = color * (1.45 + doppler * 0.85) * uIntensity;
        vOpacity = (smoothstep(3.8, 5.5, r) * (1.0 - smoothstep(38.0, 48.0, r))) * 0.95;
        float deltaAngle = currentAngle - initialAngle;
        float c = cos(deltaAngle);
        float s = sin(deltaAngle);
        mat3 rotY = mat3(c, 0, s, 0, 1, 0, -s, 0, c);
        vec3 localPos = (instanceMatrix * vec4(position, 0.0)).xyz;
        vec3 rotatedLocalPos = rotY * localPos;
        gl_Position = projectionMatrix * viewMatrix * vec4(morphedWorldPos + rotatedLocalPos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        gl_FragColor = vec4(vColor, vOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const instancedDisk = new THREE.InstancedMesh(streakGeo, diskMaterial, instanceCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < instanceCount; i++) {
    const r = 5 + Math.pow(Math.random(), 1.3) * 40;
    const angle = Math.random() * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * (8 / r), Math.sin(angle) * r);
    dummy.lookAt(dummy.position.x + Math.sin(angle), dummy.position.y, dummy.position.z - Math.cos(angle));
    dummy.updateMatrix();
    instancedDisk.setMatrixAt(i, dummy.matrix);
  }
  scene.add(instancedDisk);

  const camControl = { distance: 85 };
  const orbitDir = new THREE.Vector3();
  let stateIdx = 0;
  let activeTimeline = null;
  let raf = 0;
  let running = true;
  const clock = new THREE.Clock();

  function transition() {
    if (!running) return;
    stateIdx = (stateIdx + 1) % STATES.length;
    const s = STATES[stateIdx];
    if (activeTimeline) activeTimeline.kill();
    activeTimeline = gsap.timeline({ defaults: { duration: 4.0, ease: "power2.inOut" } });
    activeTimeline.to(diskMaterial.uniforms.uMorph, { value: s.morph }, 0);
    activeTimeline.to(diskMaterial.uniforms.uCompression, { value: s.compress }, 0);
    activeTimeline.to(diskMaterial.uniforms.uIntensity, { value: s.intensity }, 0);
    activeTimeline.to(diskMaterial.uniforms.uOrbitScale, { value: s.orbit }, 0);
    activeTimeline.to(auraMat.uniforms.uIntensity, { value: s.intensity }, 0);
    activeTimeline.to(controls, { autoRotateSpeed: s.rotate }, 0);
    activeTimeline.to(camera.position, { y: s.camY }, 0);
    activeTimeline.to(camControl, { distance: s.camDist }, 0);
  }

  const transitionMs = opts.transitionMs ?? 10000;
  const transitionTimer = setInterval(transition, transitionMs);

  function resize() {
    const w = Math.max(container.clientWidth, 1);
    const h = Math.max(container.clientHeight, 1);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect > 1.35 ? 40 + Math.min(16, (aspect - 1) * 11) : 40;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  function animate() {
    if (!running) return;
    const time = clock.getElapsedTime();
    diskMaterial.uniforms.uTime.value = time;
    auraMat.uniforms.uTime.value = time;
    instancedDisk.rotation.y += 0.0005;

    orbitDir.subVectors(camera.position, controls.target).normalize();
    camera.position.x = controls.target.x + orbitDir.x * camControl.distance;
    camera.position.z = controls.target.z + orbitDir.z * camControl.distance;

    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(animate);
  }

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(container);
  else window.addEventListener("resize", resize);
  resize();
  animate();

  return {
    destroy() {
      running = false;
      clearInterval(transitionTimer);
      if (activeTimeline) activeTimeline.kill();
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      controls.dispose();
      streakGeo.dispose();
      diskMaterial.dispose();
      auraMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    },
  };
}
