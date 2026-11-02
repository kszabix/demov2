import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  tickSimulation,
  adjustRelationship,
  evaluateOceanRaft,
  evaluateAirplane,
  triggerCatastropheCycle,
  updateCompanionSymptoms,
} from './simulation';

test('Initial state creates valid survivors and 5 zone setup', () => {
  const state = createInitialState();
  assert.equal(state.player.health, 100);
  assert.equal(state.companion.isAlive, true);
  assert.equal(state.companion.relationship, 3);
  assert.equal(state.currentZone, 'coast');
  assert.equal(state.catastrophesCount, 0);
  assert.equal(state.isEscaped, false);
});

test('tickSimulation decreases hunger, thirst and simulates needs', () => {
  const state = createInitialState();
  const next = tickSimulation(state, 60); // 1 hour passed
  assert.ok(next.player.hunger < state.player.hunger, 'Hunger should decrease');
  assert.ok(next.player.thirst < state.player.thirst, 'Thirst should decrease');
  assert.ok(next.companion.hunger < state.companion.hunger, 'Companion hunger should decrease');
});

test('Permadeath triggers when companion health reaches zero', () => {
  const state = createInitialState();
  state.companion.health = 2;
  state.companion.thirst = 0; // Thirst at 0 inflicts heavy damage
  const next = tickSimulation(state, 120); // 2 hours passed
  assert.equal(next.companion.isAlive, false, 'Companion should die when neglected and severely injured');
  assert.ok(next.player.sanity < state.player.sanity, 'Player sanity drops sharply on companion death');
});

test('Symptoms reflect physical condition for observational human attention test', () => {
  const state = createInitialState();
  state.companion.injuries.fracture = true;
  state.companion.health = 25;
  const updated = updateCompanionSymptoms(state.companion);
  assert.equal(updated.symptoms.isLimping, true);
  assert.equal(updated.symptoms.isGroaning, true);
});

test('Relationship tier progression respects psychological levels 1 to 6', () => {
  const comp = createInitialState().companion;
  
  // Advance to romantic
  const romantic = adjustRelationship(comp, 65, 'Mély érzelmi kötelék alakult ki az éjszakai vihar alatt.');
  assert.equal(romantic.relationship, 6, 'Tier 6 is Romantic Partner');

  // Drop to hostile
  const hostile = adjustRelationship(comp, -35, 'Elvetted az utolsó adag vizet előle.');
  assert.equal(hostile.relationship, 1, 'Tier 1 is Hostile');
});

test('Escape route readiness and risk evaluation handles incomplete vs ready phases', () => {
  const state = createInitialState();
  const initialEval = evaluateOceanRaft(state.oceanRaft, 'clear');
  assert.ok(initialEval.catastropheRiskPercent > 50, 'High risk when incomplete');
  assert.ok(initialEval.missingRequirements.length > 0);

  // When fully complete and clear weather
  state.oceanRaft.phase1Hull = 100;
  state.oceanRaft.phase2Sealing = 100;
  state.oceanRaft.phase3Sails = 100;
  state.oceanRaft.phase4Supplies = 100;
  const completeEval = evaluateOceanRaft(state.oceanRaft, 'clear');
  assert.equal(completeEval.readinessPercent, 100);
  assert.equal(completeEval.catastropheRiskPercent, 0);

  // Storm adds heavy risk even with complete raft
  const stormEval = evaluateOceanRaft(state.oceanRaft, 'storm');
  assert.equal(stormEval.catastropheRiskPercent, 45);
});

test('Catastrophe cycle resets vehicle, injures player, but preserves base and inventory', () => {
  const state = createInitialState();
  state.inventory.driftwood = 50;
  state.base.clayFurnaceBuilt = true;

  const crashedState = triggerCatastropheCycle(
    state,
    'raft',
    'A viharos áramlatok a vulkanikus zátonyoknak csapták a gyenge gerendákat'
  );

  assert.equal(crashedState.catastrophesCount, 1);
  assert.equal(crashedState.oceanRaft.phase1Hull, 10);
  assert.equal(crashedState.inventory.driftwood, 50, 'Base inventory is preserved');
  assert.equal(crashedState.base.clayFurnaceBuilt, true, 'Base structures are preserved');
  assert.ok(crashedState.player.injuries.bleeding, 'Player gains bleeding injury from wreck');
  assert.ok(crashedState.companion.relationshipPoints < state.companion.relationshipPoints, 'Companion trust drops');
});
