/**
 * Tropical Island Modular Building System (Trópusi Sziget Építési Rendszer)
 * Based on the Game Design Document:
 * - 2x2m Grid & Snapping architecture (2m wall height, 1m foundation height)
 * - 3-Tier System: Szalma (Thatch), Fa (Wood), Kő (Stone)
 * - Structural Integrity (SI) & Cascading Collapse graph evaluation
 * - Wall Openings & Modular Inserts (Doorframe + Door, Windowframe + Window, Hatchframe + Hatch)
 * - Roofs, Gables, and Stairs (1m foundation ramp, 2m floor stairs, ladder)
 * - External Insulation (Clay/mud/plaster layer) & Comfort Simulation
 * - Enclosed Space & Thermal Regulation (Heatwave cooling, Storm shelter)
 */

export type BuildingTier = 'thatch' | 'wood' | 'stone';

export type BuildingPieceType =
  | 'foundation'
  | 'wall'
  | 'doorframe'
  | 'door'
  | 'windowframe'
  | 'window'
  | 'ceiling'
  | 'hatchframe'
  | 'hatch'
  | 'sloped_roof'
  | 'gable'
  | 'stairs_1m'
  | 'stairs_2m'
  | 'ladder';

export type PaintColor = 'natural' | 'ochre' | 'terracotta' | 'jungle_green' | 'ocean_blue';

export interface BuildingPiece {
  id: string;
  type: BuildingPieceType;
  tier: BuildingTier;
  gridX: number; // in 2m grid steps (e.g. 0, 1, 2)
  gridZ: number; // in 2m grid steps
  elevation: number; // vertical step (0 = ground foundation, 1 = 1st floor walls/ceiling, 2 = 2nd floor, etc.)
  rotation: number; // 0, 90, 180, 270 degrees
  si: number; // Structural Integrity 0..100%
  insulated: boolean; // Külső szigetelő réteg (agyag/sár/vakolat)
  paintColor?: PaintColor;
  isOpen?: boolean; // For doors, windows, hatches
  hp: number;
  maxHp: number;
  placedAtDay?: number;
}

export interface BuildingComfortInfo {
  totalPieces: number;
  tierBreakdown: { thatch: number; wood: number; stone: number };
  isEnclosed: boolean; // Completely closed room (foundation + walls + roof + doors/windows)
  insulationRatio: number; // 0..100%
  comfortScore: number; // 0..100%
  shelterQualityText: string;
  indoorTemperature: number; // Celsius
  isStormproof: boolean;
  rainProtected: boolean;
}

export interface PieceBlueprint {
  type: BuildingPieceType;
  nameHu: string;
  category: 'foundation' | 'wall' | 'roof' | 'stairs';
  descriptionHu: string;
  minTier: BuildingTier;
  allowedTiers: BuildingTier[];
  cost: Record<BuildingTier, Record<string, number>>;
  maxHp: Record<BuildingTier, number>;
}

export const TIER_CONFIG: Record<
  BuildingTier,
  {
    nameHu: string;
    descriptionHu: string;
    order: number;
    colorHex: number;
    badgeClass: string;
    stormResistance: number; // 0..100%
    baseThermalInsulation: number; // 0..100%
  }
> = {
  thatch: {
    nameHu: '1. Szalma (Thatch)',
    descriptionHu: 'Kezdő menedék pálmalevélből és uszadékfából. Gyorsan felhúzható, alapvető árnyékot ad, viharban szigetelés nélkül sérülhet.',
    order: 1,
    colorHex: 0xc89d5c,
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/60',
    stormResistance: 40,
    baseThermalInsulation: 30,
  },
  wood: {
    nameHu: '2. Fa (Wood)',
    descriptionHu: 'Trópusi keményfa és bambusz szerkezet. Viharálló, stabil gerinc, emeleti lépcsőket tesz elérhetővé.',
    order: 2,
    colorHex: 0x8b5a2b,
    badgeClass: 'bg-stone-800/90 text-stone-200 border-stone-500/60',
    stormResistance: 85,
    baseThermalInsulation: 65,
  },
  stone: {
    nameHu: '3. Kő (Stone)',
    descriptionHu: 'Bazaltkő és folyami agyag erődítmény. Maximális hurrikánvédelem, csapóajtók, csigalépcsők és tetőablakok.',
    order: 3,
    colorHex: 0x5a5e65,
    badgeClass: 'bg-slate-800/90 text-sky-200 border-sky-600/60',
    stormResistance: 100,
    baseThermalInsulation: 90,
  },
};

