import * as THREE from 'three';
import { BuildingPiece, BuildingPieceType, BuildingTier } from '../game/buildingSystem';

export const BASE_ORIGIN = { x: 80, z: 1250 };

// Material Cache for Performance and Consistency
const materialsCache = new Map<string, THREE.Material>();

function getMaterial(key: string, createFn: () => THREE.Material): THREE.Material {
  let mat = materialsCache.get(key);
  if (!mat) {
    mat = createFn();
    materialsCache.set(key, mat);
  }
  return mat;
}

export function getPieceMaterials(tier: BuildingTier, insulated: boolean) {
  const thatchColor = insulated ? 0xc2ab87 : 0xd4a359;
  const woodColor = insulated ? 0x947250 : 0x7a4e28;
  const stoneColor = insulated ? 0x9c9da0 : 0x484b50;

  const mainMat = getMaterial(`${tier}-${insulated ? 'ins' : 'raw'}`, () => {
    if (tier === 'thatch') {
      return new THREE.MeshStandardMaterial({
        color: thatchColor,
        roughness: 0.95,
        metalness: 0.05,
      });
    } else if (tier === 'wood') {
      return new THREE.MeshStandardMaterial({
        color: woodColor,
        roughness: 0.85,
        metalness: 0.08,
      });
    } else {
      return new THREE.MeshStandardMaterial({
        color: stoneColor,
        roughness: 0.88,
        metalness: 0.12,
      });
    }
  });

  const frameMat = getMaterial(`${tier}-frame`, () => {
    return new THREE.MeshStandardMaterial({
      color: tier === 'thatch' ? 0x8a6e38 : tier === 'wood' ? 0x543317 : 0x303338,
      roughness: 0.9,
    });
  });

  const detailMat = getMaterial(`${tier}-detail`, () => {
    return new THREE.MeshStandardMaterial({
      color: tier === 'stone' ? 0x787c85 : 0x3d2714,
      roughness: 0.7,
    });
  });

  return { mainMat, frameMat, detailMat };
}

/**
 * Procedural 3D Model Generator for all 14 Modular Building Pieces
 */
