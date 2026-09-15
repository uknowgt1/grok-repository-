/**
 * Fuego y Sangre — escena Three.js inmersiva
 * Casa Targaryen / House of the Dragon inspired WebGL experience
 * Sin build: ES modules + importmap (three@0.160.0)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ---------------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------------
const canvas = document.getElementById('webgl');
const loadingEl = document.getElementById('loading');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close');

// ---------------------------------------------------------------------------
// Renderer / Scene / Camera
// ---------------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
// Fondo rojo oscuro / ceniza + niebla épica
scene.background = new THREE.Color(0x1a0808);
scene.fog = new THREE.FogExp2(0x1a0c0c, 0.018);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(18, 12, 28);

// ---------------------------------------------------------------------------
// Controls — límites para mantener el castillo a la vista
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 12;
controls.maxDistance = 55;
controls.minPolarAngle = Math.PI * 0.15;
controls.maxPolarAngle = Math.PI * 0.48; // no mirar demasiado desde abajo
controls.target.set(0, 4, 0);
controls.update();

// ---------------------------------------------------------------------------
// Lighting — dramática, antorchas, hemisferio
// ---------------------------------------------------------------------------
const ambient = new THREE.AmbientLight(0x3a2020, 0.35);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xff6a3a, 0x1a0a08, 0.45);
hemi.position.set(0, 40, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xff5520, 1.35);
sun.position.set(-25, 35, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 90;
sun.shadow.camera.left = -35;
sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -35;
sun.shadow.bias = -0.0004;
scene.add(sun);

// Antorchas (PointLights cálidas cerca del castillo)
const torchPositions = [
  [-7, 3.5, 6],
  [7, 3.5, 6],
  [-5, 6, -4],
  [5, 8, -2],
];
const torches = torchPositions.map(([x, y, z]) => {
  const light = new THREE.PointLight(0xff6a20, 1.8, 22, 2);
  light.position.set(x, y, z);
  light.castShadow = false; // evitar coste excesivo en point lights
  scene.add(light);

  // Embers visuales en la antorcha
  const flameGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6622 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.copy(light.position);
  scene.add(flame);

  return { light, flame, baseIntensity: 1.8 };
});

// ---------------------------------------------------------------------------
// Ground — piedra volcánica oscura
// ---------------------------------------------------------------------------
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x1c1210,
  roughness: 0.95,
  metalness: 0.05,
});
const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------------------------------------------------------------------------
// Materiales compartidos (fallback procedural)
// ---------------------------------------------------------------------------
const volcanicStone = new THREE.MeshStandardMaterial({
  color: 0x2a2220,
  roughness: 0.88,
  metalness: 0.08,
});

const volcanicDark = new THREE.MeshStandardMaterial({
  color: 0x1a1412,
  roughness: 0.92,
  metalness: 0.05,
});

const dragonScale = new THREE.MeshStandardMaterial({
  color: 0x2a0808,
  roughness: 0.55,
  metalness: 0.25,
  emissive: 0x1a0505,
  emissiveIntensity: 0.15,
});

const wingMembrane = new THREE.MeshStandardMaterial({
  color: 0x4a1010,
  roughness: 0.7,
  metalness: 0.1,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.85,
  emissive: 0x220808,
  emissiveIntensity: 0.1,
});

// ---------------------------------------------------------------------------
// Interactive roots (para raycasting)
// ---------------------------------------------------------------------------
let castleRoot = new THREE.Group();
let dragonRoot = new THREE.Group();
scene.add(castleRoot);
scene.add(dragonRoot);

/** Marca meshes interactivos recursivamente */
function markInteractive(root, tag) {
  root.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.interactive = tag;
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  root.userData.interactive = tag;
}

// ---------------------------------------------------------------------------
// PLACEHOLDER: replace path with your Blender .gltf/.glb export
const CASTLE_URL = './assets/models/castle.glb';
const DRAGON_URL = './assets/models/dragon.glb';
// ---------------------------------------------------------------------------

const gltfLoader = new GLTFLoader();

/**
 * Castillo procedural de piedra volcánica (fallback)
 */