export const PIECE_BLUEPRINTS: Record<BuildingPieceType, PieceBlueprint> = {
  foundation: {
    type: 'foundation',
    nameHu: 'Alap (Foundation)',
    category: 'foundation',
    descriptionHu: '2x2x1 m tömör cölöp- vagy kőalapzat. Zárja a terepet és 100%-os stabilitást biztosít.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 4, palm_leaves: 6 },
      wood: { driftwood: 6, vine_rope: 3 },
      stone: { basalt_stone: 6, river_clay: 4 },
    },
    maxHp: { thatch: 250, wood: 800, stone: 2000 },
  },
  wall: {
    type: 'wall',
    nameHu: 'Sima Fal (Wall)',
    category: 'wall',
    descriptionHu: '2x2 m-es tömör oldalfal (20-30 cm vastag), zárja a teret és véd az időjárástól.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 4 },
      wood: { driftwood: 4, vine_rope: 2 },
      stone: { basalt_stone: 4, river_clay: 3 },
    },
    maxHp: { thatch: 200, wood: 650, stone: 1600 },
  },
  doorframe: {
    type: 'doorframe',
    nameHu: 'Ajtókeret (Doorframe)',
    category: 'wall',
    descriptionHu: '2x2 m-es fal 100x190 cm-es középső kivágással az ajtó modul befogadására.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 3 },
      wood: { driftwood: 3, vine_rope: 2 },
      stone: { basalt_stone: 4, river_clay: 3 },
    },
    maxHp: { thatch: 180, wood: 600, stone: 1500 },
  },
  door: {
    type: 'door',
    nameHu: 'Ajtó Betét (Door)',
    category: 'wall',
    descriptionHu: '100x190 cm-es nyitható és csukható fa/szalma/kő ajtólap zárral.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 1, palm_leaves: 2, vine_rope: 1 },
      wood: { driftwood: 2, vine_rope: 2 },
      stone: { basalt_stone: 2, driftwood: 2, scrap_metal: 1 },
    },
    maxHp: { thatch: 150, wood: 500, stone: 1200 },
  },
  windowframe: {
    type: 'windowframe',
    nameHu: 'Ablakkeret (Windowframe)',
    category: 'wall',
    descriptionHu: '2x2 m-es fal 120x120 cm-es kivágással az ablak/zsalugáter számára.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 3 },
      wood: { driftwood: 3, vine_rope: 2 },
      stone: { basalt_stone: 3, river_clay: 2 },
    },
    maxHp: { thatch: 180, wood: 600, stone: 1500 },
  },
  window: {
    type: 'window',
    nameHu: 'Ablak / Zsalugáter (Window)',
    category: 'wall',
    descriptionHu: '120x120 cm-es zárható zsalugáter a szél, eső és rovarok kizárására.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 1, palm_leaves: 2 },
      wood: { driftwood: 2, vine_rope: 1 },
      stone: { driftwood: 2, scrap_metal: 1 },
    },
    maxHp: { thatch: 120, wood: 400, stone: 900 },
  },
  ceiling: {
    type: 'ceiling',
    nameHu: 'Födém / Mennyezet (Ceiling)',
    category: 'roof',
    descriptionHu: '2x2 m vízszintes mennyezetlap. Max. 1 egység konzolos kinyúlást engedélyez alap nélkül.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 5 },
      wood: { driftwood: 4, vine_rope: 3 },
      stone: { basalt_stone: 5, river_clay: 3 },
    },
    maxHp: { thatch: 180, wood: 600, stone: 1500 },
  },
  hatchframe: {
    type: 'hatchframe',
    nameHu: 'Csapóajtós Födém (Hatchframe)',
    category: 'roof',
    descriptionHu: '2x2 m-es födém 100x100 cm-es kivágással, amelybe létra és csapóajtó illeszthető.',
    minTier: 'stone',
    allowedTiers: ['stone'],
    cost: {
      thatch: { driftwood: 3, palm_leaves: 6 },
      wood: { driftwood: 5, vine_rope: 3 },
      stone: { basalt_stone: 5, river_clay: 3 },
    },
    maxHp: { thatch: 180, wood: 600, stone: 1600 },
  },
  hatch: {
    type: 'hatch',
    nameHu: 'Csapóajtó (Hatch Trapdoor)',
    category: 'roof',
    descriptionHu: '100x100 cm felnyitható kő/fémlemezes csapóajtó a tetőre vagy padlásra.',
    minTier: 'stone',
    allowedTiers: ['stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 2 },
      wood: { driftwood: 2, vine_rope: 2 },
      stone: { driftwood: 2, scrap_metal: 1 },
    },
    maxHp: { thatch: 150, wood: 450, stone: 1100 },
  },
  sloped_roof: {
    type: 'sloped_roof',
    nameHu: 'Ferde Tető (Sloped Roof)',
    category: 'roof',
    descriptionHu: '2x2 m alapterületű, 45°-os lejtésű tetőpanel, elvezeti a trópusi monszunesőt.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 3, palm_leaves: 5 },
      wood: { driftwood: 5, vine_rope: 3 },
      stone: { basalt_stone: 6, river_clay: 4 },
    },
    maxHp: { thatch: 220, wood: 700, stone: 1800 },
  },
  gable: {
    type: 'gable',
    nameHu: 'Oromfal Háromszög (Gable Wall)',
    category: 'wall',
    descriptionHu: 'Háromszög alakú oromfalelem ferde tetők oldalának viharbiztos lezárásához.',
    minTier: 'thatch',
    allowedTiers: ['thatch', 'wood', 'stone'],
    cost: {
      thatch: { driftwood: 2, palm_leaves: 3 },
      wood: { driftwood: 3, vine_rope: 2 },
      stone: { basalt_stone: 3, river_clay: 2 },
    },
    maxHp: { thatch: 160, wood: 500, stone: 1300 },
  },
  stairs_1m: {
    type: 'stairs_1m',
    nameHu: 'Alaplépcső / Rámpa (1m)',
    category: 'stairs',
    descriptionHu: '1 méteres szintáthidalás a terep és a bázisalapzat között.',
    minTier: 'wood',
    allowedTiers: ['wood', 'stone'],
    cost: {
      thatch: { driftwood: 3, vine_rope: 2 },
      wood: { driftwood: 4, vine_rope: 2 },
      stone: { basalt_stone: 5, river_clay: 3 },
    },
    maxHp: { thatch: 200, wood: 650, stone: 1600 },
  },
  stairs_2m: {
    type: 'stairs_2m',
    nameHu: 'Emeleti Lépcső (2m)',
    category: 'stairs',
    descriptionHu: '2 méteres teljes szintáthidaló lépcső a földszint és az emeleti födém között.',
    minTier: 'wood',
    allowedTiers: ['wood', 'stone'],
    cost: {
      thatch: { driftwood: 5, vine_rope: 3 },
      wood: { driftwood: 6, vine_rope: 4 },
      stone: { basalt_stone: 7, river_clay: 4 },
    },
    maxHp: { thatch: 250, wood: 800, stone: 1900 },
  },
  ladder: {
    type: 'ladder',
    nameHu: 'Létra / Csigalépcső (Ladder)',
    category: 'stairs',
    descriptionHu: '1x1 m alapterületű függőleges feljáró a Hatchframe (csapóajtó) alá rögzítve.',
    minTier: 'stone',
    allowedTiers: ['stone'],
    cost: {
      thatch: { driftwood: 2, vine_rope: 2 },
      wood: { driftwood: 3, vine_rope: 2 },
      stone: { basalt_stone: 2, scrap_metal: 2 },
    },
    maxHp: { thatch: 150, wood: 500, stone: 1400 },
  },
};