export function createPiece3DGroup(
  piece: BuildingPiece,
  groundY: number = 4.0,
  onToggleInteract?: (pieceId: string) => void
): THREE.Group {
  const group = new THREE.Group();
  group.name = `piece-${piece.id}`;
  group.userData = { pieceId: piece.id, piece, isBuildingPiece: true };

  const { mainMat, frameMat, detailMat } = getPieceMaterials(piece.tier, piece.insulated);

  // Position calculation
  // 2x2m Grid snapping
  const posX = BASE_ORIGIN.x + piece.gridX * 2.0;
  const posZ = BASE_ORIGIN.z + piece.gridZ * 2.0;
  // Elevation 0: ground foundation
  // Elevation 1+: 2m per story
  const posY = groundY + piece.elevation * 2.0;

  group.position.set(posX, posY, posZ);
  group.rotation.y = (piece.rotation * Math.PI) / 180;

  switch (piece.type) {
    case 'foundation': {
      // 2x2x1m Foundation Block
      const platformGeo = new THREE.BoxGeometry(2.0, 0.4, 2.0);
      const platform = new THREE.Mesh(platformGeo, mainMat);
      platform.position.y = 0.8;
      platform.castShadow = true;
      platform.receiveShadow = true;
      group.add(platform);

      // 4 Stilt Legs or Stone Foundation Piers going down into the sand
      const legGeo = piece.tier === 'stone'
        ? new THREE.BoxGeometry(0.35, 1.8, 0.35)
        : new THREE.CylinderGeometry(0.12, 0.15, 1.8, 8);

      [-0.85, 0.85].forEach((sx) => {
        [-0.85, 0.85].forEach((sz) => {
          const leg = new THREE.Mesh(legGeo, frameMat);
          leg.position.set(sx, 0.0, sz);
          leg.castShadow = true;
          group.add(leg);
        });
      });
      break;
    }

    case 'wall': {
      // 2x2m Solid Wall (25cm thick)
      const wallGeo = new THREE.BoxGeometry(2.0, 2.0, 0.22);
      const wallMesh = new THREE.Mesh(wallGeo, mainMat);
      wallMesh.position.set(0, 1.0, 0);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      group.add(wallMesh);

      // Support posts on left & right
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.0, 6);
      [-0.95, 0.95].forEach((px) => {
        const post = new THREE.Mesh(postGeo, frameMat);
        post.position.set(px, 1.0, 0);
        group.add(post);
      });
      break;
    }

    case 'doorframe': {
      // Doorframe with 100x190cm central opening
      // Left and right jambs
      const jambGeo = new THREE.BoxGeometry(0.5, 2.0, 0.22);
      const leftJamb = new THREE.Mesh(jambGeo, mainMat);
      leftJamb.position.set(-0.75, 1.0, 0);
      group.add(leftJamb);

      const rightJamb = new THREE.Mesh(jambGeo, mainMat);
      rightJamb.position.set(0.75, 1.0, 0);
      group.add(rightJamb);

      // Top lintel
      const lintelGeo = new THREE.BoxGeometry(1.0, 0.1, 0.22);
      const lintel = new THREE.Mesh(lintelGeo, frameMat);
      lintel.position.set(0, 1.95, 0);
      group.add(lintel);
      break;
    }

    case 'door': {
      // Door leaf mounted inside opening with hinge rotation
      const doorPivot = new THREE.Group();
      doorPivot.position.set(-0.48, 0.95, 0); // hinge on left side

      const doorLeafGeo = new THREE.BoxGeometry(0.96, 1.88, 0.08);
      const doorLeaf = new THREE.Mesh(doorLeafGeo, mainMat);
      doorLeaf.position.set(0.48, 0, 0);
      doorLeaf.castShadow = true;
      doorPivot.add(doorLeaf);

      // Door handle / latch
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), detailMat);
      handle.position.set(0.85, 0, 0.06);
      doorPivot.add(handle);

      if (piece.isOpen) {
        doorPivot.rotation.y = Math.PI * 0.45; // 90° open swing
      }

      group.add(doorPivot);
      break;
    }

    case 'windowframe': {
      // Windowframe with 120x120cm central opening
      // Bottom sill
      const sillGeo = new THREE.BoxGeometry(2.0, 0.5, 0.22);
      const sill = new THREE.Mesh(sillGeo, mainMat);
      sill.position.set(0, 0.25, 0);
      group.add(sill);

      // Top lintel
      const topGeo = new THREE.BoxGeometry(2.0, 0.3, 0.22);
      const top = new THREE.Mesh(topGeo, mainMat);
      top.position.set(0, 1.85, 0);
      group.add(top);

      // Left & right posts
      const sideGeo = new THREE.BoxGeometry(0.4, 1.2, 0.22);
      const leftPost = new THREE.Mesh(sideGeo, mainMat);
      leftPost.position.set(-0.8, 1.1, 0);
      group.add(leftPost);

      const rightPost = new THREE.Mesh(sideGeo, mainMat);
      rightPost.position.set(0.8, 1.1, 0);
      group.add(rightPost);
      break;
    }

    case 'window': {
      // Shutters swinging open/closed
      const leftShutterPivot = new THREE.Group();
      leftShutterPivot.position.set(-0.6, 1.1, 0);

      const shutterGeo = new THREE.BoxGeometry(0.58, 1.15, 0.05);
      const leftShutter = new THREE.Mesh(shutterGeo, mainMat);
      leftShutter.position.set(0.29, 0, 0);
      leftShutterPivot.add(leftShutter);

      if (piece.isOpen) {
        leftShutterPivot.rotation.y = -Math.PI * 0.45;
      }
      group.add(leftShutterPivot);

      const rightShutterPivot = new THREE.Group();
      rightShutterPivot.position.set(0.6, 1.1, 0);

      const rightShutter = new THREE.Mesh(shutterGeo, mainMat);
      rightShutter.position.set(-0.29, 0, 0);
      rightShutterPivot.add(rightShutter);

      if (piece.isOpen) {
        rightShutterPivot.rotation.y = Math.PI * 0.45;
      }
      group.add(rightShutterPivot);
      break;
    }

    case 'ceiling': {
      // 2x2m Ceiling Slab (15cm thick)
      const ceilingGeo = new THREE.BoxGeometry(2.0, 0.15, 2.0);
      const ceiling = new THREE.Mesh(ceilingGeo, mainMat);
      ceiling.position.set(0, 2.0, 0);
      ceiling.castShadow = true;
      ceiling.receiveShadow = true;
      group.add(ceiling);

      // Support joists underneath
      [-0.6, 0.6].forEach((jx) => {
        const joist = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.0), frameMat);
        joist.position.set(jx, 1.88, 0);
        group.add(joist);
      });
      break;
    }

    case 'hatchframe': {
      // 2x2m Ceiling with 100x100cm center hole
      const rimGeo = new THREE.BoxGeometry(0.5, 0.15, 2.0);
      const leftRim = new THREE.Mesh(rimGeo, mainMat);
      leftRim.position.set(-0.75, 2.0, 0);
      group.add(leftRim);

      const rightRim = new THREE.Mesh(rimGeo, mainMat);
      rightRim.position.set(0.75, 2.0, 0);
      group.add(rightRim);

      const crossRimGeo = new THREE.BoxGeometry(1.0, 0.15, 0.5);
      const frontRim = new THREE.Mesh(crossRimGeo, mainMat);
      frontRim.position.set(0, 2.0, -0.75);
      group.add(frontRim);

      const backRim = new THREE.Mesh(crossRimGeo, mainMat);
      backRim.position.set(0, 2.0, 0.75);
      group.add(backRim);
      break;
    }

    case 'hatch': {
      // 100x100cm Trapdoor on hinges
      const hatchPivot = new THREE.Group();
      hatchPivot.position.set(0, 2.08, -0.48);

      const trapdoorGeo = new THREE.BoxGeometry(0.96, 0.06, 0.96);
      const trapdoor = new THREE.Mesh(trapdoorGeo, mainMat);
      trapdoor.position.set(0, 0, 0.48);
      hatchPivot.add(trapdoor);

      if (piece.isOpen) {
        hatchPivot.rotation.x = -Math.PI * 0.45; // swung upwards
      }

      group.add(hatchPivot);
      break;
    }

    case 'sloped_roof': {
      // 2x2m Sloped Roof panel at 45° angle (rises 2m across 2m depth)
      // Sloped length = sqrt(2^2 + 2^2) = 2.828m
      const roofGeo = new THREE.BoxGeometry(2.05, 0.12, 2.85);
      const roofMesh = new THREE.Mesh(roofGeo, mainMat);
      // Center of slope is at y = 1.0, tilted 45° (PI/4)
      roofMesh.rotation.x = Math.PI / 4;
      roofMesh.position.set(0, 1.0, 0);
      roofMesh.castShadow = true;
      group.add(roofMesh);
      break;
    }

    case 'gable': {
      // Triangular gable wall
      const shape = new THREE.Shape();
      shape.moveTo(-1.0, 0);
      shape.lineTo(1.0, 0);
      shape.lineTo(1.0, 2.0); // right angled or triangle
      shape.closePath();

      const extrudeSettings = { depth: 0.18, bevelEnabled: false };
      const gableGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const gableMesh = new THREE.Mesh(gableGeo, mainMat);
      gableMesh.position.set(0, 0, -0.09);
      group.add(gableMesh);
      break;
    }

    case 'stairs_1m': {
      // 1m Ground Ramp / Stairs (4 steps)
      const stepCount = 4;
      for (let s = 0; s < stepCount; s++) {
        const h = (s + 1) * 0.25;
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.5), mainMat);
        step.position.set(0, h - 0.125, -0.75 + s * 0.5);
        step.castShadow = true;
        group.add(step);
      }
      break;
    }

    case 'stairs_2m': {
      // 2m Floor Stairs (8 steps)
      const stepCount = 8;
      for (let s = 0; s < stepCount; s++) {
        const h = (s + 1) * 0.25;
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.25), mainMat);
        step.position.set(0, h - 0.125, -0.875 + s * 0.25);
        step.castShadow = true;
        group.add(step);
      }
      // Stringer rails
      [-0.92, 0.92].forEach((rx) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 2.8), frameMat);
        rail.rotation.x = Math.PI / 4;
        rail.position.set(rx, 1.0, 0);
        group.add(rail);
      });
      break;
    }

    case 'ladder': {
      // 2m Vertical Ladder
      const railGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6);
      [-0.35, 0.35].forEach((rx) => {
        const rail = new THREE.Mesh(railGeo, frameMat);
        rail.position.set(rx, 1.0, 0);
        group.add(rail);
      });

      // 6 Rungs
      const rungGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6);
      for (let r = 0; r < 6; r++) {
        const rung = new THREE.Mesh(rungGeo, detailMat);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(0, 0.3 + r * 0.28, 0);
        group.add(rung);
      }
      break;
    }
  }

  // Set userData on all children so raycaster hit test identifies this piece
  group.traverse((child) => {
    child.userData = { pieceId: piece.id, piece, isBuildingPiece: true };
  });

  return group;
}

