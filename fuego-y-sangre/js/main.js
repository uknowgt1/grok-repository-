/**
 * Fuego y Sangre — escena Three.js inmersiva
 * Casa Targaryen / House of the Dragon inspired WebGL experience
 * Sin build: ES modules + importmap (three@0.160.0)
 *
 * Procedural-first: ≥3 castillos + ≥3 dragones detallados, escena luminosa.
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
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2c1212);
scene.fog = new THREE.FogExp2(0x2a1010, 0.0035);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(14, 9, 22);

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 8;
controls.maxDistance = 55;
controls.minPolarAngle = Math.PI * 0.15;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 5, -2);
controls.update();

// ---------------------------------------------------------------------------
// Lighting — bright volcanic dusk
// ---------------------------------------------------------------------------
const ambient = new THREE.AmbientLight(0x6a4840, 0.9);
scene.add(ambient);

const hemi = new THREE.HemisphereLight(0xffa060, 0x3a2018, 1.0);
hemi.position.set(0, 40, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xff6630, 2.1);
sun.position.set(-25, 35, 15);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 2;
sun.shadow.camera.far = 100;
sun.shadow.camera.left = -45;
sun.shadow.camera.right = 45;
sun.shadow.camera.top = 45;
sun.shadow.camera.bottom = -45;
sun.shadow.bias = -0.0004;
scene.add(sun);

// Extra fill so far castles stay readable
const fill = new THREE.DirectionalLight(0xff8860, 0.55);
fill.position.set(20, 20, -10);
scene.add(fill);

// Antorchas
const torchPositions = [
  [-7, 3.5, 6],
  [7, 3.5, 6],
  [-5, 6, -4],
  [5, 8, -2],
  [-12, 4, 2],
  [14, 5, -8],
];
const torches = torchPositions.map(([x, y, z]) => {
  const light = new THREE.PointLight(0xff6a20, 1.9, 24, 2);
  light.position.set(x, y, z);
  light.castShadow = false;
  scene.add(light);

  const flameGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6622 });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.copy(light.position);
  scene.add(flame);

  return { light, flame, baseIntensity: 1.9 };
});

// ---------------------------------------------------------------------------
// Ground — mid-tone volcanic stone
// ---------------------------------------------------------------------------
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x4a3a32,
  roughness: 0.92,
  metalness: 0.05,
});
const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 72), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------------------------------------------------------------------------
// Shared materials — readable mid-tones, dragons pop with emissive
// ---------------------------------------------------------------------------
const volcanicStone = new THREE.MeshStandardMaterial({
  color: 0x6e5c50,
  roughness: 0.85,
  metalness: 0.08,
});

const volcanicDark = new THREE.MeshStandardMaterial({
  color: 0x564840,
  roughness: 0.9,
  metalness: 0.05,
});

const volcanicLight = new THREE.MeshStandardMaterial({
  color: 0x7a6a5c,
  roughness: 0.82,
  metalness: 0.06,
});

const roofMat = new THREE.MeshStandardMaterial({
  color: 0x6a2828,
  roughness: 0.68,
  metalness: 0.15,
  emissive: 0x2a0808,
  emissiveIntensity: 0.15,
});

const gateMat = new THREE.MeshStandardMaterial({
  color: 0x2a1810,
  roughness: 0.55,
  metalness: 0.25,
});

const dragonScale = new THREE.MeshStandardMaterial({
  color: 0x8a1c1c,
  roughness: 0.5,
  metalness: 0.28,
  emissive: 0x4a0c0c,
  emissiveIntensity: 0.55,
});

const wingMembrane = new THREE.MeshStandardMaterial({
  color: 0x7a2424,
  roughness: 0.65,
  metalness: 0.12,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.88,
  emissive: 0x401010,
  emissiveIntensity: 0.35,
});

const hornMat = new THREE.MeshStandardMaterial({
  color: 0x1a1210,
  roughness: 0.35,
  metalness: 0.4,
});

const eyeMat = new THREE.MeshStandardMaterial({
  color: 0xff4400,
  emissive: 0xff2200,
  emissiveIntensity: 1.4,
  roughness: 0.3,
  metalness: 0.2,
});

const clawMat = new THREE.MeshStandardMaterial({
  color: 0x222018,
  roughness: 0.4,
  metalness: 0.35,
});

// ---------------------------------------------------------------------------
// Interactive roots
// ---------------------------------------------------------------------------
const castleRoots = [];
const dragonRoots = [];
/** @type {Map<THREE.Object3D, { until: number }>} */
const firePulseByDragon = new Map();
const FIRE_PULSE_MS = 1800;

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
// PLACEHOLDER GLTF (optional primary only)
// ---------------------------------------------------------------------------
const CASTLE_URL = './assets/models/castle.glb';
const DRAGON_URL = './assets/models/dragon.glb';
const gltfLoader = new GLTFLoader();

function loadModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

// ---------------------------------------------------------------------------
// Detailed procedural castle — high segment counts
// ---------------------------------------------------------------------------
function buildDetailedCastle(options = {}) {
  const {
    position = [0, 0, 0],
    scale = 1,
    rotationY = 0,
  } = options;

  const group = new THREE.Group();
  const SEG = 16;
  const CONE_SEG = 20;

  // Rocky base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(11, 13.5, 2.2, 20),
    volcanicDark
  );
  base.position.set(0, 1.1, -1);
  group.add(base);

  // Extra rock chunks
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = 10 + (i % 3) * 0.6;
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.9 + (i % 3) * 0.25, 0),
      volcanicLight
    );
    rock.position.set(Math.cos(a) * r, 0.7, Math.sin(a) * r - 1);
    rock.rotation.set(i * 0.4, i * 0.7, i * 0.2);
    group.add(rock);
  }

  // Keep (main body) — more faces via subdivided box look
  const keep = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 8, 4, 4, 3),
    volcanicStone
  );
  keep.position.set(0, 7, -2);
  group.add(keep);

  // Keep upper ledge
  const keepLedge = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 1.2, 9.2, 3, 1, 3),
    volcanicLight
  );
  keepLedge.position.set(0, 12.2, -2);
  group.add(keepLedge);

  // Central tall tower
  const centralTower = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.4, 18, SEG),
    volcanicDark
  );
  centralTower.position.set(0, 11, -2);
  group.add(centralTower);

  const centralRoof = new THREE.Mesh(
    new THREE.ConeGeometry(2.8, 4.5, CONE_SEG),
    roofMat
  );
  centralRoof.position.set(0, 22.2, -2);
  group.add(centralRoof);

  // Battlements on central tower
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 1.1, 0.55),
      volcanicStone
    );
    merlon.position.set(
      Math.cos(a) * 2.15,
      20.5,
      Math.sin(a) * 2.15 - 2
    );
    group.add(merlon);
  }

  // Side towers (4 corners + extras)
  const towerSpecs = [
    { x: -8, z: 1, h: 13, rBot: 2.5, rTop: 2.1, roofH: 3.8 },
    { x: 8, z: 1, h: 15, rBot: 2.6, rTop: 2.15, roofH: 4.2 },
    { x: -7, z: -7, h: 11, rBot: 2.1, rTop: 1.8, roofH: 3.4 },
    { x: 7, z: -7, h: 12, rBot: 2.2, rTop: 1.9, roofH: 3.6 },
    { x: 0, z: 5, h: 9, rBot: 1.8, rTop: 1.5, roofH: 2.8 },
  ];

  towerSpecs.forEach((spec) => {
    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(spec.rTop, spec.rBot, spec.h, SEG),
      volcanicStone
    );
    tower.position.set(spec.x, spec.h / 2 + 2, spec.z);
    group.add(tower);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(spec.rBot + 0.35, spec.roofH, CONE_SEG),
      roofMat
    );
    roof.position.set(spec.x, 2 + spec.h + spec.roofH / 2, spec.z);
    group.add(roof);

    // Merlons around tower top
    const nMerlon = 12;
    for (let i = 0; i < nMerlon; i++) {
      const a = (i / nMerlon) * Math.PI * 2;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.9, 0.4),
        volcanicDark
      );
      m.position.set(
        spec.x + Math.cos(a) * (spec.rTop + 0.05),
        2 + spec.h + 0.35,
        spec.z + Math.sin(a) * (spec.rTop + 0.05)
      );
      group.add(m);
    }

    // Window insets (dark recessed boxes)
    for (let w = 0; w < 3; w++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.9, 0.25),
        gateMat
      );
      const ang = Math.atan2(-spec.z, -spec.x) + Math.PI;
      win.position.set(
        spec.x + Math.cos(ang) * (spec.rTop * 0.95),
        4 + w * 2.8,
        spec.z + Math.sin(ang) * (spec.rTop * 0.95)
      );
      win.lookAt(spec.x, win.position.y, spec.z);
      group.add(win);
    }
  });

  // Thick walls (front + sides)
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(24, 5.5, 2.4, 6, 2, 1),
    volcanicStone
  );
  frontWall.position.set(0, 4.75, 7);
  group.add(frontWall);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 5, 14, 1, 2, 4),
    volcanicDark
  );
  leftWall.position.set(-11, 4.5, 0);
  group.add(leftWall);

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 5, 14, 1, 2, 4),
    volcanicDark
  );
  rightWall.position.set(11, 4.5, 0);
  group.add(rightWall);

  // Battlement merlons on front wall
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    const merlon = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.5, 1.6),
      volcanicLight
    );
    merlon.position.set(i * 2.05, 8.2, 7);
    group.add(merlon);
  }

  // Arched gate look (dark inset + frame)
  const gateFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 5.2, 1.0),
    volcanicDark
  );
  gateFrame.position.set(0, 3.6, 8.1);
  group.add(gateFrame);

  const gateDoor = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 4.2, 0.6),
    gateMat
  );
  gateDoor.position.set(0, 3.1, 8.45);
  group.add(gateDoor);

  // Arch top (half-cylinder)
  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.7, 16, 1, false, 0, Math.PI),
    volcanicDark
  );
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = Math.PI / 2;
  arch.position.set(0, 5.4, 8.45);
  group.add(arch);

  // Stairs to gate
  for (let s = 0; s < 6; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(5.5 - s * 0.25, 0.45, 1.1),
      volcanicLight
    );
    step.position.set(0, 0.25 + s * 0.42, 10.5 - s * 0.55);
    group.add(step);
  }

  // Keep windows
  for (const [wx, wy, wz] of [
    [-3, 8, 2.1],
    [3, 8, 2.1],
    [-3, 11, 2.1],
    [3, 11, 2.1],
    [0, 9.5, 2.1],
  ]) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.3), gateMat);
    win.position.set(wx, wy, wz);
    group.add(win);
  }

  group.position.set(position[0], position[1], position[2]);
  group.rotation.y = rotationY;
  group.scale.setScalar(scale);
  return group;
}

