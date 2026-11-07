import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
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
  TreePine,
  Pickaxe,
  Package,
  AlertTriangle,
  User,
  Upload,
  Download,
  RefreshCw,
  FileCode,
  Check,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Palette,
  Layers,
  Loader2,
  Hammer,
  Home,
  Grid,
  DoorOpen,
  DoorClosed,
  Paintbrush,
  Plus,
} from 'lucide-react';
import {
  saveCustomModel,
  getSavedCustomModel,
  clearSavedCustomModel,
} from '../utils/avatarStorage';
import {
  BuildingPiece,
  BuildingPieceType,
  BuildingTier,
  PIECE_BLUEPRINTS,
  TIER_CONFIG,
  INSULATION_COSTS,
  canAffordPiece,
  deductPieceCost,
  getDemolishRefund,
  calculateStructuralIntegrity,
  analyzeBuildingComfort,
} from '../game/buildingSystem';
import {
  BASE_ORIGIN,
  createPiece3DGroup,
  createGhostPreviewGroup,
} from './modularBuilding3D';

interface ThreeDViewProps {
  gameState: GameState;
  onUpdateInventory: (itemId: string, amount: number) => void;
  onLogEvent: (textHu: string) => void;
  onSwitchToTab: (tab: 'map' | 'base' | 'companion' | 'escape' | 'ruins' | 'studio') => void;
  onUpdateModularBase?: (updatedPieces: BuildingPiece[]) => void;
}

export interface InteractiveProp {
  id: string;
  nameHu: string;
  mesh: THREE.Object3D;
  action: (hitPoint?: THREE.Vector3) => void;
  type: 'shelter' | 'fire' | 'plane' | 'ruins' | 'item' | 'tree' | 'rock' | 'herb' | 'crate' | 'driftwood';
  resourceLabel?: string;
}

export interface HoverInfo {
  nameHu: string;
  resourceLabel?: string;
  type: string;
  dist: number;
  inRange: boolean;
}

export interface GatheringToast {
  id: string;
  text: string;
  icon: string;
  time: number;
}