/**
 * Insulation cost definition:
 * Thatch & Wood: Clay / mud rendering (2 river_clay + 2 palm_leaves)
 * Stone: Lime & clay plaster (3 river_clay)
 */
export const INSULATION_COSTS: Record<BuildingTier, Record<string, number>> = {
  thatch: { river_clay: 2, palm_leaves: 2 },
  wood: { river_clay: 2, palm_leaves: 2 },
  stone: { river_clay: 3 },
};

/**
 * Calculate Structural Integrity (SI) for all pieces.
 * Section 4 of GDD:
 * - Foundation = 100% SI
 * - Vertical propagation: -10% per level above foundation
 * - Horizontal cantilever: -50% for 1st cantilever element from supported edge.
 *   2nd element = 0% -> invalid floating!
 * Cascading collapse: pieces with 0% SI collapse.
 */
export function calculateStructuralIntegrity(pieces: BuildingPiece[]): {
  updatedPieces: BuildingPiece[];
  collapsedPieceIds: string[];
} {
  const updated: BuildingPiece[] = pieces.map((p) => ({ ...p }));
  const piecesById = new Map<string, BuildingPiece>();
  updated.forEach((p) => piecesById.set(p.id, p));

  // Step 1: Assign 100% to all foundations resting on ground
  for (const p of updated) {
    if (p.type === 'foundation' && p.elevation === 0) {
      p.si = 100;
    } else {
      p.si = 0; // reset to recalculate path
    }
  }

  // Step 2: Multi-pass graph relaxation from foundations outwards & upwards
  let changed = true;
  let iterations = 0;
  const maxIterations = 20;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (const p of updated) {
      if (p.type === 'foundation' && p.elevation === 0) continue;

      let bestSI = 0;

      // Check vertical support directly below:
      // A piece at (gridX, gridZ, elevation) can be supported by a piece at (gridX, gridZ, elevation - 1)
      const below = updated.find(
        (other) =>
          other.gridX === p.gridX &&
          other.gridZ === p.gridZ &&
          other.elevation === p.elevation - 1 &&
          other.si > 0
      );

      if (below) {
        // Vertical support: -10%
        const verticalCandidate = Math.max(0, below.si - 10);
        if (verticalCandidate > bestSI) {
          bestSI = verticalCandidate;
        }
      }

      // Check horizontal adjacent support (for ceilings, roofs, and foundations snapping sideways)
      if (p.type === 'ceiling' || p.type === 'hatchframe' || p.type === 'sloped_roof') {
        const neighbors = updated.filter(
          (other) =>
            other.elevation === p.elevation &&
            other.si > 0 &&
            Math.abs(other.gridX - p.gridX) + Math.abs(other.gridZ - p.gridZ) === 1
        );

        for (const n of neighbors) {
          // Horizontal cantilever: max 1 unit out (-50%)
          // If the neighbor is already a cantilever (< 60% SI), it cannot support another cantilever
          if (n.si >= 60) {
            const horizontalCandidate = Math.max(0, n.si - 50);
            if (horizontalCandidate > bestSI) {
              bestSI = horizontalCandidate;
            }
          }
        }
      }

      // Check wall attachments: walls on top of foundations or other walls
      if (p.type === 'wall' || p.type === 'doorframe' || p.type === 'windowframe' || p.type === 'gable') {
        // A wall on an edge can be supported by a foundation below
        const foundBelow = updated.find(
          (other) =>
            (other.type === 'foundation' || other.type === 'wall' || other.type === 'doorframe' || other.type === 'windowframe') &&
            other.gridX === p.gridX &&
            other.gridZ === p.gridZ &&
            other.elevation === p.elevation - 1 &&
            other.si > 0
        );

        if (foundBelow) {
          const cand = Math.max(0, foundBelow.si - 10);
          if (cand > bestSI) bestSI = cand;
        }
      }

      // Check door/window/hatch inserts fitting in frames
      if (p.type === 'door' || p.type === 'window' || p.type === 'hatch') {
        const parentFrame = updated.find(
          (other) =>
            other.gridX === p.gridX &&
            other.gridZ === p.gridZ &&
            other.elevation === p.elevation &&
            other.si > 0 &&
            ((p.type === 'door' && other.type === 'doorframe') ||
              (p.type === 'window' && other.type === 'windowframe') ||
              (p.type === 'hatch' && other.type === 'hatchframe'))
        );
        if (parentFrame) {
          bestSI = parentFrame.si;
        }
      }

      // Foundations snapping horizontally to existing foundations
      if (p.type === 'foundation' && p.elevation === 0) {
        bestSI = 100;
      }

      if (bestSI !== p.si) {
        p.si = bestSI;
        changed = true;
      }
    }
  }

  // Step 3: Identify collapsed pieces (SI === 0 and not ground foundation)
  const collapsedPieceIds: string[] = [];
  const survivingPieces: BuildingPiece[] = [];

  for (const p of updated) {
    if (p.si <= 0 && !(p.type === 'foundation' && p.elevation === 0)) {
      collapsedPieceIds.push(p.id);
    } else {
      survivingPieces.push(p);
    }
  }

  return {
    updatedPieces: survivingPieces,
    collapsedPieceIds,
  };
}