/**
 * Creates a translucent Holographic Ghost Preview for placement snapping
 */
export function createGhostPreviewGroup(
  type: BuildingPieceType,
  tier: BuildingTier,
  isValid: boolean
): THREE.Group {
  const ghost = new THREE.Group();
  ghost.name = 'building-ghost';

  const ghostColor = isValid ? 0x10b981 : 0xef4444; // emerald green if valid, red if invalid
  const ghostMat = new THREE.MeshBasicMaterial({
    color: ghostColor,
    transparent: true,
    opacity: 0.55,
    wireframe: false,
    depthWrite: false,
  });

  const wireframeMat = new THREE.MeshBasicMaterial({
    color: isValid ? 0x34d399 : 0xf87171,
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  });

  switch (type) {
    case 'foundation': {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 2.0), ghostMat);
      mesh.position.y = 0.5;
      ghost.add(mesh);
      const wire = new THREE.Mesh(new THREE.BoxGeometry(2.01, 1.01, 2.01), wireframeMat);
      wire.position.y = 0.5;
      ghost.add(wire);
      break;
    }
    case 'wall':
    case 'doorframe':
    case 'windowframe': {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 0.25), ghostMat);
      mesh.position.y = 1.0;
      ghost.add(mesh);
      const wire = new THREE.Mesh(new THREE.BoxGeometry(2.01, 2.01, 0.26), wireframeMat);
      wire.position.y = 1.0;
      ghost.add(wire);
      break;
    }
    case 'ceiling':
    case 'hatchframe': {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.0), ghostMat);
      mesh.position.y = 2.0;
      ghost.add(mesh);
      break;
    }
    case 'sloped_roof': {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.15, 2.85), ghostMat);
      mesh.rotation.x = Math.PI / 4;
      mesh.position.y = 1.0;
      ghost.add(mesh);
      break;
    }
    default: {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 2.0), ghostMat);
      mesh.position.y = 0.5;
      ghost.add(mesh);
    }
  }

  return ghost;
}
