import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PIECE_BLUEPRINTS,
  TIER_CONFIG,
  BuildingPiece,
  calculateStructuralIntegrity,
  analyzeBuildingComfort,
  canAffordPiece,
  deductPieceCost,
  createStarterModularBase,
} from './buildingSystem';

test('Building blueprint contains all 14 modular piece types from GDD across 3 tiers', () => {
  const types = Object.keys(PIECE_BLUEPRINTS);
  assert.ok(types.includes('foundation'));
  assert.ok(types.includes('wall'));
  assert.ok(types.includes('doorframe'));
  assert.ok(types.includes('door'));
  assert.ok(types.includes('windowframe'));
  assert.ok(types.includes('window'));
  assert.ok(types.includes('ceiling'));
  assert.ok(types.includes('hatchframe'));
  assert.ok(types.includes('hatch'));
  assert.ok(types.includes('sloped_roof'));
  assert.ok(types.includes('gable'));
  assert.ok(types.includes('stairs_1m'));
  assert.ok(types.includes('stairs_2m'));
  assert.ok(types.includes('ladder'));

  // Hatchframe and ladder are Stone tier exclusive according to GDD Section 2 & 3
  assert.deepEqual(PIECE_BLUEPRINTS.hatchframe.allowedTiers, ['stone']);
  assert.deepEqual(PIECE_BLUEPRINTS.ladder.allowedTiers, ['stone']);
});

test('Structural Integrity assigns 100% to foundation and -10% per vertical story', () => {
  const pieces: BuildingPiece[] = [
    {
      id: 'f1',
      type: 'foundation',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 0,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 800,
      maxHp: 800,
    },
    {
      id: 'w1',
      type: 'wall',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 650,
      maxHp: 650,
    },
    {
      id: 'w2',
      type: 'wall',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 2,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 650,
      maxHp: 650,
    },
  ];

  const result = calculateStructuralIntegrity(pieces);
  assert.equal(result.collapsedPieceIds.length, 0);

  const f1 = result.updatedPieces.find((p) => p.id === 'f1');
  const w1 = result.updatedPieces.find((p) => p.id === 'w1');
  const w2 = result.updatedPieces.find((p) => p.id === 'w2');

  assert.equal(f1?.si, 100, 'Ground foundation has 100% SI');
  assert.equal(w1?.si, 90, '1st story wall has 90% SI (-10%)');
  assert.equal(w2?.si, 80, '2nd story wall has 80% SI (-20%)');
});

test('Horizontal cantilever allows 1 unsupported element, and collapses 2nd floating element', () => {
  const pieces: BuildingPiece[] = [
    {
      id: 'f1',
      type: 'foundation',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 0,
      rotation: 0,
      si: 100,
      insulated: false,
      hp: 800,
      maxHp: 800,
    },
    {
      id: 'c1',
      type: 'ceiling',
      tier: 'wood',
      gridX: 0,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 600,
      maxHp: 600,
    },
    // 1st cantilever out (gridX: 1, gridZ: 0)
    {
      id: 'c2_cantilever',
      type: 'ceiling',
      tier: 'wood',
      gridX: 1,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 600,
      maxHp: 600,
    },
    // 2nd cantilever out (gridX: 2, gridZ: 0) -> Floating! Must collapse
    {
      id: 'c3_floating',
      type: 'ceiling',
      tier: 'wood',
      gridX: 2,
      gridZ: 0,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 600,
      maxHp: 600,
    },
  ];

  const result = calculateStructuralIntegrity(pieces);
  assert.ok(result.collapsedPieceIds.includes('c3_floating'), '2nd cantilever collapses');

  const c2 = result.updatedPieces.find((p) => p.id === 'c2_cantilever');
  assert.ok(c2 && c2.si > 0, '1st cantilever survives with reduced SI');
});

test('Cascading collapse: Demolishing support foundation collapses supported pieces', () => {
  const pieces: BuildingPiece[] = [
    // Foundation missing/demolished
    {
      id: 'w1',
      type: 'wall',
      tier: 'stone',
      gridX: 5,
      gridZ: 5,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 1600,
      maxHp: 1600,
    },
    {
      id: 'c1',
      type: 'ceiling',
      tier: 'stone',
      gridX: 5,
      gridZ: 5,
      elevation: 1,
      rotation: 0,
      si: 0,
      insulated: false,
      hp: 1500,
      maxHp: 1500,
    },
  ];

  const result = calculateStructuralIntegrity(pieces);
  assert.equal(result.collapsedPieceIds.length, 2);
  assert.equal(result.updatedPieces.length, 0);
});

test('Comfort simulation detects enclosed shelter and regulates temperature during 38C heatwave', () => {
  const starterBase = createStarterModularBase();
  const comfort = analyzeBuildingComfort(starterBase, 38, 'heatwave', false);

  assert.equal(comfort.isEnclosed, true, 'Base is fully enclosed with foundation, walls and roof');
  assert.ok(comfort.indoorTemperature <= 29, `Indoor temp (${comfort.indoorTemperature}°C) cools down during 38°C heatwave`);
  assert.equal(comfort.rainProtected, true, 'Fully enclosed room provides 100% rain protection');
  assert.ok(comfort.comfortScore >= 70, 'Comfort score is high for complete insulated shelter');
});

test('Cost deduction and affordability check work correctly for building pieces', () => {
  const inventory = { driftwood: 10, palm_leaves: 20, vine_rope: 5 };
  const check = canAffordPiece('wall', 'thatch', inventory);
  assert.equal(check.canAfford, true);

  const nextInv = deductPieceCost('wall', 'thatch', inventory);
  assert.equal(nextInv.driftwood, 8);
  assert.equal(nextInv.palm_leaves, 16);
});