/**
 * Check if a player can afford to build a piece.
 */
export function canAffordPiece(
  type: BuildingPieceType,
  tier: BuildingTier,
  inventory: Record<string, number>
): { canAfford: boolean; missing: Record<string, number> } {
  const blueprint = PIECE_BLUEPRINTS[type];
  if (!blueprint) return { canAfford: false, missing: {} };

  const costs = blueprint.cost[tier] || {};
  const missing: Record<string, number> = {};
  let canAfford = true;

  for (const [resId, required] of Object.entries(costs)) {
    const have = inventory[resId] || 0;
    if (have < required) {
      canAfford = false;
      missing[resId] = required - have;
    }
  }

  return { canAfford, missing };
}

/**
 * Deduct resources from inventory for building a piece.
 */
export function deductPieceCost(
  type: BuildingPieceType,
  tier: BuildingTier,
  inventory: Record<string, number>
): Record<string, number> {
  const nextInv = { ...inventory };
  const blueprint = PIECE_BLUEPRINTS[type];
  if (!blueprint) return nextInv;

  const costs = blueprint.cost[tier] || {};
  for (const [resId, count] of Object.entries(costs)) {
    nextInv[resId] = Math.max(0, (nextInv[resId] || 0) - count);
  }
  return nextInv;
}