export const ThreeDView: React.FC<ThreeDViewProps> = ({
  gameState,
  onUpdateInventory,
  onLogEvent,
  onSwitchToTab,
  onUpdateModularBase,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'tps' | 'fps'>('tps');
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);
  const [controlsHelpOpen, setControlsHelpOpen] = useState<boolean>(false);
  const [currentZoneName, setCurrentZoneName] = useState<string>('Partvidék & Sekély Zátonyok (+4m)');
  const [playerGps, setPlayerGps] = useState<{ x: number; z: number; alt: number }>({ x: 80, z: 1255, alt: 4 });
  const [showWaypointsMenu, setShowWaypointsMenu] = useState<boolean>(false);
  
  // 3D Modular Base Building Mode State (GDD: Trópusi Sziget Építési Rendszer)
  const [buildModeActive, setBuildModeActive] = useState<boolean>(false);
  const [buildTier, setBuildTier] = useState<BuildingTier>('wood');
  const [buildPieceType, setBuildPieceType] = useState<BuildingPieceType>('foundation');
  const [buildRotation, setBuildRotation] = useState<number>(0);
  const [buildElevation, setBuildElevation] = useState<number>(0);
  const [buildSubMode, setBuildSubMode] = useState<'build' | 'demolish' | 'insulate'>('build');
  const [snapStatus, setSnapStatus] = useState<{
    x: number;
    z: number;
    elevation: number;
    si: number;
    isValid: boolean;
    canAfford: boolean;
  }>({
    x: 0,
    z: 0,
    elevation: 0,
    si: 100,
    isValid: true,
    canAfford: true,
  });

  const buildModeRef = useRef({
    active: false,
    tier: 'wood' as BuildingTier,
    pieceType: 'foundation' as BuildingPieceType,
    rotation: 0,
    elevation: 0,
    subMode: 'build' as 'build' | 'demolish' | 'insulate',
  });

  const snapStatusRef = useRef({
    x: 0,
    z: 0,
    elevation: 0,
    si: 100,
    isValid: true,
    canAfford: true,
  });

  useEffect(() => {
    buildModeRef.current = {
      active: buildModeActive,
      tier: buildTier,
      pieceType: buildPieceType,
      rotation: buildRotation,
      elevation: buildElevation,
      subMode: buildSubMode,
    };
  }, [buildModeActive, buildTier, buildPieceType, buildRotation, buildElevation, buildSubMode]);

  const currentPiecesRef = useRef<BuildingPiece[]>(gameState.modularBase?.pieces || []);
  useEffect(() => {
    currentPiecesRef.current = gameState.modularBase?.pieces || [];
    modularBaseControllerRef.current?.rebuild(gameState.modularBase?.pieces || []);
  }, [gameState.modularBase?.pieces]);

  const modularBaseControllerRef = useRef<{
    rebuild: (pieces: BuildingPiece[]) => void;
    placePiece: () => void;
    demolishPiece: (id: string) => void;
    insulatePiece: (id: string) => void;
  } | null>(null);

  // Interactive 3D object clicking state
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [gatheringToasts, setGatheringToasts] = useState<GatheringToast[]>([]);
  const [floatingNotice, setFloatingNotice] = useState<{ text: string; type: 'warn' | 'info' | 'success' } | null>(null);

  // 3D Avatar Customization & GLB Model Loader State
  const [characterModalOpen, setCharacterModalOpen] = useState<boolean>(false);
  const [activeSkin, setActiveSkin] = useState<'default' | 'tactical' | 'castaway' | 'robot' | 'custom'>('default');
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelSuccessMsg, setModelSuccessMsg] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  const avatarControllerRef = useRef<{
    loadCustomModelFromBuffer: (buffer: ArrayBuffer, name: string) => Promise<boolean>;
    loadCustomModelFromUrl: (url: string, name?: string) => Promise<boolean>;
    setSkinPreset: (preset: 'default' | 'tactical' | 'castaway' | 'robot') => void;
    clearCustomModel: () => void;
  } | null>(null);

  const toastTimerRef = useRef<any>(null);
  const showGatherToast = (text: string, icon: string = '✨') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setGatheringToasts((prev) => [...prev.slice(-3), { id, text, icon, time: Date.now() }]);
    setTimeout(() => {
      setGatheringToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const triggerFloatingNotice = (text: string, type: 'warn' | 'info' | 'success' = 'info') => {
    setFloatingNotice({ text, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setFloatingNotice(null);
    }, 2400);
  };

  const hudCallbacksRef = useRef({
    showGatherToast,
    triggerFloatingNotice,
    setHoverInfo,
  });
  hudCallbacksRef.current = {
    showGatherToast,
    triggerFloatingNotice,
    setHoverInfo,
  };
  
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
  const teleportPlayerRef = useRef<(x: number, z: number, zoneName?: string) => void>(() => {});

  const WAYPOINTS = [
    { id: 'coast', name: '🏖️ Kezdőtábor & Bázis', x: 80, z: 1255, elev: '+4m', desc: 'Partvidék, Menedék, Tűz' },
    { id: 'rainforest', name: '🌴 Dzsungel & Roncs', x: -380, z: 160, elev: '+65m', desc: 'Trópusi folyóvölgy, Repülő' },
    { id: 'swamp', name: '🐊 Mocsárvidék', x: 650, z: 650, elev: '+10m', desc: 'Iszapmező, Mangrove, Orchidea' },
    { id: 'ruins', name: '🏛️ Ősi Romok Kapu', x: 720, z: -450, elev: '+255m', desc: 'Megalitikus portál, Kristály' },
    { id: 'volcano', name: '🌋 Vulkán Csúcs (+850m)', x: -80, z: -690, elev: '+850m', desc: 'Legmagasabb pont, Kaldera' },
  ];

  // Callbacks ref to avoid rebuilding WebGL scene on state changes
  const callbacksRef = useRef({
    onUpdateInventory,
    onLogEvent,
    onSwitchToTab,
    onUpdateModularBase,
    gameState,
  });
  callbacksRef.current = {
    onUpdateInventory,
    onLogEvent,
    onSwitchToTab,
    onUpdateModularBase,
    gameState,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8cb8c6); // Tropical atmospheric daylight sky
    scene.fog = new THREE.Fog(0x8cb8c6, 600, 6500); // Atmospheric perspective fog across 10 km2

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.5,
      7500 // Far clipping plane adapted for 10 km2 visibility
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lighting (Warm sun + Sky hemisphere across large terrain)
    const hemiLight = new THREE.HemisphereLight(0xbbeeff, 0x224422, 0.85);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.35);
    sunLight.position.set(600, 1600, 800);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334455, 0.4);
    scene.add(ambientLight);

    // Analytical Ground Height Function (10 km² island: R ~ 1780m, max +850m summit, min -30m depth)
    const getGroundHeight = (x: number, z: number): number => {
      const dist = Math.hypot(x, z);
      const islandRadius = 1780;

      // Ocean floor beyond coastal reef slopes down to -30m
      if (dist > islandRadius) {
        const dropDist = dist - islandRadius;
        return -Math.min(30, (dropDist / 350) * 30);
      }

      // Smooth radial island slope from coastline (0m) toward interior
      const normDist = dist / islandRadius;
      const baseElev = Math.pow(Math.cos(normDist * Math.PI * 0.5), 1.25) * 65;

      // 1. Kihűlt Vulkán & Kaldera (North: center x: -80, z: -690, radius ~750m, max peak +850m)
      const vdx = x - (-80);
      const vdz = z - (-690);
      const vDist = Math.hypot(vdx, vdz);
      let volcanoH = 0;
      if (vDist < 750) {
        const vNorm = vDist / 750;
        const cone = Math.pow(Math.cos(vNorm * Math.PI * 0.5), 1.6) * 785;
        let craterDepression = 0;
        if (vDist < 120) {
          const cNorm = vDist / 120;
          craterDepression = (1 - cNorm * cNorm) * 85;
        }
        volcanoH = Math.max(0, cone - craterDepression);
      }

      // 2. Ősi Romok & Templomhegy Fennsík (North-East: x: 720, z: -450, radius ~460m)
      const rdx = x - 720;
      const rdz = z - (-450);
      const rDist = Math.hypot(rdx, rdz);
      let ruinsH = 0;
      if (rDist < 460) {
        const rNorm = rDist / 460;
        ruinsH = Math.pow(Math.cos(rNorm * Math.PI * 0.5), 0.7) * 260;
      }

      // 3. Sűrű Trópusi Esőerdő & Folyóvölgy
      const jdx = x - (-350);
      const jdz = z - 200;
      const jDist = Math.hypot(jdx, jdz);
      let jungleH = 0;
      if (jDist < 600) {
        jungleH = Math.cos((jDist / 600) * (Math.PI * 0.5)) * 95;
      }
      // Winding jungle river carving down to the southern coast
      const riverPathX = Math.sin(z * 0.006) * 140 - 100;
      const distToRiver = Math.abs(x - riverPathX);
      let riverCarve = 0;
      if (distToRiver < 70 && z > -250 && z < 1400) {
        const riverFactor = Math.cos((distToRiver / 70) * (Math.PI * 0.5));
        riverCarve = riverFactor * 16;
      }

      // 4. Mocsárvidék & Iszapmező (South-East: x: 650, z: 650, radius ~520m)
      const sdx = x - 650;
      const sdz = z - 650;
      const sDist = Math.hypot(sdx, sdz);
      let swampFlatten = 0;
      if (sDist < 520) {
        swampFlatten = Math.cos((sDist / 520) * (Math.PI * 0.5)) * 14;
      }

      // Natural fractal micro-topography (hills, ridges, dunes)
      const microH =
        Math.sin(x * 0.012) * Math.cos(z * 0.012) * 12 +
        Math.sin(x * 0.025 + 1.2) * Math.cos(z * 0.025 + 0.8) * 5 +
        Math.sin(x * 0.05) * 1.8;

      let totalH = baseElev + volcanoH + ruinsH + jungleH - riverCarve - swampFlatten + microH;

      // Soft coastal shelf transition (1550m - 1780m)
      if (dist > 1550) {
        const blend = (islandRadius - dist) / (islandRadius - 1550);
        totalH = totalH * Math.max(0, blend);
      }

      return totalH;
    };

    // 3. Procedural 10 km² Island Terrain with Biome Vertex Colors
    const terrainSize = 4200; // 4.2 km x 4.2 km mesh covering full 10 km² island & shelf
    const terrainSegments = 160; // 25,600 vertices - optimal 60 FPS performance
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    const vertexColors: number[] = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const h = getGroundHeight(x, z);
      posAttr.setY(i, h);

      // Biome-based procedural vertex coloring
      const dist = Math.hypot(x, z);
      const color = new THREE.Color();

      if (h < 0.2) {
        // Coral reef shallows / submerged shelf
        color.setHex(0x1a7585);
      } else if (h < 18 && dist > 1100) {
        // Golden beach sand & coastal dunes
        color.setHex(0xd4b483);
      } else if (x > 250 && z > 250 && h < 45) {
        // Swamp mud & mangrove green
        color.setHex(0x3e4d28);
      } else if (h > 600) {
        // Volcanic Peak & Caldera (Obsidian, basalt & burnt sulfur mineral)
        if (Math.hypot(x - (-80), z - (-690)) < 110) {
          color.setHex(0x822a1f); // Caldera center burnt magma crust
        } else {
          color.setHex(0x231a1a); // Dark volcanic basalt
        }
      } else if (h > 350) {
        // High mountain rocky ridge
        color.setHex(0x4a4d52);
      } else if (h > 170 && x > 400 && z < -150) {
        // Ancient Temple Highland stone
        color.setHex(0x4a5d56);
      } else {
        // Lush Tropical Rainforest emerald
        color.setHex(0x235d32);
      }

      vertexColors.push(color.r, color.g, color.b);
    }

    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // 4. Animated Ocean Water Surface (5000m x 5000m)
    const waterGeo = new THREE.PlaneGeometry(5000, 5000, 32, 32);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0a6677,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.5;
    scene.add(waterMesh);

    const interactables: InteractiveProp[] = [];

    const registerInteractable = (prop: InteractiveProp) => {
      interactables.push(prop);
      prop.mesh.userData.prop = prop;
      prop.mesh.traverse((child) => {
        child.userData.prop = prop;
      });
    };

    // 5. Modular Grid Base System (GDD: Trópusi Sziget Építési Rendszer 2x2m Grid)
    const modularBaseGroup = new THREE.Group();
    scene.add(modularBaseGroup);

    const baseOriginGroundY = getGroundHeight(BASE_ORIGIN.x, BASE_ORIGIN.z);

    // 2x2m Modular Grid Alignment Helper
    const buildGridHelper = new THREE.GridHelper(32, 16, 0x10b981, 0x059669);
    buildGridHelper.position.set(BASE_ORIGIN.x, baseOriginGroundY + 0.05, BASE_ORIGIN.z);
    buildGridHelper.visible = false;
    scene.add(buildGridHelper);

    // Dynamic Hologram Ghost Preview Container
    let ghostGroup: THREE.Group | null = null;

    // Procedural Rebuilder for all modular pieces in 3D
    const rebuildModularBase = (pieces: BuildingPiece[]) => {
      while (modularBaseGroup.children.length > 0) {
        const obj = modularBaseGroup.children[0];
        modularBaseGroup.remove(obj);
      }

      for (const piece of pieces) {
        const pieceGroup = createPiece3DGroup(piece, baseOriginGroundY);
        pieceGroup.userData = { isModularPiece: true, pieceId: piece.id, piece };
        pieceGroup.traverse((child) => {
          child.userData = { isModularPiece: true, pieceId: piece.id, piece };
        });
        modularBaseGroup.add(pieceGroup);
      }
    };

    // Initial build from game state
    rebuildModularBase(currentPiecesRef.current);

    // Modular Building Workbench / Base Planner Hub (Coast: x: 83.2, z: 1250)
    const workbenchGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.9), woodMat);
    benchTop.position.y = 0.9;
    workbenchGroup.add(benchTop);
    [-0.65, 0.65].forEach((bx) => {
      [-0.32, 0.32].forEach((bz) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), woodMat);
        leg.position.set(bx, 0.45, bz);
        workbenchGroup.add(leg);
      });
    });
    // Blueprint paper & craft tools on the bench
    const blueprintPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 })
    );
    blueprintPaper.rotateX(-Math.PI / 2);
    blueprintPaper.position.set(-0.25, 1.02, 0);
    workbenchGroup.add(blueprintPaper);
    const hammerProp = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.8, roughness: 0.3 })
    );
    hammerProp.position.set(0.35, 1.06, 0.1);
    workbenchGroup.add(hammerProp);

    workbenchGroup.position.set(BASE_ORIGIN.x + 3.2, baseOriginGroundY, BASE_ORIGIN.z);
    scene.add(workbenchGroup);

    registerInteractable({
      id: 'shelter',
      nameHu: 'Bázis Túlélő Műhely & Tervező',
      mesh: workbenchGroup,
      type: 'shelter',
      resourceLabel: 'Építés, Klíma & Tervezés',
      action: () => callbacksRef.current.onSwitchToTab('base'),
    });

    // Building Actions Handlers
    const handlePlaceCurrentPiece = () => {
      const { pieceType, tier, rotation, elevation } = buildModeRef.current;
      const { x, z, isValid, canAfford } = snapStatusRef.current;

      if (!isValid) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice('Ide nem építhetsz: nincs megfelelő szerkezeti támaszték (0% SI)!', 'warn');
        return;
      }
      if (!canAfford) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice('Nincs elég nyersanyag a hátizsákban az elem felépítéséhez!', 'warn');
        return;
      }

      // Deduct required resources
      const costs = PIECE_BLUEPRINTS[pieceType].cost[tier];
      Object.entries(costs).forEach(([itemId, qty]) => {
        callbacksRef.current.onUpdateInventory(itemId, -qty);
      });

      const bp = PIECE_BLUEPRINTS[pieceType];
      const maxHp = bp.maxHp[tier];

      const newPiece: BuildingPiece = {
        id: `piece-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: pieceType,
        tier,
        gridX: x,
        gridZ: z,
        elevation,
        rotation,
        hp: maxHp,
        maxHp,
        si: 100,
        isOpen: false,
        insulated: false,
      };

      const updatedRaw = [...currentPiecesRef.current, newPiece];
      const { updatedPieces, collapsedPieceIds } = calculateStructuralIntegrity(updatedRaw);
      currentPiecesRef.current = updatedPieces;
      rebuildModularBase(updatedPieces);

      if (callbacksRef.current.onUpdateModularBase) {
        callbacksRef.current.onUpdateModularBase(updatedPieces);
      }

      sound.playMine();
      hudCallbacksRef.current.showGatherToast(`🔨 ${bp.nameHu} (${TIER_CONFIG[tier].nameHu}) sikeresen elhelyezve!`, '✨');

      if (collapsedPieceIds.length > 0) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice(`⚠️ Statikai összeomlás: ${collapsedPieceIds.length} elem leomlott!`, 'warn');
      }
    };

    const handleDemolishPiece = (id: string) => {
      const target = currentPiecesRef.current.find((p) => p.id === id);
      if (!target) return;
      const refund = getDemolishRefund(target.type, target.tier);
      Object.entries(refund).forEach(([item, amount]) => {
        callbacksRef.current.onUpdateInventory(item, amount);
      });
      const remaining = currentPiecesRef.current.filter((p) => p.id !== id);
      const { updatedPieces, collapsedPieceIds } = calculateStructuralIntegrity(remaining);
      currentPiecesRef.current = updatedPieces;
      rebuildModularBase(updatedPieces);
      if (callbacksRef.current.onUpdateModularBase) {
        callbacksRef.current.onUpdateModularBase(updatedPieces);
      }
      sound.playChop();
      hudCallbacksRef.current.showGatherToast(`💥 ${PIECE_BLUEPRINTS[target.type].nameHu} lebontva! (50% visszatérítve)`, '♻️');
      if (collapsedPieceIds.length > 0) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice(`⚠️ Láncreakciós összeomlás: ${collapsedPieceIds.length} elem elvesztette a tartását!`, 'warn');
      }
    };

    const handleInsulatePiece = (id: string) => {
      const target = currentPiecesRef.current.find((p) => p.id === id);
      if (!target) return;
      if (target.insulated) {
        hudCallbacksRef.current.triggerFloatingNotice('Ez az elem már agyagréteggel szigetelt!', 'info');
        return;
      }
      const inv = callbacksRef.current.gameState.inventory;
      const tierCosts = INSULATION_COSTS[target.tier];
      const canAfford = Object.entries(tierCosts).every(([k, v]) => (inv[k] || 0) >= v);
      if (!canAfford) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice('Nincs elég agyag és pálmalevél a szigeteléshez!', 'warn');
        return;
      }
      Object.entries(tierCosts).forEach(([k, v]) => {
        callbacksRef.current.onUpdateInventory(k, -v);
      });
      const updated = currentPiecesRef.current.map((p) => (p.id === id ? { ...p, insulated: true } : p));
      currentPiecesRef.current = updated;
      rebuildModularBase(updated);
      if (callbacksRef.current.onUpdateModularBase) {
        callbacksRef.current.onUpdateModularBase(updated);
      }
      sound.playCraftSuccess();
      hudCallbacksRef.current.showGatherToast(`🧱 ${PIECE_BLUEPRINTS[target.type].nameHu} agyagvakolattal leszigetelve!`, '🛡️');
    };

    modularBaseControllerRef.current = {
      rebuild: (p) => rebuildModularBase(p),
      placePiece: () => handlePlaceCurrentPiece(),
      demolishPiece: (id: string) => handleDemolishPiece(id),
      insulatePiece: (id: string) => handleInsulatePiece(id),
    };

    // Campfire with animated pointlight (Coast: x: 74, z: 1244)
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

    fireGroup.position.set(74, getGroundHeight(74, 1244), 1244);
    scene.add(fireGroup);

    registerInteractable({
      id: 'campfire',
      nameHu: 'Túlélő Tábortűz',
      mesh: fireGroup,
      type: 'fire',
      resourceLabel: 'Fűtés & Melegedés (-1 Fa)',
      action: () => {
        callbacksRef.current.onUpdateInventory('driftwood', -1);
        callbacksRef.current.onLogEvent('Megraktad a tábortüzet száraz fával (+60 perc meleg).');
        sound.playCraftSuccess();
        hudCallbacksRef.current.showGatherToast('🔥 Tábortűz megrakva (+60p meleg)', '🔥');
      },
    });

    // 6. Crashed Twin-Engine Cargo Plane (Jungle: x: -380, z: 160)
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

    planeGroup.position.set(-380, getGroundHeight(-380, 160) + 1.2, 160);
    planeGroup.rotateY(0.6);
    scene.add(planeGroup);

    registerInteractable({
      id: 'plane',
      nameHu: 'Lezuhant Teherszállító Repülőgép Roncs',
      mesh: planeGroup,
      type: 'plane',
      resourceLabel: 'Menekülés & Repülőgép szerelés',
      action: () => callbacksRef.current.onSwitchToTab('escape'),
    });

    // 7. Ancient Ruins Monolith & Stone Portal (North-East: x: 720, z: -450)
    const ruinsGroup = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x485058, roughness: 0.95 });
    const runeGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38ef7d,
      emissive: 0x11998e,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    });

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.4, 12, 2.4), stoneMat);
    pillarL.position.set(-4.5, 6, 0);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(2.4, 12, 2.4), stoneMat);
    pillarR.position.set(4.5, 6, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(13, 2.2, 2.8), stoneMat);
    lintel.position.set(0, 12.2, 0);
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), runeGlowMat);
    crystal.position.set(0, 7, 0);

    ruinsGroup.add(pillarL, pillarR, lintel, crystal);
    ruinsGroup.position.set(720, getGroundHeight(720, -450), -450);
    scene.add(ruinsGroup);

    registerInteractable({
      id: 'ruins',
      nameHu: 'Ősi Romok Misztikus Kőkapuja (+255m)',
      mesh: ruinsGroup,
      type: 'ruins',
      resourceLabel: 'Rejtvények & Titán ötvözet',
      action: () => callbacksRef.current.onSwitchToTab('ruins'),
    });

    // 8. Volcanic Caldera Summit Station & Magma Fissure (North Peak: x: -80, z: -690) Altitude +850m
    const volcanoSummitGroup = new THREE.Group();
    const basaltPillarMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.95 });
    const magmaFissureMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff1e00,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });

    const spire = new THREE.Mesh(new THREE.ConeGeometry(7.0, 22, 6), basaltPillarMat);
    spire.position.y = 11;
    volcanoSummitGroup.add(spire);

    const magmaPool = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 0.8, 12), magmaFissureMat);
    magmaPool.position.y = 0.4;
    volcanoSummitGroup.add(magmaPool);

    const summitLight = new THREE.PointLight(0xff4500, 4.0, 150);
    summitLight.position.set(0, 15, 0);
    volcanoSummitGroup.add(summitLight);

    volcanoSummitGroup.position.set(-80, getGroundHeight(-80, -690), -690);
    scene.add(volcanoSummitGroup);

    registerInteractable({
      id: 'volcano_summit',
      nameHu: 'Vulkán Kaldera Csúcspont (Magasság: +850m)',
      mesh: volcanoSummitGroup,
      type: 'ruins',
      resourceLabel: 'Obszidián szikla & Kénérc (+850m)',
      action: () => {
        sound.playMine();
        callbacksRef.current.onUpdateInventory('flint_shard', 3);
        callbacksRef.current.onUpdateInventory('scrap_metal', 2);
        callbacksRef.current.onLogEvent('Elérted a sziget legmagasabb pontját: +850m Vulkáni Csúcs és Kaldera!');
        hudCallbacksRef.current.showGatherToast('🌋 Vulkán Csúcs (+850m) megérkezés!', '🌋');
      },
    });

    // 3D Harvest Particles Pool
    interface Particle {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
      maxLife: number;
    }
    const activeParticles: Particle[] = [];

    const spawnParticles = (pos: THREE.Vector3, type: 'wood' | 'rock' | 'leaf' | 'spark') => {
      const count = type === 'leaf' ? 8 : 10;
      for (let i = 0; i < count; i++) {
        const geo = type === 'leaf'
          ? new THREE.PlaneGeometry(0.18, 0.18)
          : new THREE.BoxGeometry(0.12, 0.12, 0.12);
        let color = 0x8d6e63;
        if (type === 'leaf') color = 0x2e7d32;
        if (type === 'rock') color = 0x78909c;
        if (type === 'spark') color = 0xffd54f;

        const pMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        const pMesh = new THREE.Mesh(geo, pMat);
        pMesh.position.copy(pos);
        pMesh.position.x += (Math.random() - 0.5) * 0.4;
        pMesh.position.y += (Math.random() - 0.5) * 0.4;
        pMesh.position.z += (Math.random() - 0.5) * 0.4;

        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 4.5,
          Math.random() * 4.0 + 2.0,
          (Math.random() - 0.5) * 4.5
        );
        scene.add(pMesh);
        activeParticles.push({
          mesh: pMesh,
          velocity: vel,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.35,
        });
      }
    };

    // 8. CLICKABLE 3D PALM TREES (Trunks, Fronds & Coconuts)
    const palmPositions = [
      // Coastline & Base Shelter Groves (x: 80, z: 1250)
      { x: 95, z: 1240 },
      { x: 60, z: 1260 },
      { x: 120, z: 1230 },
      { x: 45, z: 1280 },
      { x: 110, z: 1270 },
      { x: 140, z: 1220 },
      { x: 25, z: 1290 },
      { x: -60, z: 1350 },
      { x: -140, z: 1300 },
      { x: 200, z: 1200 },
      // Central Rainforest groves
      { x: -360, z: 180 },
      { x: -410, z: 140 },
      { x: -340, z: 130 },
      { x: -420, z: 200 },
      { x: -300, z: 220 },
      // Swamp Mudflat mangroves
      { x: 620, z: 640 },
      { x: 670, z: 680 },
      { x: 640, z: 610 },
    ];

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 7.5, 7);
    const frondGeo = new THREE.ConeGeometry(3.8, 1.6, 6);
    const coconutGeo = new THREE.SphereGeometry(0.25, 6, 6);

    const palmBarkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.85 });
    const palmFrondMat = new THREE.MeshStandardMaterial({ color: 0x1e6f24, roughness: 0.75 });
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x3e2718, roughness: 0.95 });

    palmPositions.forEach((p, idx) => {
      const tree = new THREE.Group();
      // Curved trunk
      const trunk = new THREE.Mesh(trunkGeo, palmBarkMat);
      trunk.position.y = 3.75;
      trunk.rotateZ((idx % 2 === 0 ? 1 : -1) * 0.1);
      tree.add(trunk);

      // Fronds canopy
      const fronds = new THREE.Mesh(frondGeo, palmFrondMat);
      fronds.position.set(trunk.position.x, 7.5, trunk.position.z);
      tree.add(fronds);

      // Coconuts
      for (let c = 0; c < 3; c++) {
        const nut = new THREE.Mesh(coconutGeo, coconutMat);
        const a = (c / 3) * Math.PI * 2;
        nut.position.set(trunk.position.x + Math.cos(a) * 0.5, 6.8, trunk.position.z + Math.sin(a) * 0.5);
        tree.add(nut);
      }

      tree.position.set(p.x, getGroundHeight(p.x, p.z), p.z);
      scene.add(tree);

      registerInteractable({
        id: `tree-${idx}`,
        nameHu: 'Trópusi Kókuszpálma',
        mesh: tree,
        type: 'tree',
        resourceLabel: 'Fa rönk, Pálmalevél, Kókuszdió',
        action: (hitPoint) => {
          sound.playChop();
          const p = hitPoint || tree.position.clone().add(new THREE.Vector3(0, 2.5, 0));
          spawnParticles(p, 'wood');
          spawnParticles(p, 'leaf');

          tree.userData.shake = 0.35;
          callbacksRef.current.onUpdateInventory('driftwood', 2);
          callbacksRef.current.onUpdateInventory('palm_leaves', 2);

          const gotCoconut = Math.random() < 0.45;
          if (gotCoconut) {
            callbacksRef.current.onUpdateInventory('coconut', 1);
          }

          callbacksRef.current.onLogEvent(
            `Kivágtál a pálmafából: +2 Fa rönk, +2 Pálmalevél${gotCoconut ? ', +1 Kókuszdió!' : '.'}`
          );

          hudCallbacksRef.current.showGatherToast(
            gotCoconut ? '🪵 +2 Fa rönk, 🍃 +2 Levél, 🥥 +1 Kókusz' : '🪵 +2 Fa rönk, 🍃 +2 Pálmalevél',
            '🌴'
          );
        },
      });
    });

    // 9. CLICKABLE 3D MINERAL & VOLCANIC ROCKS
    const rockPositions = [
      // Coastal mineral rocks
      { x: 88, z: 1235, scale: 2.2 },
      { x: 50, z: 1265, scale: 2.5 },
      { x: 135, z: 1260, scale: 3.0 },
      // Rainforest flint
      { x: -370, z: 145, scale: 2.8 },
      { x: -400, z: 175, scale: 2.4 },
      // Swamp mudflat boulders
      { x: 630, z: 630, scale: 2.6 },
      { x: 680, z: 670, scale: 3.2 },
      // Ancient Ruins megalith stones
      { x: 705, z: -435, scale: 3.5 },
      { x: 740, z: -465, scale: 4.0 },
      // Volcanic Peak Basalt & Obsidian Boulders (+850m region)
      { x: -70, z: -675, scale: 3.8 },
      { x: -95, z: -705, scale: 4.2 },
      { x: -60, z: -710, scale: 3.5 },
      { x: -105, z: -665, scale: 4.5 },
    ];

    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x45484f,
      roughness: 0.85,
      metalness: 0.2,
    });
    const flintVeinMat = new THREE.MeshStandardMaterial({
      color: 0x8a929b,
      metalness: 0.7,
      roughness: 0.3,
    });
    const mossMat = new THREE.MeshStandardMaterial({
      color: 0x2e4a2c,
      roughness: 0.95,
    });

    rockPositions.forEach((p, idx) => {
      const rockGroup = new THREE.Group();
      // Main faceted boulder
      const mainRock = new THREE.Mesh(new THREE.DodecahedronGeometry(p.scale), boulderMat);
      mainRock.position.y = p.scale * 0.7;
      mainRock.rotateX(idx * 0.5);
      mainRock.rotateZ(idx * 0.7);
      rockGroup.add(mainRock);

      // Embedded flint mineral vein
      const vein = new THREE.Mesh(new THREE.BoxGeometry(p.scale * 0.4, p.scale * 0.6, p.scale * 0.2), flintVeinMat);
      vein.position.set(p.scale * 0.4, p.scale * 0.8, 0);
      vein.rotateY(0.4);
      rockGroup.add(vein);

      // Secondary smaller base stone
      const subStone = new THREE.Mesh(new THREE.IcosahedronGeometry(p.scale * 0.5), mossMat);
      subStone.position.set(-p.scale * 0.7, p.scale * 0.3, p.scale * 0.3);
      rockGroup.add(subStone);

      rockGroup.position.set(p.x, getGroundHeight(p.x, p.z), p.z);
      scene.add(rockGroup);

      registerInteractable({
        id: `rock-${idx}`,
        nameHu: idx >= 9 ? 'Vulkanikus Bazalttömb (+850m)' : idx >= 7 ? 'Megalitikus Kőtömb' : 'Kovakő Ásványszikla',
        mesh: rockGroup,
        type: 'rock',
        resourceLabel: idx >= 9 ? 'Obszidián, Kén kristály, Fém' : 'Kovakő szilánk, Kőzet, Fémhulladék',
        action: (hitPoint) => {
          sound.playMine();
          const p = hitPoint || rockGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0));
          spawnParticles(p, 'rock');
          spawnParticles(p, 'spark');

          rockGroup.userData.shake = 0.25;
          callbacksRef.current.onUpdateInventory('flint_shard', 2);

          const gotScrap = Math.random() < 0.4;
          if (gotScrap) {
            callbacksRef.current.onUpdateInventory('scrap_metal', 1);
          }

          callbacksRef.current.onLogEvent(
            `Kovakő sziklát bányásztál: +2 Kovakő szilánk${gotScrap ? ', +1 Fémhulladék!' : '.'}`
          );

          hudCallbacksRef.current.showGatherToast(
            gotScrap ? '🪨 +2 Kovakő szilánk, ⚙️ +1 Fémhulladék' : '🪨 +2 Kovakő szilánk',
            '⛏️'
          );
        },
      });
    });

    // 10. CLICKABLE 3D JUNGLE HERB & VINE BUSHES
    const herbPositions = [
      { x: 75, z: 1220 },
      { x: 65, z: 1270 },
      { x: 100, z: 1255 },
      { x: -365, z: 150 },
      { x: -395, z: 165 },
      { x: -330, z: 180 },
      { x: 645, z: 645 },
      { x: 665, z: 630 },
      { x: 710, z: -440 },
      { x: 735, z: -455 },
    ];

    const herbLeafMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 });
    const berryMat = new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.4 });

    herbPositions.forEach((p, idx) => {
      const bushGroup = new THREE.Group();
      // Foliage clusters
      for (let i = 0; i < 4; i++) {
        const leafBall = new THREE.Mesh(new THREE.SphereGeometry(0.7 + (i % 2) * 0.2, 6, 6), herbLeafMat);
        const a = (i / 4) * Math.PI * 2;
        leafBall.position.set(Math.cos(a) * 0.55, 0.55 + (i % 2) * 0.25, Math.sin(a) * 0.55);
        bushGroup.add(leafBall);
      }
      // Medicinal berries
      for (let b = 0; b < 6; b++) {
        const berry = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 5), berryMat);
        const ba = (b / 6) * Math.PI * 2;
        berry.position.set(Math.cos(ba) * 0.8, 0.7 + (b % 3) * 0.2, Math.sin(ba) * 0.8);
        bushGroup.add(berry);
      }

      bushGroup.position.set(p.x, getGroundHeight(p.x, p.z), p.z);
      scene.add(bushGroup);

      registerInteractable({
        id: `herb-${idx}`,
        nameHu: 'Trópusi Gyógynövény & Lián Bokor',
        mesh: bushGroup,
        type: 'herb',
        resourceLabel: 'Gyógynövény, Lián kötél',
        action: (hitPoint) => {
          sound.playHarvest();
          const p = hitPoint || bushGroup.position.clone().add(new THREE.Vector3(0, 0.6, 0));
          spawnParticles(p, 'leaf');

          bushGroup.userData.shake = 0.35;
          callbacksRef.current.onUpdateInventory('medicinal_herb', 2);
          callbacksRef.current.onUpdateInventory('vine_rope', 1);

          callbacksRef.current.onLogEvent(
            'Gyógynövényeket és indákat gyűjtöttél: +2 Gyógynövény, +1 Lián kötél.'
          );

          hudCallbacksRef.current.showGatherToast('🌿 +2 Gyógynövény, 🪢 +1 Lián kötél', '🌿');
        },
      });
    });

    // 11. CLICKABLE 3D SUPPLY CRATES FROM SHIPWRECK
    const cratePositions = [
      { x: 86, z: 1242, rot: 0.1 },
      { x: 64, z: 1258, rot: -0.2 },
      { x: 105, z: 1245, rot: 0.4 },
      { x: -375, z: 155, rot: 0.5 },
      { x: -390, z: 168, rot: -0.3 },
    ];

    const crateWoodMat = new THREE.MeshStandardMaterial({ color: 0x6d5236, roughness: 0.9 });
    const crateIronMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.6, metalness: 0.7 });

    cratePositions.forEach((p, idx) => {
      const crateGroup = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), crateWoodMat);
      box.position.y = 0.6;
      crateGroup.add(box);

      // Iron strapping
      const strap1 = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 1.22), crateIronMat);
      strap1.position.y = 0.6;
      crateGroup.add(strap1);

      crateGroup.position.set(p.x, getGroundHeight(p.x, p.z), p.z);
      crateGroup.rotateY(p.rot);
      scene.add(crateGroup);

      registerInteractable({
        id: `crate-${idx}`,
        nameHu: 'Partra Sodródott Ellátmányláda',
        mesh: crateGroup,
        type: 'crate',
        resourceLabel: 'Fémhulladék, Ivóvíz, Eszközök',
        action: (hitPoint) => {
          sound.playCraftSuccess();
          const p = hitPoint || crateGroup.position.clone().add(new THREE.Vector3(0, 0.5, 0));
          spawnParticles(p, 'wood');
          spawnParticles(p, 'spark');

          crateGroup.userData.shake = 0.3;
          callbacksRef.current.onUpdateInventory('scrap_metal', 2);

          const gotWater = Math.random() < 0.6;
          if (gotWater) {
            callbacksRef.current.onUpdateInventory('fresh_water_flask', 1);
          } else {
            callbacksRef.current.onUpdateInventory('flint_shard', 1);
          }

          callbacksRef.current.onLogEvent(
            `Kinyitottad az ellátmányládát: +2 Fémhulladék${gotWater ? ', +1 Kulacs ivóvíz!' : ', +1 Kovakő szilánk!'}`
          );

          hudCallbacksRef.current.showGatherToast(
            gotWater ? '📦 +2 Fémhulladék, 💧 +1 Kulacs víz' : '📦 +2 Fémhulladék, 🪨 +1 Kovakő szilánk',
            '📦'
          );
        },
      });
    });

    // 12. Collectible Driftwood Logs on Beach
    const driftwoodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const logGeo = new THREE.CylinderGeometry(0.24, 0.28, 3.2, 6);
    logGeo.rotateZ(Math.PI / 2);

    [
      { x: 92, z: 1248 },
      { x: 55, z: 1252 },
      { x: 115, z: 1265 },
      { x: 72, z: 1262 },
      { x: 40, z: 1275 },
    ].forEach((pos, idx) => {
      const log = new THREE.Mesh(logGeo, driftwoodMat);
      log.position.set(pos.x, getGroundHeight(pos.x, pos.z) + 0.3, pos.z);
      scene.add(log);

      registerInteractable({
        id: `wood-${idx}`,
        nameHu: 'Uszadékfa rönk',
        mesh: log,
        type: 'driftwood',
        resourceLabel: '+3 Fa rönk',
        action: (hitPoint) => {
          sound.playHarvest();
          const p = hitPoint || log.position.clone().add(new THREE.Vector3(0, 0.3, 0));
          spawnParticles(p, 'wood');

          callbacksRef.current.onUpdateInventory('driftwood', 3);
          callbacksRef.current.onLogEvent('Uszadékfa rönköt gyűjtöttél a tengerparti homokból (+3 Fa rönk).');
          hudCallbacksRef.current.showGatherToast('🪵 +3 Uszadékfa rönk felvéve', '🪵');
          log.position.y = -100;
        },
      });
    });

    // 13. COMPANION (Maya Vance) 3D AVATAR - Detailed Procedural Character
    // 21-year-old sole survivor, athletic hiker with bandana, ponytail, utility belt & '89 car key
    const companionGroup = new THREE.Group();

    // High quality PBR materials for Maya
    const mayaSkinMat = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 0.65 });
    const mayaHairMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.85 });
    const mayaBandanaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
    const mayaTopMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.75 }); // Coral tank top
    const mayaTopTrimMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.7 }); // Cyan trim
    const mayaShortsMat = new THREE.MeshStandardMaterial({ color: 0x6b705c, roughness: 0.85 }); // Khaki cargo shorts
    const mayaBeltMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 });
    const mayaBuckleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 });
    const mayaBootsMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });
    const mayaSoleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    const mayaSocksMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.85 });
    const mayaPackMat = new THREE.MeshStandardMaterial({ color: 0x3f4f2c, roughness: 0.85 }); // Olive hiking daypack
    const mayaFlaskMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const mayaFlaskCapMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
    const mayaCarKeyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.3 });
    const mayaSlothCarabinerMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7 }); // Cute plush sloth
    const mayaEyeMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.2 });
    const mayaEyeHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mayaEarringMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
    const mayaBraceletMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.8 });

    // FEET & BOOTS
    const createBoot = (xOffset: number) => {
      const bootGroup = new THREE.Group();
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.28), mayaSoleMat);
      sole.position.set(0, 0.025, 0.02);
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.26), mayaBootsMat);
      upper.position.set(0, 0.11, 0.01);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.08, 8), mayaBootsMat);
      collar.position.set(0, 0.19, -0.02);
      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.07, 8), mayaSocksMat);
      sock.position.set(0, 0.24, -0.02);
      bootGroup.add(sole, upper, collar, sock);
      bootGroup.position.set(xOffset, 0, 0);
      return bootGroup;
    };
    companionGroup.add(createBoot(-0.16));
    companionGroup.add(createBoot(0.16));

    // LEGS & CARGO SHORTS
    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.36, 8), mayaSkinMat);
    leftCalf.position.set(-0.16, 0.42, -0.02);
    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.36, 8), mayaSkinMat);
    rightCalf.position.set(0.16, 0.42, -0.02);
    const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), mayaSkinMat);
    leftKnee.position.set(-0.16, 0.60, -0.01);
    const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), mayaSkinMat);
    rightKnee.position.set(0.16, 0.60, -0.01);
    const leftShortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.32, 8), mayaShortsMat);
    leftShortLeg.position.set(-0.16, 0.74, 0);
    const rightShortLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.32, 8), mayaShortsMat);
    rightShortLeg.position.set(0.16, 0.74, 0);
    const leftPocket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.11), mayaShortsMat);
    leftPocket.position.set(-0.28, 0.74, 0);
    const rightPocket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 0.11), mayaShortsMat);
    rightPocket.position.set(0.28, 0.74, 0);

    companionGroup.add(leftCalf, rightCalf, leftKnee, rightKnee, leftShortLeg, rightShortLeg, leftPocket, rightPocket);

    // PELVIS & BELT & PERSONAL CHARMS
    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.20, 0.20, 8), mayaShortsMat);
    pelvis.position.set(0, 0.94, 0);
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.06, 12), mayaBeltMat);
    belt.position.set(0, 1.02, 0);
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.03), mayaBuckleMat);
    beltBuckle.position.set(0, 1.02, 0.225);

    // Relic on belt: vintage 1989 car key + cute lime sloth carabiner keychain
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 6, 8), mayaBuckleMat);
    keyRing.position.set(0.21, 0.99, 0.10);
    const vintageCarKey = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.025), mayaCarKeyMat);
    vintageCarKey.position.set(0.21, 0.94, 0.10);
    const slothPlush = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), mayaSlothCarabinerMat);
    slothPlush.position.set(0.22, 0.96, 0.13);

    companionGroup.add(pelvis, belt, beltBuckle, keyRing, vintageCarKey, slothPlush);

    // TORSO & CHEST (Coral athletic tank top with trim)
    const mayaChest = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.17, 0.44, 8), mayaTopMat);
    mayaChest.position.set(0, 1.25, 0);
    const tankTopTrim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 6, 12), mayaTopTrimMat);
    tankTopTrim.rotation.x = Math.PI / 2;
    tankTopTrim.position.set(0, 1.45, 0);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.085, 0.14, 8), mayaSkinMat);
    neck.position.set(0, 1.51, 0);

    companionGroup.add(mayaChest, tankTopTrim, neck);

    // HIKING DAYPACK (Backpack with stainless water flask & brass compass)
    const daypack = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.18), mayaPackMat);
    daypack.position.set(0, 1.25, -0.18);
    const daypackPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.07), mayaPackMat);
    daypackPocket.position.set(0, 1.18, -0.29);
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.20, 8), mayaFlaskMat);
    flask.position.set(0.18, 1.22, -0.17);
    const flaskCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 8), mayaFlaskCapMat);
    flaskCap.position.set(0.18, 1.33, -0.17);
    const leftStrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.04), mayaBeltMat);
    leftStrap.position.set(-0.12, 1.30, 0.12);
    leftStrap.rotation.x = -0.2;
    const rightStrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.04), mayaBeltMat);
    rightStrap.position.set(0.12, 1.30, 0.12);
    rightStrap.rotation.x = -0.2;
    const compassBody = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 10), mayaBuckleMat);
    compassBody.position.set(-0.12, 1.28, 0.15);
    compassBody.rotation.x = Math.PI / 2;

    companionGroup.add(daypack, daypackPocket, flask, flaskCap, leftStrap, rightStrap, compassBody);

    // ARMS & HANDS
    const leftArmGroup = new THREE.Group();
    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.30, 8), mayaSkinMat);
    leftUpperArm.position.set(0, -0.15, 0);
    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 8), mayaSkinMat);
    leftForearm.position.set(0, -0.40, 0.05);
    leftForearm.rotation.x = 0.3;
    const bracelet = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), mayaBraceletMat);
    bracelet.position.set(0, -0.48, 0.09);
    bracelet.rotation.x = Math.PI / 2;
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), mayaSkinMat);
    leftHand.position.set(0, -0.54, 0.11);
    leftArmGroup.add(leftUpperArm, leftForearm, bracelet, leftHand);
    leftArmGroup.position.set(-0.30, 1.42, 0);
    leftArmGroup.rotation.z = 0.1;

    const rightArmGroup = new THREE.Group();
    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.30, 8), mayaSkinMat);
    rightUpperArm.position.set(0, -0.15, 0);
    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.28, 8), mayaSkinMat);
    rightForearm.position.set(0, -0.38, 0.03);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), mayaSkinMat);
    rightHand.position.set(0, -0.52, 0.04);
    rightArmGroup.add(rightUpperArm, rightForearm, rightHand);
    rightArmGroup.position.set(0.30, 1.42, 0);
    rightArmGroup.rotation.z = -0.1;

    companionGroup.add(leftArmGroup, rightArmGroup);

    // HEAD & HAIR (Pivot group for head-tracking animation)
    const mayaHeadPivot = new THREE.Group();
    mayaHeadPivot.position.set(0, 1.58, 0);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), mayaSkinMat);
    headMesh.scale.set(0.92, 1.05, 0.96);
    headMesh.position.set(0, 0.10, 0);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), mayaEyeMat);
    leftEye.position.set(-0.065, 0.11, 0.18);
    const leftEyeSparkle = new THREE.Mesh(new THREE.SphereGeometry(0.009, 4, 4), mayaEyeHighlightMat);
    leftEyeSparkle.position.set(-0.060, 0.12, 0.20);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), mayaEyeMat);
    rightEye.position.set(0.065, 0.11, 0.18);
    const rightEyeSparkle = new THREE.Mesh(new THREE.SphereGeometry(0.009, 4, 4), mayaEyeHighlightMat);
    rightEyeSparkle.position.set(0.070, 0.12, 0.20);

    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 4, 8, Math.PI), mayaHairMat);
    smile.rotation.x = Math.PI / 2;
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.04, 0.185);

    const leftEarring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 4, 10), mayaEarringMat);
    leftEarring.position.set(-0.19, 0.09, 0);
    leftEarring.rotation.y = Math.PI / 2;
    const rightEarring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 4, 10), mayaEarringMat);
    rightEarring.position.set(0.19, 0.09, 0);
    rightEarring.rotation.y = Math.PI / 2;

    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 10), mayaHairMat);
    hairCrown.position.set(0, 0.14, -0.03);
    hairCrown.scale.set(0.96, 0.98, 1.02);

    const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.028, 6, 16), mayaBandanaMat);
    bandana.position.set(0, 0.16, 0.02);
    bandana.rotation.x = -0.3;
    const bandanaKnot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.04), mayaBandanaMat);
    bandanaKnot.position.set(0, 0.19, -0.19);

    const mayaPonytailPivot = new THREE.Group();
    mayaPonytailPivot.position.set(0, 0.18, -0.20);
    const hairBand = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 8), mayaBandanaMat);
    const ponytailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.40, 8), mayaHairMat);
    ponytailMesh.position.set(0, -0.18, -0.06);
    ponytailMesh.rotation.x = -0.45;
    mayaPonytailPivot.add(hairBand, ponytailMesh);

    mayaHeadPivot.add(
      headMesh,
      leftEye,
      leftEyeSparkle,
      rightEye,
      rightEyeSparkle,
      smile,
      leftEarring,
      rightEarring,
      hairCrown,
      bandana,
      bandanaKnot,
      mayaPonytailPivot
    );
    companionGroup.add(mayaHeadPivot);

    // Store references in userData for render-loop animation
    companionGroup.userData = {
      headPivot: mayaHeadPivot,
      ponytailPivot: mayaPonytailPivot,
      chest: mayaChest,
    };

    companionGroup.position.set(70, getGroundHeight(70, 1240), 1240);
    scene.add(companionGroup);

    registerInteractable({
      id: 'companion',
      nameHu: 'Maya Vance',
      mesh: companionGroup,
      type: 'item',
      resourceLabel: 'Beszélgetés & Feladatkiosztás',
      action: () => callbacksRef.current.onSwitchToTab('companion'),
    });

    // 11. PLAYER 3D AVATAR (Survivor Character & Custom GLB Host)
    const playerGroup = new THREE.Group();
    const proceduralAvatarGroup = new THREE.Group();
    const customAvatarContainer = new THREE.Group();
    playerGroup.add(proceduralAvatarGroup);
    playerGroup.add(customAvatarContainer);

    // Procedural avatar materials with preset support
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2e5c54, roughness: 0.8 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x4a3b2c, roughness: 0.9 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x20150f, roughness: 0.9 });
    const packMat = new THREE.MeshStandardMaterial({ color: 0x7a4920, roughness: 0.8 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00f5d4, emissive: 0x00f5d4, emissiveIntensity: 0.8, roughness: 0.2 });

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

    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.18), visorMat);
    visorMesh.position.set(0, 1.72, 0.2);
    visorMesh.visible = false;

    proceduralAvatarGroup.add(
      playerTorso,
      playerHead,
      playerHair,
      playerBackpack,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      visorMesh
    );
    scene.add(playerGroup);

    // Animation mixer reference for rigged GLB models
    let customAnimMixer: THREE.AnimationMixer | null = null;
    let customWalkAction: THREE.AnimationAction | null = null;
    let customIdleAction: THREE.AnimationAction | null = null;
    let hasCustomModel = false;

    const applySkinPreset = (preset: 'default' | 'tactical' | 'castaway' | 'robot') => {
      hasCustomModel = false;
      customAvatarContainer.clear();
      if (customAnimMixer) {
        customAnimMixer.stopAllAction();
        customAnimMixer = null;
      }
      proceduralAvatarGroup.visible = true;
      visorMesh.visible = preset === 'robot';

      if (preset === 'default') {
        shirtMat.color.setHex(0x2e5c54);
        pantsMat.color.setHex(0x4a3b2c);
        hairMat.color.setHex(0x20150f);
        packMat.color.setHex(0x7a4920);
      } else if (preset === 'tactical') {
        shirtMat.color.setHex(0x212529);
        pantsMat.color.setHex(0x2b2d42);
        hairMat.color.setHex(0x1a1a1a);
        packMat.color.setHex(0x111111);
      } else if (preset === 'castaway') {
        shirtMat.color.setHex(0x1d3557);
        pantsMat.color.setHex(0x8d775f);
        hairMat.color.setHex(0x8c5e34);
        packMat.color.setHex(0x403d39);
      } else if (preset === 'robot') {
        shirtMat.color.setHex(0x78909c);
        pantsMat.color.setHex(0x37474f);
        hairMat.color.setHex(0x263238);
        packMat.color.setHex(0x00bcd4);
      }
    };

    const processLoadedGltf = (gltf: any, name: string) => {
      customAvatarContainer.clear();
      if (customAnimMixer) {
        customAnimMixer.stopAllAction();
        customAnimMixer = null;
      }

      const model = gltf.scene;

      // Auto scale model to survivor height (~1.85m)
      const bbox = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const h = size.y > 0.05 ? size.y : 1;
      const targetHeight = 1.85;
      const scale = targetHeight / h;
      model.scale.set(scale, scale, scale);

      // Re-align origin so feet rest exactly on ground (y = 0)
      const scaledBBox = new THREE.Box3().setFromObject(model);
      model.position.y = -scaledBBox.min.y;
      model.position.x = -(scaledBBox.min.x + scaledBBox.max.x) / 2;
      model.position.z = -(scaledBBox.min.z + scaledBBox.max.z) / 2;

      model.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      customAvatarContainer.add(model);
      proceduralAvatarGroup.visible = false;
      hasCustomModel = true;

      // Setup rigged animations if present
      if (gltf.animations && gltf.animations.length > 0) {
        customAnimMixer = new THREE.AnimationMixer(model);
        const walkClip = gltf.animations.find((a: any) => /walk|run|move/i.test(a.name)) || gltf.animations[0];
        const idleClip = gltf.animations.find((a: any) => /idle|stand/i.test(a.name));
        if (walkClip) {
          customWalkAction = customAnimMixer.clipAction(walkClip);
        }
        if (idleClip) {
          customIdleAction = customAnimMixer.clipAction(idleClip);
          customIdleAction.play();
        } else if (customWalkAction) {
          customWalkAction.play();
        }
      }

      sound.playCraftSuccess();
      hudCallbacksRef.current.showGatherToast(`✨ ${name} sikeresen beállítva fő karakterként!`, '👤');
    };

    const loadCustomModelFromBuffer = async (buffer: ArrayBuffer, name: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const loader = new GLTFLoader();
        loader.parse(
          buffer,
          '',
          (gltf) => {
            processLoadedGltf(gltf, name);
            resolve(true);
          },
          (err) => {
            console.error('Error parsing GLTF:', err);
            hudCallbacksRef.current.triggerFloatingNotice('Nem sikerült feldolgozni a 3D modellt!', 'warn');
            resolve(false);
          }
        );
      });
    };

    const loadCustomModelFromUrl = async (url: string, name: string = '3D Karakter'): Promise<boolean> => {
      return new Promise((resolve) => {
        const loader = new GLTFLoader();
        loader.load(
          url,
          (gltf) => {
            processLoadedGltf(gltf, name);
            resolve(true);
          },
          undefined,
          (err) => {
            console.error('Error loading GLTF from URL:', err);
            hudCallbacksRef.current.triggerFloatingNotice('Nem sikerült betölteni a modellt az URL címről!', 'warn');
            resolve(false);
          }
        );
      });
    };

    avatarControllerRef.current = {
      loadCustomModelFromBuffer,
      loadCustomModelFromUrl,
      setSkinPreset: applySkinPreset,
      clearCustomModel: () => {
        applySkinPreset('default');
      },
    };

    // Load saved avatar model from IndexedDB on startup if available
    getSavedCustomModel().then((saved) => {
      if (saved && saved.buffer) {
        loadCustomModelFromBuffer(saved.buffer, saved.name).then((ok) => {
          if (ok) {
            setActiveSkin('custom');
            setCustomModelName(saved.name);
          }
        });
      }
    });

    // Camera Orbit State (horizontal yaw, vertical pitch, distance)
    const cam = {
      yaw: 0, // radians around character
      pitch: 0.35, // elevation angle (~20 degrees downward perspective)
      distance: 7.0, // distance to character
    };

    // Player position and character orientation state (Spawn at Coast Base: x: 80, z: 1255)
    const player = {
      pos: new THREE.Vector3(80, getGroundHeight(80, 1255) + 1.8, 1255),
      velocity: new THREE.Vector3(),
      charYaw: Math.PI, // Facing North towards the 850m volcanic peak
      isGrounded: true,
      speed: 16, // Balanced walking speed across 10 km2 terrain
    };

    resetCameraRef.current = () => {
      cam.yaw = player.charYaw + Math.PI;
      cam.pitch = 0.35;
      cam.distance = 7.0;
    };

    // Instant Teleport / Waypoint Fast-Travel helper
    teleportPlayerRef.current = (targetX: number, targetZ: number, zoneName?: string) => {
      player.pos.x = targetX;
      player.pos.z = targetZ;
      const gh = getGroundHeight(targetX, targetZ);
      player.pos.y = gh + 1.8;
      player.velocity.set(0, 0, 0);
      sound.playCraftSuccess();
      if (zoneName) {
        hudCallbacksRef.current.showGatherToast(`🚀 Teleportálva: ${zoneName} (${Math.round(gh)}m)`, '📍');
      }
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
        if (buildModeRef.current.active) {
          setBuildRotation((r) => (r + 90) % 360);
          sound.playClick();
          e.preventDefault();
          return;
        }
        resetCameraRef.current();
      }
      if (buildModeRef.current.active) {
        if (e.code === 'KeyQ') {
          setBuildElevation((prev) => Math.max(0, prev - 1));
          sound.playClick();
        } else if (e.code === 'KeyT') {
          setBuildElevation((prev) => Math.min(4, prev + 1));
          sound.playClick();
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Raycasting for clickable 3D objects
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();
    let playerArmSwing = 0;

    const checkRaycastHit = (clientX: number, clientY: number): { prop: InteractiveProp; point: THREE.Vector3 } | null => {
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseCoord, camera);

      const clickableMeshes: THREE.Object3D[] = [];
      for (const item of interactables) {
        clickableMeshes.push(item.mesh);
      }

      const intersects = raycaster.intersectObjects(clickableMeshes, true);
      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj) {
          if (hitObj.userData?.prop) {
            return { prop: hitObj.userData.prop, point: intersects[0].point };
          }
          hitObj = hitObj.parent;
        }
      }
      return null;
    };

    const handle3DObjectClick = (clientX: number, clientY: number): boolean => {
      // 1. If in 3D Modular Build Mode
      if (buildModeRef.current.active) {
        if (buildModeRef.current.subMode === 'build') {
          handlePlaceCurrentPiece();
          return true;
        }

        // SubMode is demolish or insulate: raycast into modularBaseGroup
        if (container) {
          const rect = container.getBoundingClientRect();
          mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
          mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouseCoord, camera);
          const modularHits = raycaster.intersectObjects(modularBaseGroup.children, true);
          if (modularHits.length > 0) {
            let hitObj: THREE.Object3D | null = modularHits[0].object;
            while (hitObj && !hitObj.userData?.pieceId) {
              hitObj = hitObj.parent;
            }
            if (hitObj && hitObj.userData?.pieceId) {
              const pId = hitObj.userData.pieceId;
              if (buildModeRef.current.subMode === 'demolish') {
                handleDemolishPiece(pId);
                return true;
              } else if (buildModeRef.current.subMode === 'insulate') {
                handleInsulatePiece(pId);
                return true;
              }
            }
          }
        }
        return false;
      }

      // 2. Normal Mode: Check if user clicked on openable door / window in modular base
      if (container) {
        const rect = container.getBoundingClientRect();
        mouseCoord.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);
        const modularHits = raycaster.intersectObjects(modularBaseGroup.children, true);
        if (modularHits.length > 0) {
          let hitObj: THREE.Object3D | null = modularHits[0].object;
          while (hitObj && !hitObj.userData?.pieceId) {
            hitObj = hitObj.parent;
          }
          if (hitObj && hitObj.userData?.pieceId) {
            const pId = hitObj.userData.pieceId;
            const targetPiece = currentPiecesRef.current.find((p) => p.id === pId);
            if (
              targetPiece &&
              (targetPiece.type === 'door' ||
                targetPiece.type === 'doorframe' ||
                targetPiece.type === 'window' ||
                targetPiece.type === 'windowframe' ||
                targetPiece.type === 'hatchframe')
            ) {
              const nextOpen = !targetPiece.isOpen;
              sound.playMine();
              hudCallbacksRef.current.showGatherToast(
                `${PIECE_BLUEPRINTS[targetPiece.type].nameHu}: ${nextOpen ? 'Kinyitva 🔓' : 'Becsukva 🔒'}`,
                nextOpen ? '🚪' : '🔒'
              );
              const updated = currentPiecesRef.current.map((p) =>
                p.id === pId ? { ...p, isOpen: nextOpen } : p
              );
              currentPiecesRef.current = updated;
              rebuildModularBase(updated);
              if (callbacksRef.current.onUpdateModularBase) {
                callbacksRef.current.onUpdateModularBase(updated);
              }
              return true;
            }
          }
        }
      }

      // 3. Fall through to interactive props (trees, stones, campfire, etc.)
      const hit = checkRaycastHit(clientX, clientY);
      if (!hit) return false;

      const { prop, point } = hit;
      const dist = player.pos.distanceTo(prop.mesh.position);

      if (dist > 38.0) {
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice(
          `${prop.nameHu} túl messze van (${Math.round(dist)}m)! Lépj közelebb (max 35m) a gyűjtéshez.`,
          'warn'
        );
        return true;
      }

      // In range: trigger resource gathering / interaction!
      playerArmSwing = 1.0;
      prop.action(point);
      return true;
    };

    // Desktop mouse look: supports both click-and-drag and pointer lock, plus 3D raycast clicking
    let isMouseDown = false;
    let mouseDownPos = { x: 0, y: 0 };
    let mouseDownTime = 0;
    let hasMouseDragged = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastHoverTime = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        mouseDownPos = { x: e.clientX, y: e.clientY };
        mouseDownTime = performance.now();
        hasMouseDragged = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isMouseDown && !hasMouseDragged && performance.now() - mouseDownTime < 450) {
        handle3DObjectClick(e.clientX, e.clientY);
      }
      isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === container) {
        cam.yaw -= e.movementX * 0.003;
        cam.pitch = Math.max(-0.35, Math.min(1.3, cam.pitch + e.movementY * 0.003));
      } else if (isMouseDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        if (Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y) > 7) {
          hasMouseDragged = true;
        }
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        cam.yaw -= dx * 0.0055;
        cam.pitch = Math.max(-0.35, Math.min(1.3, cam.pitch + dy * 0.0055));
      } else {
        // Desktop Hover Check (throttled)
        const now = performance.now();
        if (now - lastHoverTime > 50) {
          lastHoverTime = now;
          const hit = checkRaycastHit(e.clientX, e.clientY);
          if (hit) {
            container.style.cursor = 'pointer';
            const dist = player.pos.distanceTo(hit.prop.mesh.position);
            hudCallbacksRef.current.setHoverInfo({
              nameHu: hit.prop.nameHu,
              resourceLabel: hit.prop.resourceLabel,
              type: hit.prop.type,
              dist: Math.round(dist),
              inRange: dist <= 38.0,
            });
          } else {
            container.style.cursor = 'default';
            hudCallbacksRef.current.setHoverInfo(null);
          }
        }
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

    // Touch look handling on canvas & direct tap to gather
    let touchLook = { x: 0, y: 0, active: false, id: -1 };
    let touchStartPos = { x: 0, y: 0 };
    let touchStartTime = 0;
    let hasTouchDragged = false;
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
        if ((relX > rect.width * 0.35 || relY < rect.height * 0.5) && !touchLook.active) {
          touchLook = { x: t.clientX, y: t.clientY, active: true, id: t.identifier };
          touchStartPos = { x: t.clientX, y: t.clientY };
          touchStartTime = performance.now();
          hasTouchDragged = false;
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
          if (Math.hypot(t.clientX - touchStartPos.x, t.clientY - touchStartPos.y) > 9) {
            hasTouchDragged = true;
          }
          touchLook.x = t.clientX;
          touchLook.y = t.clientY;

          cam.yaw -= dx * 0.007;
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
          if (!hasTouchDragged && performance.now() - touchStartTime < 400) {
            handle3DObjectClick(touchStartPos.x, touchStartPos.y);
          }
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
    let lastGpsUpdateSlot = 0;
    const nearestPropRef: { current: InteractiveProp | null } = { current: null };

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Animate water & campfire flicker
      waterMat.opacity = 0.82 + Math.sin(time * 0.002) * 0.05;
      firePointLight.intensity = 2.2 + Math.sin(time * 0.02) * 0.5 + Math.cos(time * 0.035) * 0.3;

      // Companion (Maya Vance) life-like procedural animation:
      // Subtle terrain ground lock + breathing, ponytail ocean breeze sway, and head-tracking
      companionGroup.position.y = getGroundHeight(companionGroup.position.x, companionGroup.position.z) + Math.sin(time * 0.0025) * 0.03;
      if (companionGroup.userData.chest) {
        const breath = Math.sin(time * 0.003) * 0.02;
        companionGroup.userData.chest.scale.set(1 + breath, 1, 1 + breath);
      }
      if (companionGroup.userData.ponytailPivot) {
        companionGroup.userData.ponytailPivot.rotation.z = Math.sin(time * 0.002) * 0.08;
        companionGroup.userData.ponytailPivot.rotation.x = -0.45 + Math.cos(time * 0.003) * 0.05;
      }
      if (companionGroup.userData.headPivot) {
        const dx = player.pos.x - companionGroup.position.x;
        const dz = player.pos.z - companionGroup.position.z;
        const distToPlayer = Math.sqrt(dx * dx + dz * dz);
        if (distToPlayer < 12.0) {
          // Turn head to look at the player when within 12 meters
          const targetYaw = Math.atan2(dx, dz) - companionGroup.rotation.y;
          const clampedYaw = Math.max(-1.2, Math.min(1.2, targetYaw));
          companionGroup.userData.headPivot.rotation.y += (clampedYaw - companionGroup.userData.headPivot.rotation.y) * 0.06;
          const dy = (player.pos.y + 1.5) - (companionGroup.position.y + 1.6);
          const targetPitch = Math.max(-0.35, Math.min(0.35, Math.atan2(dy, Math.max(1.0, distToPlayer))));
          companionGroup.userData.headPivot.rotation.x += (targetPitch - companionGroup.userData.headPivot.rotation.x) * 0.06;
        } else {
          // Relaxed idling look forward
          companionGroup.userData.headPivot.rotation.y += (0 - companionGroup.userData.headPivot.rotation.y) * 0.04;
          companionGroup.userData.headPivot.rotation.x += (0 - companionGroup.userData.headPivot.rotation.x) * 0.04;
        }
      }

      // Crystal spin
      crystal.rotation.y = time * 0.001;
      crystal.rotation.x = Math.sin(time * 0.0015) * 0.3;

      // Process input movement vector
      const moveVec = new THREE.Vector3();
      const vKeys = virtualKeysRef.current;
      const isSprinting = keys['ShiftLeft'] || keys['ShiftRight'] || vKeys.sprint;
      const currentSpeed = isSprinting ? player.speed * 2.8 : player.speed;

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
        cam.distance = Math.max(2.5, cam.distance - 8.0 * dt);
      }
      if (vKeys.zoomOut || keys['NumpadSubtract']) {
        cam.distance = Math.min(25, cam.distance + 8.0 * dt);
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
        player.velocity.y = 12.0;
        player.isGrounded = false;
        sound.playClick();
      }

      // Gravity & Ground snap
      player.velocity.y -= 26 * dt;
      player.pos.y += player.velocity.y * dt;

      const gHeight = getGroundHeight(player.pos.x, player.pos.z) + 1.8;
      if (player.pos.y <= gHeight) {
        player.pos.y = gHeight;
        player.velocity.y = 0;
        player.isGrounded = true;
      }

      // Boundary: keep within 10 km2 island & continental shelf perimeter (R ~ 2150m)
      const pDist = Math.hypot(player.pos.x, player.pos.z);
      if (pDist > 2150) {
        player.pos.setLength(2150);
        sound.playDangerWarning();
        hudCallbacksRef.current.triggerFloatingNotice(
          '⚠️ Elérted a nyílt óceán peremét (-30m mélység)! Erős áramlatok és cápák tartanak vissza.',
          'warn'
        );
      }

      // Update Survivor 3D Character Model (independent facing)
      playerGroup.position.set(player.pos.x, player.pos.y - 1.8, player.pos.z);
      playerGroup.rotation.y = player.charYaw;
      playerGroup.visible = cameraMode === 'tps';

      // Limb swing walking animation & tool swing
      if (playerArmSwing > 0) {
        playerArmSwing = Math.max(0, playerArmSwing - dt * 3.5);
        rightArm.rotation.x = -Math.sin(playerArmSwing * Math.PI) * 1.6;
      }

      // Skeletal animations or procedural bobbing for custom GLB models
      if (customAnimMixer) {
        customAnimMixer.update(dt);
        if (customWalkAction && customIdleAction) {
          if (isMoving && !customWalkAction.isRunning()) {
            customIdleAction.fadeOut(0.2);
            customWalkAction.reset().fadeIn(0.2).play();
          } else if (!isMoving && customWalkAction.isRunning()) {
            customWalkAction.fadeOut(0.2);
            customIdleAction.reset().fadeIn(0.2).play();
          }
        }
      } else if (hasCustomModel) {
        // Dynamic tilt & stride bobbing for static 3D models (like Tripo exports)
        customAvatarContainer.position.y = isMoving ? Math.abs(Math.sin(time * 0.014)) * 0.07 : 0;
        customAvatarContainer.rotation.z = isMoving ? Math.sin(time * 0.011) * 0.05 : 0;
      }

      if (isMoving) {
        const walkCycle = time * 0.012 * (isSprinting ? 1.6 : 1.1);
        leftLeg.rotation.x = Math.sin(walkCycle) * 0.55;
        rightLeg.rotation.x = -Math.sin(walkCycle) * 0.55;
        leftArm.rotation.x = -Math.sin(walkCycle) * 0.5;
        if (playerArmSwing <= 0) {
          rightArm.rotation.x = Math.sin(walkCycle) * 0.5;
        }
        playerTorso.position.y = 1.1 + Math.abs(Math.sin(walkCycle)) * 0.05;
      } else {
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        if (playerArmSwing <= 0) {
          rightArm.rotation.x = 0;
        }
        playerTorso.position.y = 1.1;
      }

      // Animate active 3D particle bursts
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.life += dt;
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 11.5 * dt; // gravity
        const progress = p.life / p.maxLife;
        const scale = Math.max(0.001, 1 - progress);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life >= p.maxLife) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          if (p.mesh.material instanceof THREE.Material) {
            p.mesh.material.dispose();
          }
          activeParticles.splice(i, 1);
        }
      }

      // Animate prop shake wobble upon hit
      for (const item of interactables) {
        if (item.mesh.userData?.shake && item.mesh.userData.shake > 0.001) {
          item.mesh.userData.shake = Math.max(0, item.mesh.userData.shake - dt * 1.8);
          const s = item.mesh.userData.shake;
          item.mesh.rotation.z = Math.sin(time * 0.045) * s * 0.22;
        } else if (item.mesh.userData?.shake !== undefined) {
          item.mesh.rotation.z = 0;
        }
      }

      // Real-time GPS and Altitude update (throttled to ~4 times/sec)
      const pAlt = Math.round(player.pos.y - 1.8);
      if (Math.floor(time / 250) !== lastGpsUpdateSlot) {
        lastGpsUpdateSlot = Math.floor(time / 250);
        setPlayerGps({
          x: Math.round(player.pos.x),
          z: Math.round(player.pos.z),
          alt: pAlt,
        });
      }

      // Detect active zone by 10 km2 coordinates and altitude
      if (pDist > 1780) {
        setCurrentZoneName(`Nyílt Óceán & Veszélyes Mélyvíz (${pAlt >= 0 ? `+${pAlt}m` : `${pAlt}m`})`);
      } else if (Math.hypot(player.pos.x - (-80), player.pos.z - (-690)) < 750 || pAlt > 350) {
        setCurrentZoneName(`Kihűlt Vulkán & Kaldera (+${pAlt}m • Max +850m)`);
      } else if (Math.hypot(player.pos.x - 720, player.pos.z - (-450)) < 460 || (player.pos.x > 380 && player.pos.z < -100)) {
        setCurrentZoneName(`Ősi Romok & Templomhegy (+${pAlt}m)`);
      } else if (Math.hypot(player.pos.x - 650, player.pos.z - 650) < 520 || (player.pos.x > 280 && player.pos.z > 280)) {
        setCurrentZoneName(`Mocsárvidék & Iszapmező (+${pAlt}m)`);
      } else if (Math.hypot(player.pos.x - (-350), player.pos.z - 200) < 600 || (player.pos.z < 600 && player.pos.z > -250 && player.pos.x < 250)) {
        setCurrentZoneName(`Trópusi Esőerdő & Roncs (+${pAlt}m)`);
      } else {
        setCurrentZoneName(`Partvidék & Sekély Zátonyok (+${pAlt}m)`);
      }

      // Check proximity to interactables
      let closest: InteractiveProp | null = null;
      let closestDist = 8.0;
      for (const item of interactables) {
        const d = player.pos.distanceTo(item.mesh.position);
        if (d < closestDist) {
          closest = item;
          closestDist = d;
        }
      }

      // Proximity to Companion
      const distToComp = player.pos.distanceTo(companionGroup.position);
      if (distToComp < 6.0) {
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

      // Update 3D Modular Base Hologram & Snapping Preview
      if (buildModeRef.current.active) {
        buildGridHelper.visible = true;

        // Aim ~5.5m in front of player orientation
        const aimDist = 5.2;
        const aimX = player.pos.x - Math.sin(cam.yaw) * aimDist;
        const aimZ = player.pos.z - Math.cos(cam.yaw) * aimDist;

        // Snap to 2x2m grid relative to BASE_ORIGIN
        const snapGridX = Math.round((aimX - BASE_ORIGIN.x) / 2.0);
        const snapGridZ = Math.round((aimZ - BASE_ORIGIN.z) / 2.0);
        const elev = buildModeRef.current.elevation;
        const curPieceType = buildModeRef.current.pieceType;
        const curTier = buildModeRef.current.tier;
        const curRotation = buildModeRef.current.rotation;

        // Check placement validity
        let isValid = true;
        let previewSI = 100;

        if (curPieceType === 'foundation' || curPieceType === 'stairs_1m') {
          if (elev !== 0) isValid = false;
          previewSI = 100;
        } else {
          if (elev === 0) {
            const hasFoundation = currentPiecesRef.current.some(
              (p) => p.gridX === snapGridX && p.gridZ === snapGridZ && (p.type === 'foundation' || p.elevation === elev)
            );
            isValid = hasFoundation || currentPiecesRef.current.length === 0;
            previewSI = 100;
          } else {
            const pieceBelow = currentPiecesRef.current.find(
              (p) => p.gridX === snapGridX && p.gridZ === snapGridZ && p.elevation === elev - 1
            );
            if (pieceBelow) {
              previewSI = Math.max(10, pieceBelow.si - 10);
              isValid = true;
            } else {
              const adjacent = currentPiecesRef.current.find(
                (p) =>
                  p.elevation === elev &&
                  Math.abs(p.gridX - snapGridX) + Math.abs(p.gridZ - snapGridZ) === 1
              );
              if (adjacent && adjacent.si >= 60) {
                previewSI = Math.max(10, adjacent.si - 50);
                isValid = true;
              } else {
                isValid = false;
                previewSI = 0;
              }
            }
          }
        }

        const affordRes = canAffordPiece(curPieceType, curTier, callbacksRef.current.gameState.inventory);
        const canAfford = affordRes.canAfford;
        const canPlace = isValid && canAfford;

        // Update Ghost hologram mesh
        const ghostKey = `${curPieceType}-${curTier}-${canPlace}-${curRotation}`;
        if (!ghostGroup || ghostGroup.userData.key !== ghostKey) {
          if (ghostGroup) scene.remove(ghostGroup);
          ghostGroup = createGhostPreviewGroup(curPieceType, curTier, canPlace);
          ghostGroup.userData.key = ghostKey;
          scene.add(ghostGroup);
        }

        const targetGhostX = BASE_ORIGIN.x + snapGridX * 2.0;
        const targetGhostZ = BASE_ORIGIN.z + snapGridZ * 2.0;
        const targetGhostY = baseOriginGroundY + elev * 2.0;

        ghostGroup.position.set(targetGhostX, targetGhostY, targetGhostZ);
        ghostGroup.rotation.y = (curRotation * Math.PI) / 180;
        ghostGroup.visible = true;

        snapStatusRef.current = {
          x: snapGridX,
          z: snapGridZ,
          elevation: elev,
          si: previewSI,
          isValid,
          canAfford,
        };
      } else {
        buildGridHelper.visible = false;
        if (ghostGroup) ghostGroup.visible = false;
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
      for (const p of activeParticles) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        if (p.mesh.material instanceof THREE.Material) {
          p.mesh.material.dispose();
        }
      }
      activeParticles.length = 0;
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [cameraMode]);

  // Touch button action trigger
  // Avatar management handlers
  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(glb|gltf)$/i)) {
      setModelError('Kérlek .glb vagy .gltf kiterjesztésű 3D modellt válassz!');
      return;
    }
    setIsModelLoading(true);
    setModelError(null);
    setModelSuccessMsg(null);
    try {
      const record = await saveCustomModel(file);
      if (avatarControllerRef.current) {
        const ok = await avatarControllerRef.current.loadCustomModelFromBuffer(record.buffer, file.name);
        if (ok) {
          setActiveSkin('custom');
          setCustomModelName(file.name);
          setModelSuccessMsg(`"${file.name}" sikeresen beállítva és elmentve!`);
        } else {
          setModelError('A 3D modell betöltése sikertelen volt.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setModelError(err.message || 'Hiba történt a fájl mentésekor.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!customUrlInput.trim()) return;
    setIsModelLoading(true);
    setModelError(null);
    setModelSuccessMsg(null);
    try {
      if (avatarControllerRef.current) {
        const ok = await avatarControllerRef.current.loadCustomModelFromUrl(customUrlInput.trim(), 'Webes GLB Modell');
        if (ok) {
          setActiveSkin('custom');
          setCustomModelName('Webes GLB Modell');
          setModelSuccessMsg('A 3D modell sikeresen betöltve az URL-ről!');
        } else {
          setModelError('Nem sikerült betölteni a 3D modellt erről a webcímről.');
        }
      }
    } catch (err: any) {
      setModelError('Hiba történt a letöltés során.');
    } finally {
      setIsModelLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    await clearSavedCustomModel();
    if (avatarControllerRef.current) {
      avatarControllerRef.current.clearCustomModel();
    }
    setActiveSkin('default');
    setCustomModelName(null);
    setModelSuccessMsg('Visszaállítva az alapértelmezett túlélő karakterre.');
  };

  const handleSelectPreset = (preset: 'default' | 'tactical' | 'castaway' | 'robot') => {
    if (avatarControllerRef.current) {
      avatarControllerRef.current.setSkinPreset(preset);
    }
    setActiveSkin(preset);
    sound.playClick();
  };

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
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="bg-slate-900/90 border border-emerald-800/80 rounded-lg px-3 py-1.5 flex items-center gap-2 backdrop-blur shadow-lg">
            <Compass className="w-4 h-4 text-emerald-400 animate-spin-slow shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-100">{currentZoneName}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 hidden sm:inline">
                  10 km² Sziget
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-stone-300">GPS: X: <strong className="text-cyan-300">{playerGps.x}m</strong>, Z: <strong className="text-cyan-300">{playerGps.z}m</strong></span>
                <span className="text-stone-600">•</span>
                <span className={playerGps.alt >= 0 ? "text-emerald-300 font-bold" : "text-cyan-400 font-bold"}>
                  Magasság: {playerGps.alt >= 0 ? `+${playerGps.alt}m` : `${playerGps.alt}m`} (Max: +850m)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* 3D Modular Base Building Mode Toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setBuildModeActive(!buildModeActive);
            }}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow ${
              buildModeActive
                ? 'bg-amber-600 border-amber-400 text-white shadow-amber-900/50 ring-1 ring-amber-400/50'
                : 'bg-slate-900/90 hover:bg-slate-800 border-stone-700 text-stone-300'
            }`}
            title="3D Moduláris Építő Mód (2x2m Grid & Snapping, Szalma/Fa/Kő, SI Stabilitás)"
          >
            <Hammer className={`w-4 h-4 ${buildModeActive ? 'text-white animate-bounce' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">3D Építés</span>
            {buildModeActive && (
              <span className="text-[10px] bg-amber-800 px-1.5 py-0.2 rounded font-bold">AKTÍV</span>
            )}
          </button>

          {/* Waypoints Quick-Travel Dropdown Button */}
          <button
            onClick={() => {
              sound.playClick();
              setShowWaypointsMenu(!showWaypointsMenu);
            }}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow ${
              showWaypointsMenu
                ? 'bg-cyan-700 border-cyan-400 text-white ring-1 ring-cyan-400/50'
                : 'bg-slate-900/90 hover:bg-slate-800 border-stone-700 text-stone-300'
            }`}
            title="Gyorsutazás / Teleportálási pontok (10 km² helyszínek)"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Gyorsugrás</span>
          </button>

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

          {/* Character 3D Model Customization button */}
          <button
            onClick={() => {
              sound.playClick();
              setCharacterModalOpen(true);
            }}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition shadow ${
              activeSkin === 'custom'
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-400 text-white ring-1 ring-amber-400/50'
                : 'bg-slate-900/90 hover:bg-slate-800 border-stone-700 text-stone-300'
            }`}
            title="3D Karakter Modell & Testreszabás (Tripo3D, GLB feltöltés)"
          >
            <User className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Karakter</span>
            {activeSkin === 'custom' && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
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

      {/* Waypoints Quick-Travel Dropdown Menu */}
      {showWaypointsMenu && (
        <div className="absolute top-16 right-3 z-40 bg-slate-900/95 border border-cyan-500/80 rounded-xl p-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 max-w-xs w-full">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-800">
            <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              Gyorsugrás a 10 km² szigeten
            </span>
            <button
              onClick={() => setShowWaypointsMenu(false)}
              className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-stone-400 mb-2 leading-relaxed">
            Azonnali teleportálás a sziget 5 fő zónájába a hatalmas távolságok és magasságok gyors felfedezéséhez:
          </p>
          <div className="flex flex-col gap-1.5">
            {WAYPOINTS.map((wp) => (
              <button
                key={wp.id}
                onClick={() => {
                  teleportPlayerRef.current(wp.x, wp.z, wp.name);
                  setShowWaypointsMenu(false);
                }}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-900/50 border border-stone-700/80 hover:border-cyan-500 transition text-left group"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-200 group-hover:text-cyan-200">
                    {wp.name}
                  </span>
                  <span className="text-[9px] text-stone-400">{wp.desc}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded border border-emerald-900/60 shrink-0 ml-2">
                  {wp.elev}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hover Inspection Badge on 3D Objects */}
      {hoverInfo && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-30 transition-all duration-150 animate-in fade-in zoom-in-95">
          <div
            className={`px-3.5 py-2 rounded-xl backdrop-blur-md border shadow-2xl flex items-center gap-3 ${
              hoverInfo.inRange
                ? 'bg-slate-900/95 border-emerald-500/80 text-emerald-100 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/95 border-amber-500/70 text-amber-100 ring-1 ring-amber-500/30'
            }`}
          >
            <span className="text-xl shrink-0">
              {hoverInfo.type === 'tree'
                ? '🌴'
                : hoverInfo.type === 'rock'
                ? '⛏️'
                : hoverInfo.type === 'herb'
                ? '🌿'
                : hoverInfo.type === 'crate'
                ? '📦'
                : hoverInfo.type === 'driftwood'
                ? '🪵'
                : '✨'}
            </span>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">{hoverInfo.nameHu}</span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    hoverInfo.inRange ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                  }`}
                >
                  {hoverInfo.dist}m {hoverInfo.inRange ? '• Hatótávon belül' : '• Lépj közelebb'}
                </span>
              </div>
              {hoverInfo.resourceLabel && (
                <span className="text-[10px] text-stone-300 font-medium mt-0.5">
                  Nyersanyag: <span className="text-stone-100 font-semibold">{hoverInfo.resourceLabel}</span>
                </span>
              )}
              <span className="text-[9px] font-semibold mt-0.5 text-emerald-400">
                {hoverInfo.inRange ? '👉 Kattints / Érints a 3D begyűjtéshez!' : 'Max 20 méter távolságból gyűjthető'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notice Banner (e.g. out-of-range warnings) */}
      {floatingNotice && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-in fade-in slide-in-from-top-2">
          <div
            className={`px-4 py-2 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2.5 border backdrop-blur-md ${
              floatingNotice.type === 'warn'
                ? 'bg-amber-950/95 border-amber-500/80 text-amber-200'
                : 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{floatingNotice.text}</span>
          </div>
        </div>
      )}

      {/* Real-time Gathering Loot Toasts (Top Right) */}
      <div className="absolute top-16 right-3 flex flex-col gap-2 pointer-events-none z-30 max-w-xs">
        {gatheringToasts.map((toast) => (
          <div
            key={toast.id}
            className="bg-slate-900/95 border border-emerald-500/80 text-white px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-right-4 duration-150 backdrop-blur"
          >
            <span className="text-lg shrink-0">{toast.icon}</span>
            <span className="text-xs font-bold text-emerald-200 tracking-wide">{toast.text}</span>
          </div>
        ))}
      </div>

      {/* Proximity Interaction Prompt (Companion & Camp) */}
      {interactionPrompt && !hoverInfo && (
        <div
          onClick={handleTriggerAction}
          className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-emerald-500 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2.5 animate-bounce pointer-events-auto cursor-pointer active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-white tracking-wide">{interactionPrompt}</span>
        </div>
      )}

      {/* 3D MODULAR BASE BUILDING DOCK (GDD: Trópusi Sziget Építési Rendszer) */}
      {buildModeActive && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-40 bg-slate-950/95 border border-amber-500/70 rounded-2xl shadow-2xl backdrop-blur-md p-3 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 pointer-events-auto">
          {/* Top Row: Sub-mode tabs, Tier selector, Close button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-800">
            {/* Sub-modes */}
            <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-800">
              <button
                onClick={() => {
                  sound.playClick();
                  setBuildSubMode('build');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  buildSubMode === 'build'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Építés</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBuildSubMode('insulate');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  buildSubMode === 'insulate'
                    ? 'bg-orange-700 text-white shadow'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Agyagréteg felvitele külső falakra és tetőre (3 Agyag, 2 Pálmalevél)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Szigetelés</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setBuildSubMode('demolish');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  buildSubMode === 'demolish'
                    ? 'bg-red-700 text-white shadow'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800'
                }`}
                title="Elem visszabontása 50% nyersanyag-visszatérítéssel. Figyelj a láncreakciós összeomlásra!"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bontás (50% Refund)</span>
              </button>
            </div>

            {/* Tier selector (only when in build mode) */}
            {buildSubMode === 'build' && (
              <div className="flex items-center gap-1">
                {(['thatch', 'wood', 'stone'] as BuildingTier[]).map((t) => {
                  const cfg = TIER_CONFIG[t];
                  const isAvailable = PIECE_BLUEPRINTS[buildPieceType]?.allowedTiers.includes(t);
                  return (
                    <button
                      key={t}
                      disabled={!isAvailable}
                      onClick={() => {
                        sound.playClick();
                        setBuildTier(t);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        buildTier === t
                          ? `${cfg.badgeClass} ring-1 ring-amber-400 font-bold`
                          : isAvailable
                          ? 'bg-stone-900/80 border-stone-700 text-stone-400 hover:text-stone-200'
                          : 'opacity-40 cursor-not-allowed bg-stone-950 border-stone-900 text-stone-600'
                      }`}
                    >
                      {cfg.nameHu.split(' ')[1]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => {
                sound.playClick();
                setBuildModeActive(false);
              }}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-stone-100 transition"
              title="Kilépés az építő módból"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* SubMode: Build -> Piece Selector & Info Strip */}
          {buildSubMode === 'build' && (
            <>
              {/* Category Pills & Pieces Horizontal Carousel / Grid */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {Object.values(PIECE_BLUEPRINTS).map((bp) => {
                  const isSelected = buildPieceType === bp.type;
                  const canAfford = canAffordPiece(bp.type, buildTier, gameState.inventory).canAfford;
                  const isTierAllowed = bp.allowedTiers.includes(buildTier);
                  return (
                    <button
                      key={bp.type}
                      disabled={!isTierAllowed}
                      onClick={() => {
                        sound.playClick();
                        setBuildPieceType(bp.type);
                      }}
                      className={`shrink-0 px-3 py-2 rounded-xl border text-left transition flex flex-col justify-between min-w-[130px] ${
                        isSelected
                          ? 'bg-amber-950/80 border-amber-500 text-white ring-1 ring-amber-400/50'
                          : isTierAllowed
                          ? canAfford
                            ? 'bg-stone-900/80 hover:bg-stone-800 border-stone-700 text-stone-300'
                            : 'bg-stone-900/40 hover:bg-stone-800/40 border-stone-800 text-stone-400'
                          : 'opacity-30 cursor-not-allowed bg-stone-950 border-stone-900 text-stone-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[11px] font-bold truncate">{bp.nameHu.split(' (')[0]}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className={canAfford ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                          {canAfford ? '✓ Készíthető' : 'Nincs elég alapanyag'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Construction HUD: Grid Snap, Elevation, Rotation, SI %, Cost & Build Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800 text-xs">
                {/* Placement Parameters: Coords, Height, Rotation */}
                <div className="flex items-center gap-2">
                  <div className="bg-stone-900/90 border border-stone-700 rounded-lg px-2.5 py-1 text-stone-300 font-mono text-[11px]">
                    Rács: <strong className="text-cyan-300">X:{snapStatus.x} Z:{snapStatus.z}</strong>
                  </div>

                  {/* Elevation (Szint) */}
                  <div className="bg-stone-900/90 border border-stone-700 rounded-lg px-2 py-0.5 flex items-center gap-1.5">
                    <span className="text-[11px] text-stone-400 font-medium">Szint:</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBuildElevation((prev) => Math.max(0, prev - 1));
                      }}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center justify-center font-bold"
                      title="Szint csökkentése (Q)"
                    >
                      -
                    </button>
                    <span className="font-mono text-[11px] text-amber-300 font-bold min-w-[20px] text-center">
                      {buildElevation}F
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setBuildElevation((prev) => Math.min(4, prev + 1));
                      }}
                      className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center justify-center font-bold"
                      title="Szint növelése (T)"
                    >
                      +
                    </button>
                  </div>

                  {/* Rotation (Forgatás) */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      setBuildRotation((r) => (r + 90) % 360);
                    }}
                    className="bg-stone-900/90 hover:bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 flex items-center gap-1 text-[11px] text-stone-200 transition"
                    title="Forgatás 90 fokkal (R gomb)"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-400" />
                    <span>{buildRotation}°</span>
                  </button>

                  {/* SI Preview */}
                  <div
                    className={`border rounded-lg px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 ${
                      snapStatus.si >= 80
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                        : snapStatus.si >= 40
                        ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                        : 'bg-red-950/80 border-red-500/80 text-red-300'
                    }`}
                  >
                    <span>SI:</span>
                    <span>{snapStatus.si}%</span>
                  </div>
                </div>

                {/* Cost tags and Place Button */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
                    {Object.entries(PIECE_BLUEPRINTS[buildPieceType].cost[buildTier]).map(([item, req]) => {
                      const hasEnough = (gameState.inventory[item] || 0) >= req;
                      return (
                        <span
                          key={item}
                          className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                            hasEnough
                              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                              : 'bg-red-950/60 border-red-800/80 text-red-300'
                          }`}
                        >
                          {item}: {gameState.inventory[item] || 0}/{req}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    disabled={!snapStatus.isValid || !snapStatus.canAfford}
                    onClick={() => modularBaseControllerRef.current?.placePiece()}
                    className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${
                      snapStatus.isValid && snapStatus.canAfford
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/60 ring-1 ring-amber-400/50'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <Hammer className="w-4 h-4" />
                    <span>LERAKÁS</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SubMode: Insulate Instructions */}
          {buildSubMode === 'insulate' && (
            <div className="flex items-center justify-between gap-3 p-2 bg-orange-950/60 border border-orange-800/60 rounded-xl text-xs text-orange-200">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400 shrink-0" />
                <span>
                  <strong>Agyag / Pálmalevél szigetelés:</strong> Kattints bármelyik falra, födémre vagy tetőre a 3D nézetben!
                  (Költség: 3 Agyag, 2 Pálmalevél). Teljes szigetelés esetén a kánikulai 38°C helyett 24-26°C lesz a belső térben!
                </span>
              </div>
              <div className="shrink-0 font-mono text-[11px] bg-orange-900/60 px-2 py-1 rounded border border-orange-700/60">
                Agyag: {gameState.inventory.river_clay || 0}/3 • Levél: {gameState.inventory.palm_leaves || 0}/2
              </div>
            </div>
          )}

          {/* SubMode: Demolish Instructions */}
          {buildSubMode === 'demolish' && (
            <div className="flex items-center justify-between gap-3 p-2 bg-red-950/60 border border-red-800/60 rounded-xl text-xs text-red-200">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Bontó Mód (50% Nyersanyag-visszatérítés):</strong> Kattints a lebontani kívánt moduláris elemre a 3D nézetben!
                  Figyelem: az alapzat vagy tartófal bontása láncreakciós összeomlást (Cascading Collapse) idézhet elő a felette lévő elemeken!
                </span>
              </div>
              <span className="shrink-0 text-[10px] font-bold bg-red-900/80 px-2.5 py-1 rounded text-red-200 border border-red-700">
                Láncreakciós SI aktív
              </span>
            </div>
          )}
        </div>
      )}

      {/* ON-SCREEN TACTILE MOBILE CONTROLLER HUD */}
      {showTouchControls && !buildModeActive && (
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
              <div className="bg-stone-950 p-3 rounded-lg border border-emerald-800/80 flex items-center gap-3">
                <TreePine className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-emerald-300 block mb-0.5">Kattintható 3D Tárgyak & Bányászat:</strong>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    • <strong>Pálmafák 🌴</strong>: Kattints a fára fa rönk, pálmalevél és kókuszdió begyűjtéséhez.<br />
                    • <strong>Ásványsziklák ⛏️</strong>: Kattints rá kovakő szilánk és fémhulladék bányászatához.<br />
                    • <strong>Bokrok & Indák 🌿</strong>: Gyógynövény és indakötél szedése.<br />
                    • <strong>Ládák & Uszadékfa 📦</strong>: Ellátmány és ivóvíz közvetlen kibontása.<br />
                    • <strong>Hatótávolság</strong>: Max 20 méter. Ha közelebb mész, az egérkurzor rámutat és azonnal kattintható!
                  </p>
                </div>
              </div>

              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Mobiltelefon / Érintőképernyő:</strong>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    • <strong>Közvetlen érintés (Tap)</strong>: Érints meg bármilyen 3D fát vagy sziklát a begyűjtéshez!<br />
                    • <strong>Bal oldali D-Pad (⬆️ ⬇️ ⬅️ ➡️)</strong>: Karakter valós mozgása a szigeten.<br />
                    • <strong>⚡ Villám gomb</strong>: Sprint / Gyors futás.<br />
                    • <strong>Jobb oldali KAMERA vezérlő</strong>: 360° körbeforgatás (↺ / ↻), fel/le döntés (⬆️ / ⬇️), zoom (+ / -) és Közép reset.<br />
                    • <strong>Szabad ujjhúzás</strong>: A képernyőn húzással 360°-ban szabadon forgatható és dönthető a kamera.
                  </p>
                </div>
              </div>

              <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 flex items-center gap-3">
                <Monitor className="w-6 h-6 text-cyan-400 shrink-0" />
                <div>
                  <strong className="text-stone-100 block mb-0.5">Windows / Asztali PC:</strong>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    • <strong>Bal egérgomb kattintás</strong>: Közvetlen favágás, bányászat vagy szedés a 3D nézetben.<br />
                    • <strong>W, A, S, D</strong>: Karakter mozgás | <strong>Shift</strong>: Futás<br />
                    • <strong>Egér bal gomb húzás / Pointer Lock</strong>: 360° szabad körbeforgatás és fel-le nézés.<br />
                    • <strong>Egérgörgő</strong>: Kamera távolság zoomolása (+ / -).<br />
                    • <strong>Nyílbillentyűk vagy I, J, K, L</strong>: Kamera körbeforgatás és fel/le döntés billentyűzetről.<br />
                    • <strong>Szóköz</strong>: Ugrás | <strong>E</strong>: Gyűjtés / Beszélgetés | <strong>R</strong>: Kamera reset.
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

      {/* 3D Character Customization & Tripo/GLB Loader Modal */}
      {characterModalOpen && (
        <div
          className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setCharacterModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-amber-500/70 rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl my-auto animate-in fade-in zoom-in-95 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-amber-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    3D Karakter Modell & Testreszabás
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Importálj saját Tripo3D / GLB modellt vagy válassz stílust
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCharacterModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tripo3D Free Export Helper Box */}
            <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  Tripo3D modell ingyenes megszerzése (fizetés nélkül):
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                  99d4f46c...
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Mivel a Tripo3D ingyenes módban nem engedi az export gombot és külső letöltést, a saját böngésződből <strong>1 perc alatt ingyen lementheted</strong>:
              </p>
              <ol className="text-[11px] text-stone-300 space-y-1 list-decimal list-inside pl-1 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-stone-800/80">
                <li>Nyisd meg a böngésződben a modellt: <a href="https://studio.tripo3d.ai/3d-model/99d4f46c-d8bc-4e3c-8bb6-fec3c4441762" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-mono text-[10px]">studio.tripo3d.ai/...</a></li>
                <li>Nyomd meg az <kbd className="px-1.5 py-0.5 bg-stone-800 rounded text-amber-300 font-mono text-[10px]">F12</kbd> gombot (vagy jobb gomb → <em>Vizsgálat / Inspect</em>).</li>
                <li>Kattints a felugró ablakban a <strong>Network (Hálózat)</strong> fülre.</li>
                <li>A szűrő (Filter) mezőbe írd be: <code className="bg-stone-800 text-emerald-300 px-1 rounded">glb</code></li>
                <li>Frissítsd a lapot (<kbd className="px-1 py-0.5 bg-stone-800 rounded text-stone-200 text-[10px]">F5</kbd>).</li>
                <li>Kattints jobb gombbal a megjelenő <code className="text-emerald-400">.glb</code> sorra → <strong>Open in new tab</strong> vagy <strong>Save as...</strong>!</li>
                <li>A lementett <code className="text-white">.glb</code> fájlt húzd be az alábbi dobozba!</li>
              </ol>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-amber-400', 'bg-amber-950/20');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-amber-400', 'bg-amber-950/20');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-amber-400', 'bg-amber-950/20');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-stone-700 hover:border-amber-500/80 rounded-xl p-5 text-center transition flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 relative group"
            >
              <input
                type="file"
                accept=".glb,.gltf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Válassz ki egy .glb vagy .gltf fájlt"
              />
              <Upload className="w-8 h-8 text-amber-400 group-hover:scale-110 transition mb-2" />
              <p className="text-xs font-bold text-white mb-0.5">
                Húzd ide a letöltött <span className="text-amber-400">.GLB</span> vagy <span className="text-amber-400">.GLTF</span> fájlt
              </p>
              <p className="text-[11px] text-stone-400">
                vagy kattints a tallózáshoz a számítógépedről / telefonodról
              </p>
              <span className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Automatikus méretezés + Ütközéskezelés + Mentés IndexedDB-be
              </span>
            </div>

            {/* Direct GLB URL Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-stone-300 flex items-center justify-between">
                <span>Vagy töltsd be közvetlen webcímről (.glb link):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/character.glb"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-stone-600 outline-none transition"
                />
                <button
                  onClick={handleUrlLoad}
                  disabled={isModelLoading || !customUrlInput.trim()}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0"
                >
                  {isModelLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Betöltés</span>
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {isModelLoading && (
              <div className="p-3 bg-cyan-950/60 border border-cyan-600/60 rounded-lg flex items-center gap-2.5 text-xs text-cyan-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
                <span>3D modell feldolgozása, méretezése és beállítása a karakterhez...</span>
              </div>
            )}
            {modelSuccessMsg && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/60 rounded-lg flex items-center gap-2 text-xs text-emerald-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{modelSuccessMsg}</span>
              </div>
            )}
            {modelError && (
              <div className="p-2.5 bg-red-950/60 border border-red-600/60 rounded-lg flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modelError}</span>
              </div>
            )}

            {/* Built-in Character Skin Presets */}
            <div className="space-y-2 pt-1 border-t border-stone-800">
              <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-emerald-400" />
                Beépített túlélő stílusok (Azonnali váltás):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'default', label: 'Túlélő Felfedező', icon: '🌴', desc: 'Klasszikus zöld ing' },
                  { id: 'tactical', label: 'Taktikai Operatív', icon: '🪖', desc: 'Fekete kommandós' },
                  { id: 'castaway', label: 'Hajótörött Matróz', icon: '⚓', desc: 'Kék tengerész' },
                  { id: 'robot', label: 'Kiborg Exosuit', icon: '🤖', desc: 'Sci-fi páncélzat' },
                ].map((skin) => (
                  <button
                    key={skin.id}
                    onClick={() => handleSelectPreset(skin.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      activeSkin === skin.id
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50'
                        : 'bg-stone-950/80 hover:bg-stone-800/80 border-stone-800 text-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{skin.icon}</span>
                      {activeSkin === skin.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div>
                      <strong className="text-[11px] block text-stone-100">{skin.label}</strong>
                      <span className="text-[10px] text-stone-400">{skin.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer with Reset to Default */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              {activeSkin === 'custom' && customModelName ? (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <span className="font-mono text-[10px] bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/60 truncate max-w-[200px]">
                    Aktív: {customModelName}
                  </span>
                  <button
                    onClick={handleResetToDefault}
                    className="text-stone-400 hover:text-red-400 text-xs flex items-center gap-1 transition"
                    title="Egyéni modell törlése"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Törlés</span>
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-stone-400">
                  Stílus: <strong className="text-stone-200">{activeSkin.toUpperCase()}</strong>
                </span>
              )}

              <button
                onClick={() => setCharacterModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
              >
                Kész / Vissza a játékba
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