// ---------------------------------------------------------------------------
// Detailed procedural dragon — segmented spine, multi-bone wings
// ---------------------------------------------------------------------------
function buildDetailedDragon(options = {}) {
  const {
    position = [0, 5, 0],
    scale = 1,
    rotationY = 0,
  } = options;

  const group = new THREE.Group();

  // Segmented spine / body along a slight curve
  const spineCount = 14;
  const bodyParts = [];
  for (let i = 0; i < spineCount; i++) {
    const t = i / (spineCount - 1);
    const radius = 0.35 + Math.sin(t * Math.PI) * 0.55;
    const seg = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 10),
      dragonScale
    );
    const x = (t - 0.5) * 7.5;
    const y = Math.sin(t * Math.PI) * 0.35;
    seg.position.set(x, y, 0);
    seg.scale.set(1.15, 0.95, 0.9);
    group.add(seg);
    bodyParts.push(seg);
  }

  // Capsule torso reinforcement
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.85, 3.2, 8, 16),
    dragonScale
  );
  torso.rotation.z = Math.PI / 2;
  torso.position.set(0.2, 0.15, 0);
  group.add(torso);

  // Neck segments
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const neck = new THREE.Mesh(
      new THREE.SphereGeometry(0.42 - t * 0.08, 10, 8),
      dragonScale
    );
    neck.position.set(3.6 + i * 0.45, 0.45 + t * 0.55, 0);
    group.add(neck);
  }

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 12),
    dragonScale
  );
  head.position.set(6.3, 1.15, 0);
  head.scale.set(1.35, 0.95, 0.85);
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.ConeGeometry(0.38, 1.35, 12),
    dragonScale
  );
  snout.rotation.z = -Math.PI / 2;
  snout.position.set(7.2, 1.05, 0);
  group.add(snout);

  // Jaw
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.22, 0.5, 2, 1, 2),
    dragonScale
  );
  jaw.position.set(6.95, 0.72, 0);
  group.add(jaw);

  // Horns (multi)
  [
    [6.1, 1.7, -0.28, -0.5, 1.1],
    [6.1, 1.7, 0.28, -0.5, 1.1],
    [5.85, 1.55, -0.15, -0.35, 0.7],
    [5.85, 1.55, 0.15, -0.35, 0.7],
  ].forEach(([x, y, z, rot, h]) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, h, 8), hornMat);
    horn.position.set(x, y, z);
    horn.rotation.z = rot;
    group.add(horn);
  });

  // Glowing eyes
  [-0.28, 0.28].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), eyeMat);
    eye.position.set(6.65, 1.25, z);
    group.add(eye);
  });

  // Segmented tail
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const r = 0.45 * (1 - t * 0.85);
    const tailSeg = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(r, 0.06), 10, 8),
      dragonScale
    );
    const x = -3.8 - i * 0.55;
    const y = -0.15 - Math.sin(t * 1.2) * 0.35;
    const z = Math.sin(t * Math.PI) * 0.4;
    tailSeg.position.set(x, y, z);
    group.add(tailSeg);
  }
  const tailTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.9, 8),
    dragonScale
  );
  tailTip.rotation.z = Math.PI / 2;
  tailTip.position.set(-9.3, -0.55, 0.15);
  group.add(tailTip);

  // Multi-bone wings + membrane planes (higher vert counts)
  function makeWing(side) {
    const wing = new THREE.Group();
    wing.name = side > 0 ? 'wingR' : 'wingL';

    for (let idx = 0; idx < 4; idx++) {
      const thick = 0.12 - idx * 0.015;
      const len = 3.6 - idx * 0.5;
      const bone = new THREE.Mesh(
        new THREE.CapsuleGeometry(thick, len, 4, 8),
        dragonScale
      );
      bone.position.set(
        -0.2 + idx * 0.12,
        0.85 - idx * 0.28,
        side * (1.0 + idx * 0.55)
      );
      bone.rotation.set(
        0.15 + idx * 0.1,
        side * (0.35 + idx * 0.12),
        side * (0.2 + idx * 0.05)
      );
      wing.add(bone);
    }

    const mem1 = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 3.2, 8, 6),
      wingMembrane
    );
    mem1.position.set(0.1, 0.15, side * 2.2);
    mem1.rotation.x = 0.4;
    mem1.rotation.y = side * 0.55;
    mem1.rotation.z = side * 0.15;
    wing.add(mem1);

    const mem2 = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.4, 6, 4),
      wingMembrane
    );
    mem2.position.set(-0.8, -0.5, side * 2.8);
    mem2.rotation.x = 0.55;
    mem2.rotation.y = side * 0.7;
    wing.add(mem2);

    const mem3 = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.8, 4, 3),
      wingMembrane
    );
    mem3.position.set(0.9, -0.3, side * 1.6);
    mem3.rotation.x = 0.3;
    mem3.rotation.y = side * 0.35;
    wing.add(mem3);

    wing.position.set(-0.4, 0.7, side * 0.85);
    wing.rotation.z = side * 0.4;
    wing.userData.side = side;
    return wing;
  }

  const wingL = makeWing(-1);
  const wingR = makeWing(1);
  group.add(wingL);
  group.add(wingR);
  group.userData.wings = [wingL, wingR];

  // Legs + claws
  const legPositions = [
    [1.4, -1.15, 0.7],
    [1.4, -1.15, -0.7],
    [-1.6, -1.05, 0.65],
    [-1.6, -1.05, -0.65],
  ];
  legPositions.forEach(([x, y, z]) => {
    const upper = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.16, 0.7, 4, 8),
      dragonScale
    );
    upper.position.set(x, y + 0.35, z);
    group.add(upper);

    const lower = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12, 0.55, 4, 8),
      dragonScale
    );
    lower.position.set(x + 0.05, y - 0.25, z);
    group.add(lower);

    // Claws
    for (let c = -1; c <= 1; c++) {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.35, 6),
        clawMat
      );
      claw.position.set(x + 0.15, y - 0.65, z + c * 0.12);
      claw.rotation.z = Math.PI / 2.2;
      group.add(claw);
    }
  });

  // Dorsal spikes
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.45 + (1 - Math.abs(t - 0.5)) * 0.4, 6),
      hornMat
    );
    spike.position.set((t - 0.5) * 6.5, 0.85 + Math.sin(t * Math.PI) * 0.2, 0);
    group.add(spike);
  }

  group.position.set(position[0], position[1], position[2]);
  group.rotation.y = rotationY;
  group.scale.setScalar(scale);

  // Idle motion params
  group.userData.idle = {
    baseY: position[1],
    phase: Math.random() * Math.PI * 2,
    bobAmp: 0.25 + Math.random() * 0.2,
    bobSpeed: 0.0007 + Math.random() * 0.0004,
    flapSpeed: 0.002 + Math.random() * 0.001,
    yawDrift: (Math.random() - 0.5) * 0.00015,
  };

  return group;
}