/**
 * Calculate refund on demolishing a piece (50% materials returned).
 */
export function getDemolishRefund(
  type: BuildingPieceType,
  tier: BuildingTier
): Record<string, number> {
  const blueprint = PIECE_BLUEPRINTS[type];
  if (!blueprint) return {};

  const refund: Record<string, number> = {};
  const costs = blueprint.cost[tier] || {};

  for (const [resId, count] of Object.entries(costs)) {
    refund[resId] = Math.max(1, Math.floor(count * 0.5));
  }
  return refund;
}

/**
 * Analyze building comfort, enclosed room status, and thermal regulation.
 * Section 6 of GDD:
 * - Wind & Rain protection: fully enclosed space = 0% indoor wetness
 * - Thermal regulation:
 *   - Daytime heatwave (38°C) -> insulated base keeps comfortable 24-26°C
 *   - Night cold (15°C) -> campfire warmth remains trapped
 * - Hurricane resistance: Thatch without insulation takes damage; Wood and Stone resist completely.
 */
export function analyzeBuildingComfort(
  pieces: BuildingPiece[],
  ambientTemp: number = 31,
  weather: 'clear' | 'heatwave' | 'rain' | 'storm' = 'clear',
  campfireLit: boolean = false
): BuildingComfortInfo {
  const totalPieces = pieces.length;
  if (totalPieces === 0) {
    return {
      totalPieces: 0,
      tierBreakdown: { thatch: 0, wood: 0, stone: 0 },
      isEnclosed: false,
      insulationRatio: 0,
      comfortScore: 0,
      shelterQualityText: 'Nincs épített menedék (Kitettség az időjárásnak)',
      indoorTemperature: ambientTemp,
      isStormproof: false,
      rainProtected: false,
    };
  }

  const tierBreakdown = {
    thatch: pieces.filter((p) => p.tier === 'thatch').length,
    wood: pieces.filter((p) => p.tier === 'wood').length,
    stone: pieces.filter((p) => p.tier === 'stone').length,
  };

  const foundations = pieces.filter((p) => p.type === 'foundation');
  const walls = pieces.filter(
    (p) =>
      p.type === 'wall' ||
      p.type === 'doorframe' ||
      p.type === 'windowframe' ||
      p.type === 'gable'
  );
  const roofs = pieces.filter(
    (p) => p.type === 'ceiling' || p.type === 'hatchframe' || p.type === 'sloped_roof'
  );

  // Check enclosed space:
  // A minimal enclosed room requires at least:
  // 1 foundation, 4 surrounding walls (or doorframes), and 1 roof/ceiling
  const hasFoundation = foundations.length >= 1;
  const hasWalls = walls.length >= 4;
  const hasRoof = roofs.length >= 1;

  // Check if doors/windows in frames are closed
  const doors = pieces.filter((p) => p.type === 'door');
  const windows = pieces.filter((p) => p.type === 'window');
  const openDoors = doors.filter((d) => d.isOpen).length;
  const openWindows = windows.filter((w) => w.isOpen).length;

  const isEnclosed = hasFoundation && hasWalls && hasRoof;

  // Insulation ratio
  const insulatedCount = pieces.filter((p) => p.insulated).length;
  const insulationRatio = Math.round((insulatedCount / totalPieces) * 100);

  // Storm resistance
  const stoneRatio = tierBreakdown.stone / totalPieces;
  const woodRatio = tierBreakdown.wood / totalPieces;
  const isStormproof = isEnclosed && (stoneRatio > 0.4 || woodRatio > 0.6 || insulationRatio > 70);

  // Rain protection: if enclosed, wetness is 0%
  const rainProtected = isEnclosed && (openDoors === 0 || weather !== 'storm');

  // Indoor temperature calculation
  let indoorTemp = ambientTemp;

  if (isEnclosed) {
    if (weather === 'heatwave' || ambientTemp > 34) {
      // Heatwave (Section 6 of GDD):
      // Insulated base maintains 24-26°C interior temperature, uninsulated ~28-29°C
      const insulatedEffect = (insulationRatio / 100);
      indoorTemp = Math.round(29 - insulatedEffect * 5); // 100% insulated -> 24°C, 50% -> 26.5°C, 0% -> 29°C
    } else if (ambientTemp < 22) {
      // Cold night: Retain warmth, especially with campfire
      const heatBoost = campfireLit ? (insulationRatio > 50 ? 8 : 5) : 3;
      indoorTemp = Math.min(26, ambientTemp + heatBoost);
    }
  }

  // Comfort score (0-100)
  let comfortScore = 0;
  if (hasFoundation) comfortScore += 20;
  if (hasWalls) comfortScore += 25;
  if (hasRoof) comfortScore += 25;
  if (isEnclosed) comfortScore += 10;
  comfortScore += Math.round(insulationRatio * 0.15);
  if (campfireLit && isEnclosed) comfortScore += 5;
  comfortScore = Math.min(100, comfortScore);

  let shelterQualityText = 'Alapvető menedék (Nyitott cölöpök)';
  if (comfortScore >= 85) {
    shelterQualityText = 'Időjárásálló trópusi erődítmény (Kiváló hőszigetelés & viharvédelem)';
  } else if (comfortScore >= 60) {
    shelterQualityText = 'Zárt moduláris bázis (Védett a monszun és árapály ellen)';
  } else if (comfortScore >= 40) {
    shelterQualityText = 'Félig zárt kunyhó (Alapvető árnyék és száraz fekhely)';
  }

  return {
    totalPieces,
    tierBreakdown,
    isEnclosed,
    insulationRatio,
    comfortScore,
    shelterQualityText,
    indoorTemperature: indoorTemp,
    isStormproof,
    rainProtected,
  };
}

