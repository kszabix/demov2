import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_CATALOG, CATEGORY_DEFINITIONS, ItemCategory } from '../components/BaseWorkshop';

test('Inventory item catalog contains valid categories and mappings for key game items', () => {
  // Test food items
  assert.equal(ITEM_CATALOG.coconut.category, 'food');
  assert.equal(ITEM_CATALOG.fresh_water_flask.category, 'food');
  assert.equal(ITEM_CATALOG.clean_water.category, 'food');

  // Test medical items
  assert.equal(ITEM_CATALOG.herbal_bandage.category, 'medicine');
  assert.equal(ITEM_CATALOG.splint.category, 'medicine');
  assert.equal(ITEM_CATALOG.fever_tea.category, 'medicine');

  // Test tools
  assert.equal(ITEM_CATALOG.crude_spear.category, 'tool');
  assert.equal(ITEM_CATALOG.stone_axe.category, 'tool');

  // Test raw materials
  assert.equal(ITEM_CATALOG.driftwood.category, 'raw');
  assert.equal(ITEM_CATALOG.palm_leaves.category, 'raw');

  // Test relics
  assert.equal(ITEM_CATALOG.ancient_alloy.category, 'relic');
});

test('Category definitions enforce expected sorting order: food < medicine < tool < raw < relic', () => {
  assert.ok(CATEGORY_DEFINITIONS.food.order < CATEGORY_DEFINITIONS.medicine.order);
  assert.ok(CATEGORY_DEFINITIONS.medicine.order < CATEGORY_DEFINITIONS.tool.order);
  assert.ok(CATEGORY_DEFINITIONS.tool.order < CATEGORY_DEFINITIONS.raw.order);
  assert.ok(CATEGORY_DEFINITIONS.raw.order < CATEGORY_DEFINITIONS.relic.order);
});

test('Sorting inventory items by category places food first, then medicine, tool, raw, relic', () => {
  const sampleItems: Array<[string, number]> = [
    ['ancient_alloy', 2],
    ['driftwood', 10],
    ['stone_axe', 1],
    ['herbal_bandage', 3],
    ['coconut', 5],
  ];

  const sorted = [...sampleItems].sort((a, b) => {
    const catA = (ITEM_CATALOG[a[0]]?.category || 'raw') as ItemCategory;
    const catB = (ITEM_CATALOG[b[0]]?.category || 'raw') as ItemCategory;
    return CATEGORY_DEFINITIONS[catA].order - CATEGORY_DEFINITIONS[catB].order;
  });

  const sortedKeys = sorted.map(([id]) => id);
  assert.deepEqual(sortedKeys, [
    'coconut',       // food (order 1)
    'herbal_bandage',// medicine (order 2)
    'stone_axe',     // tool (order 3)
    'driftwood',     // raw (order 4)
    'ancient_alloy', // relic (order 5)
  ]);
});