// ---------------------------------------------------------------------------
// Optional GLTF for primary castle/dragon — procedural-first
// ---------------------------------------------------------------------------
let dragonMixer = null;
let dragonFireAction = null;
const clock = new THREE.Clock();

function setupDragonAnimations(gltf, root) {
  if (!gltf.animations || gltf.animations.length === 0) return;
  dragonMixer = new THREE.AnimationMixer(root);
  const clips = gltf.animations;
  const idleClip =
    clips.find((c) => /idle|rest|fly|loop/i.test(c.name)) || clips[0];
  dragonMixer.clipAction(idleClip).play();
  const FIRE_CLIP_NAME = 'fire';
  const fireClip =
    clips.find((c) => c.name.toLowerCase() === FIRE_CLIP_NAME) ||
    clips.find((c) => /fire|breath|roar|attack/i.test(c.name));
  if (fireClip) {
    dragonFireAction = dragonMixer.clipAction(fireClip);
    dragonFireAction.setLoop(THREE.LoopOnce);
    dragonFireAction.clampWhenFinished = true;
  }
}

function placeCastles() {
  // Clear previous
  castleRoots.splice(0).forEach((r) => scene.remove(r));

  const specs = [
    { position: [0, 0, -4], scale: 1.05, rotationY: 0 },
    { position: [-22, 0, -14], scale: 0.72, rotationY: 0.35 },
    { position: [20, 0, -18], scale: 0.58, rotationY: -0.45 },
    { position: [8, 0, -32], scale: 0.42, rotationY: 0.2 },
  ];

  specs.forEach((spec) => {
    const castle = buildDetailedCastle(spec);
    scene.add(castle);
    markInteractive(castle, 'castle');
    castleRoots.push(castle);
  });
}