/**
 * Generate initial starter modular base for day 1.
 * Placed at x: 80, z: 1250 on the coast where the player spawns.
 * Consists of:
 * - 4 Foundations (2x2 grid, 4x4m footprint)
 * - Perimeter walls with 1 doorframe + door, 1 windowframe + window
 * - 4 Ceilings / sloped roof covering
 */
export function createStarterModularBase(): BuildingPiece[] {
  const pieces: BuildingPiece[] = [
    // 4 Foundations (2x2 grid: (0,0), (1,0), (0,1), (1,1))
    {
      id: 'base-f-00',
      type: 'foundation',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: true,
      hp: 800,
      maxHp: 800,
    },
    {
      id: 'base-f-10',
      type: 'foundation',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: true,
      hp: 800,
      maxHp: 800,
    },
    {
      id: 'base-f-01',
      type: 'foundation',
      tier: 'wood',
      gridX: 0,
      gridZ: 1,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: true,
      hp: 800,
      maxHp: 800,
    },
    {
      id: 'base-f-11',
      type: 'foundation',
      tier: 'wood',
      gridX: 1,
      gridZ: 1,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: true,
      hp: 800,
      maxHp: 800,
    },

    // 1m Foundation Ramp (Stairs) leading up from beach at (0, -1)
    {
      id: 'base-st-0',
      type: 'stairs_1m',
      tier: 'wood',
      gridX: 0,
      gridZ: -1,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: false,
      hp: 650,
      maxHp: 650,
    },

    // Walls on elevation 1
    // North walls (gridZ = 0, facing North)
    {
      id: 'base-w-00-n',
      type: 'doorframe',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 90,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
    {
      id: 'base-d-00',
      type: 'door',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 90,
      insulated: false,
      isOpen: false,
      hp: 500,
      maxHp: 500,
    },
    {
      id: 'base-w-10-n',
      type: 'windowframe',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 90,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
    {
      id: 'base-win-10',
      type: 'window',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 90,
      insulated: false,
      isOpen: false,
      hp: 400,
      maxHp: 400,
    },

    // South walls (gridZ = 1)
    {
      id: 'base-w-01-s',
      type: 'wall',
      tier: 'wood',
      gridX: 0,
      gridZ: 1,
      elevation: 1,
      rotation: 180,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },
    {
      id: 'base-w-11-s',
      type: 'wall',
      tier: 'wood',
      gridX: 1,
      gridZ: 1,
      elevation: 1,
      rotation: 180,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },

    // West walls (gridX = 0)
    {
      id: 'base-w-00-w',
      type: 'wall',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 270,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },
    {
      id: 'base-w-01-w',
      type: 'wall',
      tier: 'wood',
      gridX: 0,
      gridZ: 1,
      elevation: 1,
      rotation: 270,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },

    // East walls (gridX = 1)
    {
      id: 'base-w-10-e',
      type: 'wall',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 1,
      rotation: 90,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },
    {
      id: 'base-w-11-e',
      type: 'wall',
      tier: 'wood',
      gridX: 1,
      gridZ: 1,
      elevation: 1,
      rotation: 90,
      si: 90,
      insulated: true,
      hp: 650,
      maxHp: 650,
    },

    // 4 Ceilings / Roofs at elevation 1
    {
      id: 'base-c-00',
      type: 'ceiling',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 80,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
    {
      id: 'base-c-10',
      type: 'ceiling',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 80,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
    {
      id: 'base-c-01',
      type: 'ceiling',
      tier: 'wood',
      gridX: 0,
      gridZ: 1,
      elevation: 1,
      rotation: 0,
      si: 80,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
    {
      id: 'base-c-11',
      type: 'ceiling',
      tier: 'wood',
      gridX: 1,
      gridZ: 1,
      elevation: 1,
      rotation: 0,
      si: 80,
      insulated: true,
      hp: 600,
      maxHp: 600,
    },
  ];

  return pieces;
}