function buildProceduralCastle() {
  const group = new THREE.Group();

  // Keep principal
  const keep = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 8), volcanicStone);
  keep.position.set(0, 5, -2);
  group.add(keep);

  // Torreón central
  const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 4), volcanicDark);
  tower.position.set(0, 8, -2);
  group.add(tower);

  // Almenas
  for (let i = -1; i <= 1; i++) {
    const battlement = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.5, 1.2),
      volcanicStone
    );
    battlement.position.set(i * 1.4, 16.5, -2);
    group.add(battlement);
  }

  // Torres laterales
  const leftTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.6, 12, 8),
    volcanicStone
  );
  leftTower.position.set(-8, 6, 0);
  group.add(leftTower);

  const rightTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.6, 14, 8),
    volcanicDark
  );
  rightTower.position.set(8, 7, 0);
  group.add(rightTower);

  // Techos cónicos
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0x3a1010,
    roughness: 0.7,
    metalness: 0.15,
  });
  const leftRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4, 8), coneMat);
  leftRoof.position.set(-8, 14, 0);
  group.add(leftRoof);

  const rightRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4.5, 8), coneMat);
  rightRoof.position.set(8, 16, 0);
  group.add(rightRoof);

  // Muralla frontal
  const wall = new THREE.Mesh(new THREE.BoxGeometry(22, 5, 2), volcanicStone);
  wall.position.set(0, 2.5, 6);
  group.add(wall);

  // Puerta / arco
  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 4, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0a0606, roughness: 0.6, metalness: 0.2 })
  );
  gate.position.set(0, 2, 6.6);
  group.add(gate);

  // Remates de muralla
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.4, 1.4),
      volcanicDark
    );
    merlon.position.set(i * 2.2, 5.7, 6);
    group.add(merlon);
  }

  group.position.set(0, 0, -4);
  return group;
}

/**
 * Dragón procedural (cuerpo alargado + alas)
 */
function buildProceduralDragon() {
  const group = new THREE.Group();

  // Cuerpo
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.9, 4.5, 6, 12),
    dragonScale
  );
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0, 0);
  group.add(body);

  // Cuello
  const neck = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.45, 2.2, 4, 8),
    dragonScale
  );
  neck.rotation.z = Math.PI / 2.4;
  neck.position.set(2.8, 0.6, 0);
  group.add(neck);

  // Cabeza
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.6, 8),
    dragonScale
  );
  head.rotation.z = -Math.PI / 2;
  head.position.set(4.5, 0.9, 0);
  group.add(head);

  // Cuernos
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.4,
    metalness: 0.3,
  });
  [-0.25, 0.25].forEach((z) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 6), hornMat);
    horn.position.set(4.2, 1.5, z);
    horn.rotation.z = -0.4;
    group.add(horn);
  });

  // Cola
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 3.5, 8),
    dragonScale
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-4.2, -0.2, 0);
  group.add(tail);

  // Alas
  function makeWing(side) {
    const wing = new THREE.Group();
    const bone = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, 3.5),
      dragonScale
    );
    bone.rotation.y = side * 0.3;
    wing.add(bone);

    const membrane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 2.8),
      wingMembrane
    );
    membrane.position.set(side * 0.2, -0.6, 0.3);
    membrane.rotation.x = 0.35;
    membrane.rotation.y = side * 0.5;
    wing.add(membrane);

    wing.position.set(-0.5, 0.8, side * 1.2);
    wing.rotation.z = side * 0.35;
    return wing;
  }

  group.add(makeWing(1));
  group.add(makeWing(-1));

  // Patas simples
  for (const [x, z] of [
    [1, 0.6],
    [1, -0.6],
    [-1.5, 0.55],
    [-1.5, -0.55],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.25, 1.4, 6),
      dragonScale
    );
    leg.position.set(x, -1.1, z);
    group.add(leg);
  }

  // Ojos brillantes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
  [-0.28, 0.28].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), eyeMat);
    eye.position.set(4.6, 1.05, z);
    group.add(eye);
  });

  group.position.set(-6, 5.5, 10);
  group.rotation.y = Math.PI * 0.35;
  group.scale.setScalar(1.15);
  return group;
}

// ---------------------------------------------------------------------------
// Animación GLTF
// ---------------------------------------------------------------------------
let dragonMixer = null;
let dragonFireAction = null;
const clock = new THREE.Clock();

/**
 * Reproduce clip idle / primero; guarda referencia a clip de fuego si existe.
 * // PERSONALIZAR: cambia 'fire' por el nombre exacto del clip de Blender
 */
