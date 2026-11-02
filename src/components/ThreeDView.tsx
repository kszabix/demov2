import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameState, ZoneId } from '../game/simulation';
import { sound } from '../utils/audio';
import {
  Compass,
  Eye,
  Maximize2,
  Minimize2,
  Footprints,
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  HelpCircle,
  X,
} from 'lucide-react';

interface ThreeDViewProps {
  gameState: GameState;
  onUpdateInventory: (itemId: string, amount: number) => void;
  onLogEvent: (textHu: string) => void;
  onSwitchToTab: (tab: 'map' | 'base' | 'companion' | 'escape' | 'ruins' | 'studio') => void;
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
  const [currentZoneName, setCurrentZoneName] = useState<string>('Partvidék (Tengerpart)');

  // Touch joystick states for mobile phones
  const joystickRef = useRef<{
    active: boolean;
    touchId: number | null;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
  }>({
    active: false,
    touchId: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
  });

  const touchLookRef = useRef<{
    active: boolean;
    touchId: number | null;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    touchId: null,
    lastX: 0,
    lastY: 0,
  });

  // Callbacks ref to avoid rebuilding WebGL scene on prop change
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
    scene.fog = new THREE.FogExp2(0x0c1926, 0.008);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      800
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm sun + Cool sky hemisphere)
    const hemiLight = new THREE.HemisphereLight(0x4dc5d8, 0x1a3826, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    sunLight.position.set(60, 100, 40);
    scene.add(sunLight);

    // Ambient night/day tinting
    const ambientLight = new THREE.AmbientLight(0x223344, 0.4);
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

      // Island height calculation
      let h = 0;
      if (distFromCenter < 120) {
        // Island landmass dome
        const factor = Math.cos((distFromCenter / 120) * (Math.PI / 2));
        h = Math.pow(factor, 1.4) * 28;

        // Mountain / Volcano peak in North (z < -30)
        if (z < -20 && Math.abs(x) < 50) {
          const mDist = Math.sqrt(x * x + (z + 65) * (z + 65));
          if (mDist < 45) {
            h += Math.cos((mDist / 45) * (Math.PI / 2)) * 38;
          }
        }

        // River carving
        const riverPath = Math.sin(z * 0.05) * 12;
        if (Math.abs(x - riverPath) < 7 && z > -30) {
          h -= 4;
        }

        // Natural noise ripples
        h += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2.2;
      } else {
        // Deep underwater shelf
        h = -8 - (distFromCenter - 120) * 0.15;
      }

      posAttr.setY(i, h);
    }
    terrainGeo.computeVertexNormals();

    // Terrain material with vertex colors / biomes
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2e6b3e, // tropical grass green
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

    // Function to calculate ground height at any (x, z)
    const getGroundHeight = (x: number, z: number): number => {
      const dist = Math.sqrt(x * x + z * z);
      if (dist > 120) return -2;
      let h = Math.pow(Math.cos((dist / 120) * (Math.PI / 2)), 1.4) * 28;
      if (z < -20 && Math.abs(x) < 50) {
        const mDist = Math.sqrt(x * x + (z + 65) * (z + 65));
        if (mDist < 45) h += Math.cos((mDist / 45) * (Math.PI / 2)) * 38;
      }
      return h;
    };

    // 5. Stilt Base Camp on the Beach (x: 20, z: 75)
    const baseGroup = new THREE.Group();
    baseGroup.position.set(20, getGroundHeight(20, 75), 75);

    // Stilt legs
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.8 });
    const legGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
    [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(lx, 2.5, lz);
      baseGroup.add(leg);
    });

    // Floor deck
    const deckGeo = new THREE.BoxGeometry(8, 0.4, 8);
    const deck = new THREE.Mesh(deckGeo, woodMat);
    deck.position.y = 4.8;
    baseGroup.add(deck);

    // Thatched Roof
    const roofGeo = new THREE.ConeGeometry(6, 3.5, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xa88434, roughness: 0.9 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 8;
    baseGroup.add(roof);

    // Campfire with point light
    const firePointLight = new THREE.PointLight(0xff8822, 2.5, 25);
    firePointLight.position.set(6, 1.2, 0);
    baseGroup.add(firePointLight);

    const firePitGeo = new THREE.DodecahedronGeometry(0.8);
    const firePitMat = new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff3300, emissiveIntensity: 0.8 });
    const firePit = new THREE.Mesh(firePitGeo, firePitMat);
    firePit.position.set(6, 0.5, 0);
    baseGroup.add(firePit);

    scene.add(baseGroup);

    // 6. Crashed Airplane in Tropical Rainforest (x: -25, z: 0)
    const planeGroup = new THREE.Group();
    const planeY = getGroundHeight(-25, 0);
    planeGroup.position.set(-25, planeY + 2, 0);
    planeGroup.rotation.set(0.15, 0.8, -0.2); // Tilted crash angle

    const aluminumMat = new THREE.MeshStandardMaterial({
      color: 0x9fa8a3,
      metalness: 0.65,
      roughness: 0.35,
    });
    // Fuselage
    const fuselageGeo = new THREE.CylinderGeometry(2.4, 2.1, 24, 12);
    fuselageGeo.rotateZ(Math.PI / 2);
    const fuselage = new THREE.Mesh(fuselageGeo, aluminumMat);
    planeGroup.add(fuselage);

    // Wings
    const wingGeo = new THREE.BoxGeometry(28, 0.4, 4.5);
    const wings = new THREE.Mesh(wingGeo, aluminumMat);
    wings.position.set(0, 0.5, 0);
    planeGroup.add(wings);

    // Broken tail fin
    const tailGeo = new THREE.BoxGeometry(1, 6, 4);
    const tail = new THREE.Mesh(tailGeo, aluminumMat);
    tail.position.set(-10, 3, 0);
    tail.rotation.z = -0.3;
    planeGroup.add(tail);

    scene.add(planeGroup);

    // 7. Ancient Ruins Pillars & Portal (x: 45, z: -40)
    const ruinsGroup = new THREE.Group();
    const ruinsY = getGroundHeight(45, -40);
    ruinsGroup.position.set(45, ruinsY, -40);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x3d434d, roughness: 0.9 });
    const runeMat = new THREE.MeshStandardMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.9 });
    const pillarGeo = new THREE.BoxGeometry(2.5, 14, 2.5);

    [[-6, 0], [6, 0], [-6, -10], [6, -10]].forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(pillarGeo, stoneMat);
      pillar.position.set(px, 7, pz);
      ruinsGroup.add(pillar);

      // Glowing crystal band
      const bandGeo = new THREE.BoxGeometry(2.7, 1, 2.7);
      const band = new THREE.Mesh(bandGeo, runeMat);
      band.position.set(px, 9, pz);
      ruinsGroup.add(band);
    });

    // Lintels
    const lintelGeo = new THREE.BoxGeometry(16, 2, 3);
    const lintel = new THREE.Mesh(lintelGeo, stoneMat);
    lintel.position.set(0, 14.5, 0);
    ruinsGroup.add(lintel);

    scene.add(ruinsGroup);

    // 8. Procedural Palm Trees & Foliage
    const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a37, roughness: 0.6, side: THREE.DoubleSide });

    const createPalm = (x: number, z: number, scale = 1) => {
      const pY = getGroundHeight(x, z);
      if (pY < 1.5) return; // don't spawn deep in ocean
      const tree = new THREE.Group();
      tree.position.set(x, pY, z);
      tree.scale.setScalar(scale);

      // Trunk with gentle curve
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 9, 6);
      trunkGeo.translate(0, 4.5, 0);
      const trunk = new THREE.Mesh(trunkGeo, palmTrunkMat);
      trunk.rotation.z = (Math.random() - 0.5) * 0.25;
      tree.add(trunk);

      // Leaves
      const leafGeo = new THREE.ConeGeometry(4.5, 1.2, 5);
      leafGeo.rotateX(Math.PI);
      const leaves = new THREE.Mesh(leafGeo, palmLeafMat);
      leaves.position.set(0, 9.5, 0);
      tree.add(leaves);

      scene.add(tree);
    };

    // Cluster palms along coastline and around jungle
    for (let i = 0; i < 45; i++) {
      const angle = (i / 45) * Math.PI * 2;
      const radius = 65 + (Math.sin(i * 3) * 20);
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;
      createPalm(px, pz, 0.8 + Math.random() * 0.5);
    }

    // 9. Interactive Pickup Objects in 3D
    interface InteractiveProp {
      id: string;
      nameHu: string;
      mesh: THREE.Mesh;
      type: 'item' | 'station';
      action: () => void;
    }
    const interactables: InteractiveProp[] = [];

    // Driftwood pickups on the beach
    const driftwoodMat = new THREE.MeshStandardMaterial({ color: 0x735c49, roughness: 0.85 });
    const logGeo = new THREE.CylinderGeometry(0.25, 0.3, 3, 5);
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
          log.position.y = -100; // hide
        },
      });
    });

    // 10. Player Avatar and Companion (Maya Vance) in 3D
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

    // Player initial position (near beach shelter)
    const player = {
      pos: new THREE.Vector3(15, getGroundHeight(15, 76) + 1.6, 76),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: 0,
      isGrounded: true,
      speed: 12,
    };

    // 11. Controls & Input Listeners (Keyboard + Mouse + Touch)
    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyV') {
        setCameraMode((m) => (m === 'tps' ? 'fps' : 'tps'));
        sound.playClick();
      }
      if (e.code === 'KeyE') {
        // Trigger current interactive prop
        if (nearestPropRef.current) {
          nearestPropRef.current.action();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Pointer lock / mouse look for desktop
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        player.yaw -= e.movementX * 0.0025;
        player.pitch = Math.max(-1.1, Math.min(1.1, player.pitch - e.movementY * 0.0025));
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    const onContainerClick = () => {
      if (document.pointerLockElement !== container && window.innerWidth > 768) {
        container.requestPointerLock?.();
      }
    };
    container.addEventListener('click', onContainerClick);

    // 12. Main 3D Animation Loop
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

      // Companion movement animation
      companionGroup.position.y = getGroundHeight(companionGroup.position.x, companionGroup.position.z) + Math.sin(time * 0.003) * 0.1;

      // Process input movement vector
      const moveVec = new THREE.Vector3();

      // Keyboard input
      if (keys['KeyW'] || keys['ArrowUp']) moveVec.z -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveVec.z += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveVec.x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveVec.x += 1;

      // Touch joystick input
      if (joystickRef.current.active) {
        moveVec.x += joystickRef.current.deltaX;
        moveVec.z += joystickRef.current.deltaY;
      }

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        // Rotate move vector by player yaw
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), player.yaw);

        const delta = forward.multiplyScalar(-moveVec.z).add(right.multiplyScalar(moveVec.x));
        player.pos.addScaledVector(delta, player.speed * dt);
      }

      // Jump
      if (keys['Space'] && player.isGrounded) {
        player.velocity.y = 8;
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
      let closestDist = 4.5;
      for (const item of interactables) {
        const d = player.pos.distanceTo(item.mesh.position);
        if (d < closestDist) {
          closest = item;
          closestDist = d;
        }
      }

      // Proximity to Companion
      const distToComp = player.pos.distanceTo(companionGroup.position);
      if (distToComp < 4) {
        setInteractionPrompt(`Beszélj Maya Vance-szel [E gomb / Érintés]`);
      } else if (closest) {
        setInteractionPrompt(`Gyűjtés: ${closest.nameHu} [E gomb / Érintés]`);
        nearestPropRef.current = closest;
      } else {
        setInteractionPrompt(null);
        nearestPropRef.current = null;
      }

      // Camera positioning (FPS vs TPS)
      if (cameraMode === 'fps') {
        camera.position.copy(player.pos);
        camera.rotation.set(player.pitch, player.yaw, 0, 'YXZ');
      } else {
        // Third-Person Follow Camera
        const camOffset = new THREE.Vector3(0, 2.2, 5.5).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          player.yaw
        );
        camera.position.copy(player.pos).add(camOffset);
        const lookTarget = player.pos.clone().add(new THREE.Vector3(0, 1.2, 0));
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
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onContainerClick);
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

  // Touch handlers for mobile joystick (Left Screen)
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    joystickRef.current = {
      active: true,
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
    };
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current.active) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystickRef.current.touchId) {
        const dx = (t.clientX - joystickRef.current.startX) / 40;
        const dy = (t.clientY - joystickRef.current.startY) / 40;
        joystickRef.current.deltaX = Math.max(-1, Math.min(1, dx));
        joystickRef.current.deltaY = Math.max(-1, Math.min(1, dy));
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickRef.current.touchId) {
        joystickRef.current.active = false;
        joystickRef.current.deltaX = 0;
        joystickRef.current.deltaY = 0;
      }
    }
  };

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden bg-slate-950 border border-emerald-900/60 shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : 'aspect-[16/10] min-h-[520px]'
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Top 3D Status Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none select-none">
        <div className="bg-slate-900/90 border border-emerald-800/80 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto backdrop-blur">
          <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow" />
          <span className="text-xs font-bold text-stone-100">{currentZoneName}</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
            3D WebGL Engine
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Controls toggle button */}
          <button
            onClick={() => setControlsHelpOpen(true)}
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
            title="Irányítási Útmutató"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Irányítás</span>
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
            <span>{cameraMode === 'tps' ? 'TPS (Külső)' : 'FPS (Belső)'} [V]</span>
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

      {/* Interactive Proximity Prompt */}
      {interactionPrompt && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-emerald-500 rounded-xl px-5 py-2.5 shadow-2xl flex items-center gap-3 animate-bounce select-none pointer-events-auto">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white tracking-wide">{interactionPrompt}</span>
        </div>
      )}

      {/* Mobile Touch Joystick (Left Area) & Action Buttons (Right Area) */}
      <div className="absolute inset-x-0 bottom-3 px-4 flex items-end justify-between pointer-events-none md:hidden">
        {/* Virtual Joystick */}
        <div
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          className="w-28 h-28 rounded-full bg-slate-900/70 border-2 border-emerald-500/50 flex items-center justify-center pointer-events-auto touch-none"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/60 shadow flex items-center justify-center text-[10px] font-bold text-slate-950">
            Mozgás
          </div>
        </div>

        {/* Action Buttons for Phone */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => {
              sound.playClick();
              setCameraMode(cameraMode === 'tps' ? 'fps' : 'tps');
            }}
            className="w-14 h-14 rounded-full bg-cyan-950/90 border-2 border-cyan-500 flex items-center justify-center text-xs font-bold text-cyan-200 shadow-lg"
          >
            Nézet
          </button>

          <button
            onClick={() => {
              // Trigger action
              window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
            }}
            className="w-16 h-16 rounded-full bg-emerald-600/95 border-2 border-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-xl active:scale-95 transition"
          >
            Gyűjtés (E)
          </button>
        </div>
      </div>

      {/* Desktop Quick Key Helper Overlay at Bottom */}
      <div className="hidden md:flex absolute bottom-3 left-4 bg-slate-900/80 border border-stone-800 rounded-lg px-3 py-1.5 items-center gap-4 text-[11px] text-stone-300 font-mono pointer-events-none">
        <span>WASD: Mozgás</span>
        <span>Egér: Nézelődés</span>
        <span>Szóköz: Ugrás</span>
        <span>E: Interakció / Gyűjtés</span>
        <span>V: Kamera</span>
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
                <Monitor className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Windows / Asztali gép:</strong>
                  <p className="text-[11px] text-stone-400">
                    Kattints a 3D képre az egér rögzítéséhez (Pointer Lock). <strong>WASD</strong> vagy nyílbillentyűkkel sétálhatsz, az <strong>egérrel</strong> nézelődhetsz, <strong>Szóközzel</strong> ugorhatsz, <strong>E</strong> billentyűvel gyűjthetsz fát és beszélhetsz Mayával, a <strong>V</strong> billentyűvel pedig válthatsz külső (TPS) és belső (FPS) nézet között.
                  </p>
                </div>
              </div>

              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Telefon (Mobil böngésző):</strong>
                  <p className="text-[11px] text-stone-400">
                    A képernyő bal alsó sarkában található virtuális joystickkal mozoghatsz, a jobb oldali gombokkal pedig interakcióba léphetsz és nézetet válthatsz. Nincs szükség semmilyen app letöltésére!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setControlsHelpOpen(false)}
              className="mt-5 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition"
            >
              Értem, vissza a játékba
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