async function tryPrimaryCastleGLTF() {
  try {
    const gltf = await loadModel(CASTLE_URL);
    // Replace only the main (first) castle with GLTF if available
    if (castleRoots[0]) {
      scene.remove(castleRoots[0]);
      const root = gltf.scene;
      root.position.set(0, 0, -4);
      root.scale.setScalar(1);
      scene.add(root);
      markInteractive(root, 'castle');
      castleRoots[0] = root;
      console.info('[Fuego y Sangre] Castillo GLB primario cargado.');
    }
  } catch {
    console.warn('[Fuego y Sangre] castle.glb ausente — procedural only.');
  }
}

function placeDragons() {
  dragonRoots.splice(0).forEach((r) => {
    scene.remove(r);
    firePulseByDragon.delete(r);
  });

  const specs = [
    // Foreground large
    { position: [-5, 5.8, 9], scale: 1.65, rotationY: Math.PI * 0.32 },
    // Mid circling offset
    { position: [10, 8.5, 2], scale: 1.15, rotationY: -Math.PI * 0.55 },
    // Distant smaller
    { position: [-14, 11, -12], scale: 0.75, rotationY: Math.PI * 0.85 },
    // Extra distant / high
    { position: [16, 13, -8], scale: 0.55, rotationY: -Math.PI * 0.2 },
  ];

  specs.forEach((spec) => {
    const dragon = buildDetailedDragon(spec);
    scene.add(dragon);
    markInteractive(dragon, 'dragon');
    dragonRoots.push(dragon);
  });
}