function setupDragonAnimations(gltf, root) {
  if (!gltf.animations || gltf.animations.length === 0) return;

  dragonMixer = new THREE.AnimationMixer(root);

  const clips = gltf.animations;
  const idleClip =
    clips.find((c) => /idle|rest|fly|loop/i.test(c.name)) || clips[0];
  const idleAction = dragonMixer.clipAction(idleClip);
  idleAction.play();

  // PLACEHOLDER animación de fuego — ajusta el nombre del clip aquí
  const FIRE_CLIP_NAME = 'fire'; // ← cambia si tu clip se llama distinto
  const fireClip =
    clips.find((c) => c.name.toLowerCase() === FIRE_CLIP_NAME) ||
    clips.find((c) => /fire|breath|roar|attack/i.test(c.name));

  if (fireClip) {
    dragonFireAction = dragonMixer.clipAction(fireClip);
    dragonFireAction.setLoop(THREE.LoopOnce);
    dragonFireAction.clampWhenFinished = true;
  }
}

// ---------------------------------------------------------------------------
// Carga de modelos (con fallback)
// ---------------------------------------------------------------------------
function loadModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

async function setupCastle() {
  // PLACEHOLDER: replace path with your Blender .gltf/.glb export
  try {
    const gltf = await loadModel(CASTLE_URL);
    scene.remove(castleRoot);
    castleRoot = gltf.scene;
    // Escala / posición típica — ajusta según tu modelo
    castleRoot.position.set(0, 0, -4);
    castleRoot.scale.setScalar(1);
    scene.add(castleRoot);
    markInteractive(castleRoot, 'castle');
    console.info('[Fuego y Sangre] Castillo GLB cargado.');
  } catch {
    console.warn('[Fuego y Sangre] castle.glb no encontrado — usando procedural.');
    scene.remove(castleRoot);
    castleRoot = buildProceduralCastle();
    scene.add(castleRoot);
    markInteractive(castleRoot, 'castle');
  }
}

async function setupDragon() {
  // PLACEHOLDER: replace path with your Blender .gltf/.glb export
  try {
    const gltf = await loadModel(DRAGON_URL);
    scene.remove(dragonRoot);
    dragonRoot = gltf.scene;
    dragonRoot.position.set(-6, 4, 10);
    dragonRoot.scale.setScalar(1);
    scene.add(dragonRoot);
    markInteractive(dragonRoot, 'dragon');
    setupDragonAnimations(gltf, dragonRoot);
    console.info('[Fuego y Sangre] Dragón GLB cargado.');
  } catch {
    console.warn('[Fuego y Sangre] dragon.glb no encontrado — usando procedural.');
    scene.remove(dragonRoot);
    dragonRoot = buildProceduralDragon();
    scene.add(dragonRoot);
    markInteractive(dragonRoot, 'dragon');
  }
}

// ---------------------------------------------------------------------------
// Ash particle system — ceniza flotando / cayendo
// ---------------------------------------------------------------------------
const ASH_COUNT = 900;
const ashGeo = new THREE.BufferGeometry();
const ashPositions = new Float32Array(ASH_COUNT * 3);
const ashVelocities = new Float32Array(ASH_COUNT);

for (let i = 0; i < ASH_COUNT; i++) {
  ashPositions[i * 3] = (Math.random() - 0.5) * 70;
  ashPositions[i * 3 + 1] = Math.random() * 40;
  ashPositions[i * 3 + 2] = (Math.random() - 0.5) * 70;
  ashVelocities[i] = 0.4 + Math.random() * 1.2;
}

ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPositions, 3));

const ashMat = new THREE.PointsMaterial({
  color: 0x8a7060,
  size: 0.12,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  sizeAttenuation: true,
});

const ashPoints = new THREE.Points(ashGeo, ashMat);
scene.add(ashPoints);

