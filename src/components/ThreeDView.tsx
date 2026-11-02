import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState } from '../game/simulation';
import { sound } from '../utils/audio';
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Smartphone,
  Monitor,
  HelpCircle,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Zap,
  Hand,
  ChevronUp,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Crosshair,
} from 'lucide-react';

interface ThreeDViewProps {
  gameState: GameState;
  onUpdateInventory: (itemId: string, amount: number) => void;
  onLogEvent: (textHu: string) => void;
  onSwitchToTab: (tab: 'map' | 'base' | 'companion' | 'escape' | 'ruins' | 'studio') => void;
}

interface InteractiveProp {
  id: string;
  nameHu: string;
  mesh: THREE.Object3D;
  action: () => void;
  type: 'shelter' | 'fire' | 'plane' | 'ruins' | 'item';
}

export const ThreeDView: React.FC<ThreeDViewProps> = ({
  gameState,
  onUpdateInventory,
  onLogEvent,
  onSwitchToTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'tps' | 'fps'>('tps');
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [controlsHelpOpen, setControlsHelpOpen] = useState<boolean>(false);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Partvidék & Sekély Vizek');
  
  // Touch controls overlay toggle (enabled by default on all devices, toggleable)
  const [showTouchControls, setShowTouchControls] = useState<boolean>(true);

  // Virtual keys for touch D-Pad and on-screen controls
  const virtualKeysRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft: boolean;
    turnRight: boolean;
    pitchUp: boolean;
    pitchDown: boolean;
    zoomIn: boolean;
    zoomOut: boolean;
    jump: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
    pitchUp: false,
    pitchDown: false,
    zoomIn: false,
    zoomOut: false,
    jump: false,
    sprint: false,
  });

  const resetCameraRef = useRef<() => void>(() => {});

  // Callbacks ref to avoid rebuilding WebGL scene on state changes
  const callbacksRef = useRef({
    onUpdateInventory,
    onLogEvent,
    onSwitchToTab,
    gameState,
  });
  callbacksRef.current = {
    onUpdateInventory,
    onLogEvent,
    onSwitchToTab,
    gameState,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1926);
    scene.fog = new THREE.FogExp2(0x0c1926, 0.0075);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm sun + Sky hemisphere)
    const hemiLight = new THREE.HemisphereLight(0x52d6ec, 0x1a3826, 0.9);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    sunLight.position.set(60, 100, 40);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x223344, 0.45);
    scene.add(ambientLight);

    // 3. Procedural Island Terrain Generation
    const terrainSize = 300;
    const terrainSegments = 90;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);

      let h = 0;
      if (distFromCenter < 120) {
        const factor = Math.cos((distFromCenter / 120) * (Math.PI / 2));
        h = Math.pow(factor, 1.4) * 28;

        // Northern volcanic mountain
        if (z < -20 && Math.abs(x) < 50) {
          const mDist = Math.sqrt(x * x + (z + 65) * (z + 65));
          if (mDist < 45) {
            h += Math.cos((mDist / 45) * (Math.PI / 2)) * 38;
          }
        }

        // River valley
        const riverPath = Math.sin(z * 0.05) * 12;
        if (Math.abs(x - riverPath) < 7 && z > -30) {
          h -= 4;
        }

        h += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2.2;
      } else {
        h = -8 - (distFromCenter - 120) * 0.15;
      }

      posAttr.setY(i, h);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2e6b3e,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // 4. Animated Ocean Water Surface
    const waterGeo = new THREE.PlaneGeometry(500, 500, 40, 40);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a6677,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.82,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 1.2;
    scene.add(waterMesh);

    // Height function helper
    const getGroundHeight = (x: number, z: number): number => {
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter >= 120) return 0;
      const factor = Math.cos((distFromCenter / 120) * (Math.PI / 2));
      let h = Math.pow(factor, 1.4) * 28;
      if (z < -20 && Math.abs(x) < 50) {
        const mDist = Math.sqrt(x * x + (z + 65) * (z + 65));
        if (mDist < 45) {
          h += Math.cos((mDist / 45) * (Math.PI / 2)) * 38;
        }
      }
      h += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2.2;
      return Math.max(0.5, h);
    };

    const interactables: InteractiveProp[] = [];

    // 5. Stilt Base Shelter & Campfire (Coast: x: 18, z: 75)
    const baseGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4a28, roughness: 0.9 });
    const thatchMat = new THREE.MeshStandardMaterial({ color: 0x99793d, roughness: 0.95 });

    const platform = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 7), woodMat);
    platform.position.y = 2.2;
    baseGroup.add(platform);

    // 4 Stilt Legs
    [-3, 3].forEach((sx) => {
      [-3, 3].forEach((sz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 4.5, 6), woodMat);
        leg.position.set(sx, 0, sz);
        baseGroup.add(leg);
      });
    });

    // Thatch roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 4), thatchMat);
    roof.position.y = 4.8;
    roof.rotateY(Math.PI / 4);
    baseGroup.add(roof);

    baseGroup.position.set(18, getGroundHeight(18, 75), 75);
    scene.add(baseGroup);

    interactables.push({
      id: 'shelter',
      nameHu: 'Cölöpös Bázis Menedék',
      mesh: baseGroup,
      type: 'shelter',
      action: () => callbacksRef.current.onSwitchToTab('base'),
    });

    // Campfire with animated pointlight
    const fireGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.9 });
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35), rockMat);
      rock.position.set(Math.cos(angle) * 1.1, 0.2, Math.sin(angle) * 1.1);
      fireGroup.add(rock);
    }
    const firePointLight = new THREE.PointLight(0xff6a00, 2.6, 18);
    firePointLight.position.set(0, 1.0, 0);
    fireGroup.add(firePointLight);

    fireGroup.position.set(12, getGroundHeight(12, 73), 73);
    scene.add(fireGroup);

    interactables.push({
      id: 'campfire',
      nameHu: 'Túlélő Tábortűz',
      mesh: fireGroup,
      type: 'fire',
      action: () => {
        callbacksRef.current.onUpdateInventory('driftwood', -1);
        callbacksRef.current.onLogEvent('Megraktad a tábortüzet száraz fával (+60 perc meleg).');
        sound.playCraftSuccess();
      },
    });

    // 6. Crashed Twin-Engine Cargo Plane (Jungle: x: -5, z: 12)
    const planeGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x8a9ba8,
      metalness: 0.65,
      roughness: 0.35,
    });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xb83232 });

    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.4, 18, 12), metalMat);
    fuselage.rotateZ(Math.PI / 2);
    fuselage.rotateX(0.18);
    planeGroup.add(fuselage);

    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 2, 12), stripeMat);
    stripe.rotateZ(Math.PI / 2);
    stripe.position.x = 2;
    planeGroup.add(stripe);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.25, 26), metalMat);
    wings.position.set(0, 0.4, 0);
    planeGroup.add(wings);

    // Left Engine Cowling
    const engineGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8);
    engineGeo.rotateZ(Math.PI / 2);
    const engineL = new THREE.Mesh(engineGeo, metalMat);
    engineL.position.set(0, 0.1, -6);
    planeGroup.add(engineL);

    // Tail fin
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4, 0.2), metalMat);
    tailFin.position.set(-8, 2.2, 0);
    planeGroup.add(tailFin);

    planeGroup.position.set(-5, getGroundHeight(-5, 12) + 1.2, 12);
    planeGroup.rotateY(0.6);
    scene.add(planeGroup);

    interactables.push({
      id: 'plane',
      nameHu: 'Lezuhant Teherszállító Repülőgép Roncs',
      mesh: planeGroup,
      type: 'plane',
      action: () => callbacksRef.current.onSwitchToTab('escape'),
    });

    // 7. Ancient Ruins Monolith & Stone Portal (North-East: x: 45, z: -25)
    const ruinsGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x485058, roughness: 0.95 });
    const runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38ef7d,
      emissive: 0x11998e,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(1.8, 9, 1.8), stoneMat);
    pillarL.position.set(-3.5, 4.5, 0);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(1.8, 9, 1.8), stoneMat);
    pillarR.position.set(3.5, 4.5, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 2.2), stoneMat);
    lintel.position.set(0, 9.2, 0);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), runeGlowMat);
    crystal.position.set(0, 5, 0);

    ruinsGroup.add(pillarL, pillarR, lintel, crystal);
    ruinsGroup.position.set(45, getGroundHeight(45, -25), -25);
    scene.add(ruinsGroup);

    interactables.push({
      id: 'ruins',
      nameHu: 'Ősi Romok Misztikus Kőkapuja',
      mesh: ruinsGroup,
      type: 'ruins',
      action: () => callbacksRef.current.onSwitchToTab('ruins'),
    });

    // 8. Palm Trees Scatter
    const palmPositions = [
      { x: 10, z: 65 },
      { x: 26, z: 70 },
      { x: 30, z: 60 },
      { x: 5, z: 50 },
      { x: -15, z: 65 },
      { x: -25, z: 50 },
      { x: 40, z: 45 },
      { x: -8, z: 30 },
      { x: 15, z: 20 },
      { x: -30, z: 20 },
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 6, 6);
    const frondGeo = new THREE.ConeGeometry(3, 1.4, 5);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.85 });

    palmPositions.forEach((p) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 3;
      trunk.rotateZ(0.08);

      const fronds = new THREE.Mesh(frondGeo, leafMat);
      fronds.position.y = 6;
      tree.add(trunk, fronds);

      tree.position.set(p.x, getGroundHeight(p.x, p.z), p.z);
      scene.add(tree);
    });

    // 9. Collectible Driftwood Logs on Beach
    const driftwoodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const logGeo = new THREE.CylinderGeometry(0.2, 0.22, 2.5, 6);
    logGeo.rotateZ(Math.PI / 2);

    [
      { x: 12, z: 70 },
      { x: 32, z: 80 },
      { x: -10, z: 85 },
      { x: 5, z: 92 },
    ].forEach((pos, idx) => {
      const log = new THREE.Mesh(logGeo, driftwoodMat);
      log.position.set(pos.x, getGroundHeight(pos.x, pos.z) + 0.3, pos.z);
      scene.add(log);
      interactables.push({
        id: `wood-${idx}`,
        nameHu: 'Uszadékfa rönk',
        mesh: log,
        type: 'item',
        action: () => {
          sound.playCraftSuccess();
          callbacksRef.current.onUpdateInventory('driftwood', 3);
          callbacksRef.current.onLogEvent('Uszadékfa rönköt gyűjtöttél a tengerparti homokból (+3 Fa).');
          log.position.y = -100;
        },
      });
    });

    // 10. Companion (Maya Vance) 3D Avatar
    const companionGroup = new THREE.Group();
    const compMat = new THREE.MeshStandardMaterial({ color: 0x00b4d8 });
    const compHeadMat = new THREE.MeshStandardMaterial({ color: 0xffd166 });
    const compBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.2, 4, 8), compMat);
    compBody.position.y = 1.1;
    const compHead = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), compHeadMat);
    compHead.position.y = 2.1;
    companionGroup.add(compBody, compHead);
    companionGroup.position.set(16, getGroundHeight(16, 73), 73);
    scene.add(companionGroup);

    // 11. PLAYER 3D AVATAR (Survivor Character)
    const playerGroup = new THREE.Group();
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2e5c54, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x20150f, roughness: 0.9 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0x7a4920, roughness: 0.8 });

    const playerTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.32, 0.75, 8), shirtMat);
    playerTorso.position.y = 1.1;

    const playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), skinMat);
    playerHead.position.y = 1.7;

    const playerHair = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 6), hairMat);
    playerHair.position.set(0, 1.88, -0.05);
    playerHair.rotateX(0.2);

    const playerBackpack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.22), packMat);
    playerBackpack.position.set(0, 1.15, 0.26);

    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75, 6), pantsMat);
    leftLeg.position.set(-0.16, 0.45, 0);
    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.75, 6), pantsMat);
    rightLeg.position.set(0.16, 0.45, 0);

    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 6), shirtMat);
    leftArm.position.set(-0.45, 1.1, 0);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.65, 6), shirtMat);
    rightArm.position.set(0.45, 1.1, 0);

    playerGroup.add(playerTorso, playerHead, playerHair, playerBackpack, leftLeg, rightLeg, leftArm, rightArm);
    scene.add(playerGroup);

    // Camera Orbit State (horizontal yaw, vertical pitch, distance)
    const cam = {
      yaw: 0, // radians around character
      pitch: 0.35, // elevation angle (~20 degrees downward perspective)
      distance: 5.5, // distance to character
    };

    // Player position and character orientation state
    const player = {
      pos: new THREE.Vector3(15, getGroundHeight(15, 76) + 1.8, 76),
      velocity: new THREE.Vector3(),
      charYaw: 0, // direction the survivor character model faces
      isGrounded: true,
      speed: 13,
    };

    resetCameraRef.current = () => {
      cam.yaw = player.charYaw + Math.PI;
      cam.pitch = 0.35;
      cam.distance = 5.5;
    };

    // 12. Input Listeners (Keyboard + Mouse + Touch)
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyV') {
        setCameraMode((m) => (m === 'tps' ? 'fps' : 'tps'));
        sound.playClick();
      }
      if (e.code === 'KeyE') {
        if (nearestPropRef.current) {
          nearestPropRef.current.action();
        }
      }
      if (e.code === 'KeyR' || e.code === 'Numpad5') {
        resetCameraRef.current();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Desktop mouse look: supports both click-and-drag and pointer lock
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        cam.yaw -= e.movementX * 0.003;
        cam.pitch = Math.max(-0.35, Math.min(1.3, cam.pitch + e.movementY * 0.003));
      } else if (isMouseDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        cam.yaw -= dx * 0.0055;
        cam.pitch = Math.max(-0.35, Math.min(1.3, cam.pitch + dy * 0.0055));
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cam.distance = Math.max(2.5, Math.min(15, cam.distance + e.deltaY * 0.006));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });

    const onContainerClick = (e: MouseEvent) => {
      if (e.detail === 2 && document.pointerLockElement !== container && window.innerWidth > 900) {
        container.requestPointerLock?.();
      }
    };
    container.addEventListener('click', onContainerClick);

    // Touch look handling on canvas
    let touchLook = { x: 0, y: 0, active: false, id: -1 };
    let initialPinchDist = 0;
    let initialCamDist = 5.5;

    const onCanvasTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.hypot(dx, dy);
        initialCamDist = cam.distance;
        return;
      }

      const rect = container.getBoundingClientRect();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const relX = t.clientX - rect.left;
        const relY = t.clientY - rect.top;
        // Swipe on upper half or right 65% of screen rotates camera
        if ((relX > rect.width * 0.35 || relY < rect.height * 0.5) && !touchLook.active) {
          touchLook = { x: t.clientX, y: t.clientY, active: true, id: t.identifier };
          break;
        }
      }
    };

    const onCanvasTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = initialPinchDist / Math.max(dist, 10);
        cam.distance = Math.max(2.5, Math.min(15, initialCamDist * factor));
        e.preventDefault();
        return;
      }

      if (!touchLook.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === touchLook.id) {
          const dx = t.clientX - touchLook.x;
          const dy = t.clientY - touchLook.y;
          touchLook.x = t.clientX;
          touchLook.y = t.clientY;

          // Horizontal swipe orbits 360 degrees around survivor
          cam.yaw -= dx * 0.007;
          // Vertical swipe tilts pitch up / down
          cam.pitch = Math.max(-0.35, Math.min(1.3, cam.pitch + dy * 0.007));
          e.preventDefault();
          break;
        }
      }
    };

    const onCanvasTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist = 0;
      }
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchLook.id) {
          touchLook.active = false;
          touchLook.id = -1;
          break;
        }
      }
    };

    container.addEventListener('touchstart', onCanvasTouchStart, { passive: false });
    container.addEventListener('touchmove', onCanvasTouchMove, { passive: false });
    container.addEventListener('touchend', onCanvasTouchEnd);
    container.addEventListener('touchcancel', onCanvasTouchEnd);

    // 13. Main 3D Animation Loop
    let lastTime = performance.now();
    let animId: number;
    const nearestPropRef: { current: InteractiveProp | null } = { current: null };

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Animate water & campfire flicker
      waterMat.opacity = 0.8 + Math.sin(time * 0.002) * 0.06;
      firePointLight.intensity = 2.2 + Math.sin(time * 0.02) * 0.5 + Math.cos(time * 0.035) * 0.3;

      // Companion bob
      companionGroup.position.y = getGroundHeight(companionGroup.position.x, companionGroup.position.z) + Math.sin(time * 0.003) * 0.08;

      // Crystal spin
      crystal.rotation.y = time * 0.001;
      crystal.rotation.x = Math.sin(time * 0.0015) * 0.3;

      // Process input movement vector
      const moveVec = new THREE.Vector3();
      const vKeys = virtualKeysRef.current;
      const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'] || vKeys.sprint;
      const currentSpeed = isSprinting ? player.speed * 1.55 : player.speed;

      // Movement keys (WASD + Touch D-Pad)
      if (keys['KeyW'] || vKeys.forward) moveVec.z -= 1;
      if (keys['KeyS'] || vKeys.backward) moveVec.z += 1;
      if (keys['KeyA'] || vKeys.left) moveVec.x -= 1;
      if (keys['KeyD'] || vKeys.right) moveVec.x += 1;

      // Camera Orbit Keys (Arrow keys + IJKL + Touch HUD Buttons)
      if (keys['ArrowLeft'] || keys['KeyJ'] || vKeys.turnLeft) {
        cam.yaw += 2.4 * dt;
      }
      if (keys['ArrowRight'] || keys['KeyL'] || vKeys.turnRight) {
        cam.yaw -= 2.4 * dt;
      }
      if (keys['ArrowUp'] || keys['KeyI'] || vKeys.pitchUp) {
        cam.pitch = Math.min(1.3, cam.pitch + 1.8 * dt);
      }
      if (keys['ArrowDown'] || keys['KeyK'] || vKeys.pitchDown) {
        cam.pitch = Math.max(-0.35, cam.pitch - 1.8 * dt);
      }
      if (vKeys.zoomIn || keys['NumpadAdd']) {
        cam.distance = Math.max(2.5, cam.distance - 6.0 * dt);
      }
      if (vKeys.zoomOut || keys['NumpadSubtract']) {
        cam.distance = Math.min(15, cam.distance + 6.0 * dt);
      }

      const isMoving = moveVec.lengthSq() > 0.001;

      if (isMoving) {
        moveVec.normalize();
        // Camera-relative movement vectors on horizontal ground plane
        const camForward = new THREE.Vector3(-Math.sin(cam.yaw), 0, -Math.cos(cam.yaw));
        const camRight = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));

        const delta = camForward.multiplyScalar(-moveVec.z).add(camRight.multiplyScalar(moveVec.x));
        delta.normalize();

        player.pos.addScaledVector(delta, currentSpeed * dt);

        // Smoothly rotate character to face movement direction
        const targetCharYaw = Math.atan2(-delta.x, -delta.z);
        let diff = targetCharYaw - player.charYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.charYaw += diff * Math.min(1, 14 * dt);
      }

      // Jump
      if ((keys['Space'] || vKeys.jump) && player.isGrounded) {
        player.velocity.y = 8.5;
        player.isGrounded = false;
        sound.playClick();
      }

      // Gravity & Ground snap
      player.velocity.y -= 22 * dt;
      player.pos.y += player.velocity.y * dt;

      const gHeight = getGroundHeight(player.pos.x, player.pos.z) + 1.8;
      if (player.pos.y <= gHeight) {
        player.pos.y = gHeight;
        player.velocity.y = 0;
        player.isGrounded = true;
      }

      // Boundary: keep within island/reef perimeter
      const pDist = Math.sqrt(player.pos.x * player.pos.x + player.pos.z * player.pos.z);
      if (pDist > 140) {
        player.pos.setLength(140);
        sound.playDangerWarning();
      }

      // Update Survivor 3D Character Model (independent facing)
      playerGroup.position.set(player.pos.x, player.pos.y - 1.8, player.pos.z);
      playerGroup.rotation.y = player.charYaw;
      playerGroup.visible = cameraMode === 'tps';

      // Limb swing walking animation
      if (isMoving) {
        const walkCycle = time * 0.012 * (isSprinting ? 1.6 : 1.1);
        leftLeg.rotation.x = Math.sin(walkCycle) * 0.55;
        rightLeg.rotation.x = -Math.sin(walkCycle) * 0.55;
        leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
        rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
        playerTorso.position.y = 1.1 + Math.abs(Math.sin(walkCycle)) * 0.05;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
        playerTorso.position.y = 1.1;
      }

      // Detect active zone by coordinates
      if (player.pos.z < -30 && Math.abs(player.pos.x) < 55) {
        setCurrentZoneName('Kihűlt Vulkán (Északi Magaslat)');
      } else if (player.pos.x > 35 && player.pos.z < -20) {
        setCurrentZoneName('Ősi Romok & Templom');
      } else if (player.pos.x > 35 && player.pos.z > 30) {
        setCurrentZoneName('Mocsárvidék & Iszapmező');
      } else if (Math.abs(player.pos.z) < 35 && Math.abs(player.pos.x) < 45) {
        setCurrentZoneName('Trópusi Esőerdő & Repülőgép Roncs');
      } else {
        setCurrentZoneName('Partvidék & Sekély Vizek');
      }

      // Check proximity to interactables
      let closest: InteractiveProp | null = null;
      let closestDist = 5.0;
      for (const item of interactables) {
        const d = player.pos.distanceTo(item.mesh.position);
        if (d < closestDist) {
          closest = item;
          closestDist = d;
        }
      }

      // Proximity to Companion
      const distToComp = player.pos.distanceTo(companionGroup.position);
      if (distToComp < 4.5) {
        setInteractionPrompt(`Beszélj Maya Vance-szel [🖐️ Gyűjtés / E]`);
        nearestPropRef.current = {
          id: 'companion',
          nameHu: 'Maya Vance',
          mesh: companionGroup,
          type: 'item',
          action: () => callbacksRef.current.onSwitchToTab('companion'),
        };
      } else if (closest) {
        setInteractionPrompt(`Interakció: ${closest.nameHu} [🖐️ Gyűjtés / E]`);
        nearestPropRef.current = closest;
      } else {
        setInteractionPrompt(null);
        nearestPropRef.current = null;
      }

      // Camera positioning (FPS vs True 360° TPS Orbit)
      if (cameraMode === 'fps') {
        camera.position.set(player.pos.x, player.pos.y + 0.35, player.pos.z);
        camera.rotation.set(-cam.pitch, cam.yaw + Math.PI, 0, 'YXZ');
      } else {
        // Third-Person Spherical Orbit Camera: 360° Horizontal Orbit & Vertical Pitch
        const lookTarget = player.pos.clone().add(new THREE.Vector3(0, 1.1, 0));
        const clPitch = Math.max(-0.35, Math.min(1.3, cam.pitch));
        const horizDist = cam.distance * Math.cos(clPitch);
        const cx = lookTarget.x + horizDist * Math.sin(cam.yaw);
        const cy = lookTarget.y + cam.distance * Math.sin(clPitch);
        const cz = lookTarget.z + horizDist * Math.cos(cam.yaw);

        // Ground clearance check to prevent clipping through terrain
        const groundHeight = getGroundHeight(cx, cz) + 0.45;
        const camY = Math.max(cy, groundHeight);

        camera.position.set(cx, camY, cz);
        camera.lookAt(lookTarget);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // Handle Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onContainerClick);
      container.removeEventListener('touchstart', onCanvasTouchStart);
      container.removeEventListener('touchmove', onCanvasTouchMove);
      container.removeEventListener('touchend', onCanvasTouchEnd);
      container.removeEventListener('touchcancel', onCanvasTouchEnd);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraMode]);

  // Touch button action trigger
  const handleTriggerAction = () => {
    sound.playClick();
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-slate-950 border border-emerald-900/60 shadow-2xl flex flex-col select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : 'aspect-[16/10] min-h-[540px]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top 3D Status Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 border border-emerald-800/80 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto backdrop-blur shadow-lg">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span className="text-xs font-bold text-stone-100">{currentZoneName}</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 hidden sm:inline">
            3D WebGL
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Toggle Touch Controls button */}
          <button
            onClick={() => setShowTouchControls(!showTouchControls)}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow ${
              showTouchControls
                ? 'bg-emerald-700 border-emerald-500 text-white'
                : 'bg-slate-900/90 hover:bg-slate-800 border-stone-700 text-stone-300'
            }`}
            title="Érintővezérlő gombok megjelenítése / elrejtése"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Vezérlő</span>
          </button>

          {/* Controls Help button */}
          <button
            onClick={() => setControlsHelpOpen(true)}
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
            title="Irányítási Útmutató"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Súgó</span>
          </button>

          {/* Camera TPS/FPS toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setCameraMode(cameraMode === 'tps' ? 'fps' : 'tps');
            }}
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>{cameraMode === 'tps' ? 'TPS' : 'FPS'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
            title={isFullscreen ? 'Kilépés a teljes képernyőből' : 'Teljes képernyő'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Proximity Interaction Prompt */}
      {interactionPrompt && (
        <div
          onClick={handleTriggerAction}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-emerald-500 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2.5 animate-bounce pointer-events-auto cursor-pointer active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white tracking-wide">{interactionPrompt}</span>
        </div>
      )}

      {/* ON-SCREEN TACTILE MOBILE CONTROLLER HUD */}
      {showTouchControls && (
        <div className="absolute inset-x-0 bottom-2 px-3 flex items-end justify-between pointer-events-none">
          {/* Left Side: Tactile Directional D-Pad */}
          <div className="pointer-events-auto flex flex-col items-center select-none touch-none">
            {/* Forward button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeysRef.current.forward = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                virtualKeysRef.current.forward = false;
              }}
              onPointerLeave={() => {
                virtualKeysRef.current.forward = false;
              }}
              className="w-14 h-14 bg-slate-900/90 active:bg-emerald-600 border-2 border-emerald-500/70 rounded-xl shadow-lg flex items-center justify-center text-emerald-300 active:text-white active:scale-95 transition"
            >
              <ArrowUp className="w-7 h-7" />
            </button>

            <div className="flex items-center gap-1.5 my-1.5">
              {/* Left button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.left = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.left = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.left = false;
                }}
                className="w-14 h-14 bg-slate-900/90 active:bg-emerald-600 border-2 border-emerald-500/70 rounded-xl shadow-lg flex items-center justify-center text-emerald-300 active:text-white active:scale-95 transition"
              >
                <ArrowLeft className="w-7 h-7" />
              </button>

              {/* Sprint / Turbo Center Button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.sprint = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.sprint = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.sprint = false;
                }}
                className="w-12 h-12 bg-amber-950/80 active:bg-amber-500 border-2 border-amber-500/80 rounded-xl shadow-lg flex items-center justify-center text-amber-400 active:text-slate-950 active:scale-95 transition"
                title="Sprint / Futás"
              >
                <Zap className="w-5 h-5" />
              </button>

              {/* Right button */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.right = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.right = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.right = false;
                }}
                className="w-14 h-14 bg-slate-900/90 active:bg-emerald-600 border-2 border-emerald-500/70 rounded-xl shadow-lg flex items-center justify-center text-emerald-300 active:text-white active:scale-95 transition"
              >
                <ArrowRight className="w-7 h-7" />
              </button>
            </div>

            {/* Backward button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                virtualKeysRef.current.backward = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                virtualKeysRef.current.backward = false;
              }}
              onPointerLeave={() => {
                virtualKeysRef.current.backward = false;
              }}
              className="w-14 h-14 bg-slate-900/90 active:bg-emerald-600 border-2 border-emerald-500/70 rounded-xl shadow-lg flex items-center justify-center text-emerald-300 active:text-white active:scale-95 transition"
            >
              <ArrowDown className="w-7 h-7" />
            </button>
          </div>

          {/* Right Side: Camera Orbit Cluster & Tactical Action Buttons */}
          <div className="pointer-events-auto flex flex-col items-end gap-2.5 select-none touch-none">
            {/* Camera Orbit Control Cluster (360° Turn, Pitch Up/Down, Zoom, Center) */}
            <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-2 shadow-2xl flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-between w-full px-1 text-[10px] font-bold text-cyan-400">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> KAMERA</span>
                <button
                  onClick={() => resetCameraRef.current()}
                  className="px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/40 text-[9px] active:scale-90 transition"
                  title="Kamera visszaállítása a karakter mögé"
                >
                  Közép
                </button>
              </div>

              {/* Pitch Up (Döntés fel / madártávlat) */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.pitchUp = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.pitchUp = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.pitchUp = false;
                }}
                className="w-11 h-9 bg-slate-900/90 active:bg-cyan-600 border border-cyan-500/60 rounded-lg flex items-center justify-center text-cyan-300 active:text-white transition shadow"
                title="Kamera döntés fel (Madártávlat)"
              >
                <ArrowUp className="w-5 h-5" />
              </button>

              {/* Horizontal Turn & Zoom Row */}
              <div className="flex items-center gap-1.5">
                {/* Turn Left */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    virtualKeysRef.current.turnLeft = true;
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    virtualKeysRef.current.turnLeft = false;
                  }}
                  onPointerLeave={() => {
                    virtualKeysRef.current.turnLeft = false;
                  }}
                  className="w-11 h-10 bg-slate-900/90 active:bg-cyan-600 border border-cyan-500/60 rounded-lg flex items-center justify-center text-cyan-300 active:text-white transition shadow"
                  title="Kamera forgatás balra (360°)"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                {/* Zoom In / Out Buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      virtualKeysRef.current.zoomIn = true;
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      virtualKeysRef.current.zoomIn = false;
                    }}
                    onPointerLeave={() => {
                      virtualKeysRef.current.zoomIn = false;
                    }}
                    className="w-8 h-4.5 bg-slate-900 active:bg-cyan-600 border border-cyan-500/40 rounded flex items-center justify-center text-cyan-200 text-[10px] font-bold"
                    title="Kamera közelítés"
                  >
                    +
                  </button>
                  <button
                    onPointerDown={(e) => {
                      e.preventDefault();
                      virtualKeysRef.current.zoomOut = true;
                    }}
                    onPointerUp={(e) => {
                      e.preventDefault();
                      virtualKeysRef.current.zoomOut = false;
                    }}
                    onPointerLeave={() => {
                      virtualKeysRef.current.zoomOut = false;
                    }}
                    className="w-8 h-4.5 bg-slate-900 active:bg-cyan-600 border border-cyan-500/40 rounded flex items-center justify-center text-cyan-200 text-[10px] font-bold"
                    title="Kamera távolítás"
                  >
                    -
                  </button>
                </div>

                {/* Turn Right */}
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    virtualKeysRef.current.turnRight = true;
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    virtualKeysRef.current.turnRight = false;
                  }}
                  onPointerLeave={() => {
                    virtualKeysRef.current.turnRight = false;
                  }}
                  className="w-11 h-10 bg-slate-900/90 active:bg-cyan-600 border border-cyan-500/60 rounded-lg flex items-center justify-center text-cyan-300 active:text-white transition shadow"
                  title="Kamera forgatás jobbra (360°)"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>

              {/* Pitch Down (Döntés le / alsó nézet) */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.pitchDown = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.pitchDown = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.pitchDown = false;
                }}
                className="w-11 h-9 bg-slate-900/90 active:bg-cyan-600 border border-cyan-500/60 rounded-lg flex items-center justify-center text-cyan-300 active:text-white transition shadow"
                title="Kamera döntés le (Földi perspektíva)"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>

            {/* Action Buttons: Jump + Collect */}
            <div className="flex items-center gap-2">
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.jump = true;
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  virtualKeysRef.current.jump = false;
                }}
                onPointerLeave={() => {
                  virtualKeysRef.current.jump = false;
                }}
                className="w-14 h-14 bg-sky-950/90 active:bg-sky-500 border-2 border-sky-400 rounded-2xl shadow-xl flex flex-col items-center justify-center text-xs font-bold text-sky-200 active:text-slate-950 active:scale-95 transition"
              >
                <ChevronUp className="w-5 h-5" />
                <span className="text-[9px] font-bold">UGRÁS</span>
              </button>

              <button
                onClick={handleTriggerAction}
                className="w-16 h-16 bg-emerald-600 active:bg-emerald-400 border-2 border-emerald-300 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-white active:scale-90 transition"
              >
                <Hand className="w-6 h-6 mb-0.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Gyűjtés</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Helper overlay at bottom */}
      <div className="hidden lg:flex absolute bottom-3 left-4 bg-slate-900/85 border border-stone-800 rounded-lg px-3 py-1.5 items-center gap-4 text-[11px] text-stone-300 font-mono pointer-events-none shadow-lg">
        <span>WASD: Mozgás</span>
        <span>Nyilak / IJKL: Kamera 360° & Döntés</span>
        <span>Egér húzás / Görgő: Nézelődés & Zoom</span>
        <span>Szóköz: Ugrás</span>
        <span>E: Gyűjtés</span>
        <span>R: Kamera közép</span>
        <span>V: TPS/FPS</span>
      </div>

      {/* Controls Help Modal */}
      {controlsHelpOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setControlsHelpOpen(false)}
        >
          <div
            className="bg-slate-900 border border-emerald-500/60 rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <span>3D Irányítási Útmutató</span>
              </h3>
              <button
                onClick={() => setControlsHelpOpen(false)}
                className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300">
              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Mobiltelefon / Érintőképernyő:</strong>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    • <strong>Bal oldali D-Pad (⬆️ ⬇️ ⬅️ ➡️)</strong>: Karakter valós mozgása a szigeten a kamera irányához viszonyítva.<br />
                    • <strong>⚡ Villám gomb</strong>: Sprint / Gyors futás.<br />
                    • <strong>Jobb oldali KAMERA vezérlő</strong>: 360° körbeforgatás (↺ / ↻), fel/le döntés (⬆️ / ⬇️), zoom (+ / -) és Közép reset.<br />
                    • <strong>Érintőképernyős húzás</strong>: A képernyőn bárhol szabad ujjhúzással is körbeforgatható és fel-le dönthető a kamera! Kétujjas csípéssel zoomolható.
                  </p>
                </div>
              </div>

              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center gap-3">
                <Monitor className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Windows / Asztali PC:</strong>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    • <strong>W, A, S, D</strong>: Karakter mozgás | <strong>Shift</strong>: Futás<br />
                    • <strong>Egér bal gomb húzás / Pointer Lock</strong>: 360° szabad körbeforgatás és fel-le nézés.<br />
                    • <strong>Egérgörgő</strong>: Kamera távolság zoomolása.<br />
                    • <strong>Nyílbillentyűk vagy I, J, K, L</strong>: Kamera körbeforgatás és fel/le döntés billentyűzetről.<br />
                    • <strong>Szóköz</strong>: Ugrás | <strong>E</strong>: Gyűjtés / Beszélgetés | <strong>R</strong>: Kamera visszaállítása a karakter mögé.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setControlsHelpOpen(false)}
              className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition"
            >
              Értem, vissza a túléléshez
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