async function tryPrimaryDragonGLTF() {
  try {
    const gltf = await loadModel(DRAGON_URL);
    if (dragonRoots[0]) {
      scene.remove(dragonRoots[0]);
      firePulseByDragon.delete(dragonRoots[0]);
      const root = gltf.scene;
      root.position.set(-5, 5.8, 9);
      root.scale.setScalar(1);
      root.rotation.y = Math.PI * 0.32;
      root.userData.idle = {
        baseY: 5.8,
        phase: 0,
        bobAmp: 0.3,
        bobSpeed: 0.0008,
        flapSpeed: 0.002,
        yawDrift: 0,
      };
      scene.add(root);
      markInteractive(root, 'dragon');
      dragonRoots[0] = root;
      setupDragonAnimations(gltf, root);
      console.info('[Fuego y Sangre] Dragón GLB primario cargado.');
    }
  } catch {
    console.warn('[Fuego y Sangre] dragon.glb ausente — procedural only.');
  }
}

// ---------------------------------------------------------------------------
// Ash particles
// ---------------------------------------------------------------------------
const ASH_COUNT = 900;
const ashGeo = new THREE.BufferGeometry();
const ashPositions = new Float32Array(ASH_COUNT * 3);
const ashVelocities = new Float32Array(ASH_COUNT);

for (let i = 0; i < ASH_COUNT; i++) {
  ashPositions[i * 3] = (Math.random() - 0.5) * 80;
  ashPositions[i * 3 + 1] = Math.random() * 45;
  ashPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
  ashVelocities[i] = 0.4 + Math.random() * 1.2;
}

ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPositions, 3));

const ashMat = new THREE.PointsMaterial({
  color: 0x9a8070,
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
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
  }
  ashGeo.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Fire pulse — per dragon
// ---------------------------------------------------------------------------
function triggerDragonFire(dragonRoot) {
  if (!dragonRoot) return;
  firePulseByDragon.set(dragonRoot, { until: performance.now() + FIRE_PULSE_MS });

  if (dragonFireAction && dragonRoot === dragonRoots[0]) {
    dragonFireAction.reset();
    dragonFireAction.play();
  }
}

function updateFirePulses() {
  const now = performance.now();

  dragonRoots.forEach((root) => {
    const pulse = firePulseByDragon.get(root);
    const active = pulse && now < pulse.until;
    const t = active
      ? Math.sin(((pulse.until - now) / FIRE_PULSE_MS) * Math.PI)
      : 0;

    root.traverse((obj) => {
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
          m.emissiveIntensity = 0.45 + t * 2.4;
        } else if (m.userData._baseEmissive) {
          m.emissive.copy(m.userData._baseEmissive);
          m.emissiveIntensity = m.userData._baseEmissiveIntensity;
        }
      });
    });

    if (pulse && !active) firePulseByDragon.delete(root);
  });
}