function updateAsh(dt) {
  const pos = ashGeo.attributes.position.array;
  for (let i = 0; i < ASH_COUNT; i++) {
    pos[i * 3 + 1] -= ashVelocities[i] * dt;
    pos[i * 3] += Math.sin(performance.now() * 0.0003 + i) * 0.3 * dt;
    if (pos[i * 3 + 1] < 0) {
      pos[i * 3 + 1] = 25 + Math.random() * 15;
      pos[i * 3] = (Math.random() - 0.5) * 70;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
  }
  ashGeo.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Fire-breathe simulation (emissive pulse)
// ---------------------------------------------------------------------------
let firePulseUntil = 0;
const FIRE_PULSE_MS = 1800;

function triggerDragonFire() {
  firePulseUntil = performance.now() + FIRE_PULSE_MS;

  // Si hay clip de fuego en el mixer, reproducirlo
  if (dragonFireAction) {
    dragonFireAction.reset();
    dragonFireAction.play();
  }
}

function updateFirePulse() {
  const now = performance.now();
  const active = now < firePulseUntil;
  const t = active
    ? Math.sin(((firePulseUntil - now) / FIRE_PULSE_MS) * Math.PI)
    : 0;

  dragonRoot.traverse((obj) => {
    if (!obj.isMesh || !obj.material) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((m) => {
      if (!m.emissive) return;
      if (!m.userData._baseEmissive) {
        m.userData._baseEmissive = m.emissive.clone();
        m.userData._baseEmissiveIntensity = m.emissiveIntensity ?? 0;
      }
      if (active) {
        m.emissive.setRGB(1.0, 0.25 + 0.2 * t, 0.02);
        m.emissiveIntensity = 0.4 + t * 2.2;
      } else if (m.userData._baseEmissive) {
        m.emissive.copy(m.userData._baseEmissive);
        m.emissiveIntensity = m.userData._baseEmissiveIntensity;
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Modal UI
// ---------------------------------------------------------------------------
function openCastleModal() {
  modalBackdrop.classList.remove('hidden');
}

function closeCastleModal() {
  modalBackdrop.classList.add('hidden');
}

modalCloseBtn.addEventListener('click', closeCastleModal);
modalBackdrop.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeCastleModal();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeCastleModal();
});

// ---------------------------------------------------------------------------
// RAYCASTER: modify interaction logic here
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerClick(event) {
  // Ignorar si el modal está abierto
  if (!modalBackdrop.classList.contains('hidden')) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [castleRoot, dragonRoot],
    true
  );

  if (hits.length === 0) return;

  let tag = null;
  let obj = hits[0].object;
  while (obj) {
    if (obj.userData && obj.userData.interactive) {
      tag = obj.userData.interactive;
      break;
    }
    obj = obj.parent;
  }

  // Personaliza aquí: dragon → fuego, castle → modal
  if (tag === 'dragon') {
    triggerDragonFire();
  } else if (tag === 'castle') {
    openCastleModal();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  // Distinguir click de drag: guardar posición
  canvas._ptrDown = { x: e.clientX, y: e.clientY, t: performance.now() };
});

canvas.addEventListener('pointerup', (e) => {
  const down = canvas._ptrDown;
  if (!down) return;
  const dx = e.clientX - down.x;
  const dy = e.clientY - down.y;
  const dt = performance.now() - down.t;
  // Solo clic corto sin mucho movimiento
  if (dt < 400 && dx * dx + dy * dy < 36) {
    onPointerClick(e);
  }
});

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onResize);

// ---------------------------------------------------------------------------
// Animate
// ---------------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  controls.update();
  updateAsh(dt);
  updateFirePulse();

  if (dragonMixer) dragonMixer.update(dt);

  // Parpadeo sutil de antorchas
  const t = performance.now() * 0.004;
  torches.forEach((torch, i) => {
    const flicker = 0.85 + 0.2 * Math.sin(t * 2.1 + i * 1.7) + 0.1 * Math.sin(t * 5.3 + i);
    torch.light.intensity = torch.baseIntensity * flicker;
    torch.flame.scale.setScalar(0.85 + 0.25 * flicker);
  });

  // Ligero aleteo procedural del dragón si no hay mixer
  if (!dragonMixer && dragonRoot) {
    dragonRoot.rotation.z = Math.sin(performance.now() * 0.001) * 0.04;
    dragonRoot.position.y = 5.5 + Math.sin(performance.now() * 0.0008) * 0.35;
  }

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function init() {
  await Promise.all([setupCastle(), setupDragon()]);
  // Centrar orbit target en el castillo
  controls.target.set(0, 5, -2);
  controls.update();

  if (loadingEl) loadingEl.classList.add('hidden');
  animate();
})();