// ---------------------------------------------------------------------------
// Idle motion for procedural dragons
// ---------------------------------------------------------------------------
function updateDragonIdle(now) {
  dragonRoots.forEach((root, idx) => {
    // Skip heavy mixer-driven primary if mixer exists and it's index 0
    if (dragonMixer && idx === 0 && root.userData.idle == null) return;

    const idle = root.userData.idle;
    if (!idle) return;

    const bob =
      Math.sin(now * idle.bobSpeed + idle.phase) * idle.bobAmp;
    root.position.y = idle.baseY + bob;
    root.rotation.z = Math.sin(now * idle.bobSpeed * 1.2 + idle.phase) * 0.045;
    root.rotation.y += idle.yawDrift;

    // Wing flap
    if (root.userData.wings) {
      const flap = Math.sin(now * idle.flapSpeed + idle.phase) * 0.28;
      root.userData.wings.forEach((wing) => {
        const side = wing.userData.side || 1;
        wing.rotation.z = side * (0.4 + flap);
        wing.rotation.x = flap * 0.35;
      });
    }
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
// Raycaster — all castle & dragon roots
// ---------------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function findInteractiveRoot(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData && cur.userData.interactive) {
      return { tag: cur.userData.interactive, root: cur };
    }
    // Prefer marked group roots from our arrays
    if (castleRoots.includes(cur)) return { tag: 'castle', root: cur };
    if (dragonRoots.includes(cur)) return { tag: 'dragon', root: cur };
    cur = cur.parent;
  }
  return null;
}

function resolveDragonRoot(obj) {
  let cur = obj;
  while (cur) {
    if (dragonRoots.includes(cur)) return cur;
    cur = cur.parent;
  }
  // fallback: walk up until interactive dragon tag
  cur = obj;
  while (cur) {
    if (cur.userData && cur.userData.interactive === 'dragon') return cur;
    cur = cur.parent;
  }
  return null;
}

function onPointerClick(event) {
  if (!modalBackdrop.classList.contains('hidden')) return;

  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    [...castleRoots, ...dragonRoots],
    true
  );

  if (hits.length === 0) return;

  const found = findInteractiveRoot(hits[0].object);
  if (!found) return;

  if (found.tag === 'dragon') {
    const dRoot = resolveDragonRoot(hits[0].object) || found.root;
    triggerDragonFire(dRoot);
  } else if (found.tag === 'castle') {
    openCastleModal();
  }
}

canvas.addEventListener('pointerdown', (e) => {
  canvas._ptrDown = { x: e.clientX, y: e.clientY, t: performance.now() };
});

canvas.addEventListener('pointerup', (e) => {
  const down = canvas._ptrDown;
  if (!down) return;
  const dx = e.clientX - down.x;
  const dy = e.clientY - down.y;
  const dt = performance.now() - down.t;
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
  const now = performance.now();

  controls.update();
  updateAsh(dt);
  updateFirePulses();
  updateDragonIdle(now);

  if (dragonMixer) dragonMixer.update(dt);

  const t = now * 0.004;
  torches.forEach((torch, i) => {
    const flicker =
      0.85 +
      0.2 * Math.sin(t * 2.1 + i * 1.7) +
      0.1 * Math.sin(t * 5.3 + i);
    torch.light.intensity = torch.baseIntensity * flicker;
    torch.flame.scale.setScalar(0.85 + 0.25 * flicker);
  });

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
(async function init() {
  placeCastles();
  placeDragons();
  animate();

  // Optional GLTF override for primary only (non-blocking failure)
  await Promise.all([tryPrimaryCastleGLTF(), tryPrimaryDragonGLTF()]);

  controls.target.set(0, 5, -2);
  controls.update();

  if (loadingEl) loadingEl.classList.add('hidden');
})();
