/**
 * Project Isle - Core Game Simulation Engine
 * Pure logic and state transitions decoupled from UI for testability and stability.
 */

export type ZoneId = 'coast' | 'rainforest' | 'swamp' | 'volcano' | 'ruins';

export type WeatherType = 'clear' | 'heatwave' | 'rain' | 'storm';

export type RelationshipTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface InjuryState {
  fracture: boolean;
  bleeding: boolean;
  infection: boolean;
  malaria: boolean;
}

export interface PlayerStats {
  health: number; // 0 - 100
  hunger: number; // 0 - 100 (100 is full, 0 is starving)
  thirst: number; // 0 - 100 (100 is hydrated, 0 is dehydrated)
  bodyTemp: number; // Celsius: normal 36.8, danger <35 or >39.5
  sanity: number; // 0 - 100
  stamina: number; // 0 - 100
  injuries: InjuryState;
}

export type CompanionTask = 
  | 'idle'
  | 'resting'
  | 'gathering_wood'
  | 'gathering_food'
  | 'fetching_water'
  | 'crafting'
  | 'guarding'
  | 'scouting'
  | 'working_vehicle';

export interface CompanionState {
  id: string;
  name: string;
  gender: 'female' | 'male';
  role: string;
  isAlive: boolean;
  health: number; // Hidden internally; player observes behavior
  hunger: number;
  thirst: number;
  fatigue: number;
  morale: number; // 0 - 100
  relationship: RelationshipTier;
  relationshipPoints: number; // 0 - 100
  currentTask: CompanionTask;
  taskRemainingMinutes: number;
  injuries: InjuryState;
  // Observational cues for the "Human Attention" permadeath test:
  symptoms: {
    isLimping: boolean;
    isGroaning: boolean;
    isShivering: boolean;
    isFeverish: boolean;
    isExhausted: boolean;
    isDehydrated: boolean;
  };
  memories: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  nameHu: string;
  category: 'raw' | 'food' | 'water' | 'tool' | 'medicine' | 'material' | 'relic';
  tier: 1 | 2 | 3 | 4;
  count: number;
  description: string;
  descriptionHu: string;
}

export interface BaseBuildingState {
  stiltFoundation: number; // 0..3 (0: none, 1: bamboo stilts, 2: reinforced wood, 3: stone & iron stilts)
  shelterRoof: number; // 0..3 (0: open, 1: palm thatch, 2: timber shingle, 3: stormproof tarp)
  campfireLit: boolean;
  campfireFuel: number; // minutes remaining
  rainCollectorLevel: number; // 0..100% capacity
  rainCollectorBuilt: boolean;
  clayFurnaceBuilt: boolean;
  ironForgeBuilt: boolean;
  apothecaryBenchBuilt: boolean;
  dryingRackBuilt: boolean;
  fuelDistilleryBuilt: boolean;
  storageCapacity: number;
}

export interface OceanRaftProgress {
  phase1Hull: number; // 0..100 (Hardwood logs & sealed buoyancy barrels)
  phase2Sealing: number; // 0..100 (Pine resin & waterproof pitch)
  phase3Sails: number; // 0..100 (Reinforced woven sailcloth & steering rudder)
  phase4Supplies: number; // 0..100 (Magnetic compass, navigational chart, 50 fresh water, 50 smoked fish)
  readyForLaunch: boolean;
}

export interface AirplaneProgress {
  phase1Runway: number; // 0..100 (Clearing dense jungle trees & leveling volcanic rock)
  phase2Airframe: number; // 0..100 (Patching fuselage & wings with aircraft aluminum & rivets)
  phase3Engine: number; // 0..100 (Refurbishing carburetor, spark plugs & distilling 60L bio-ethanol)
  phase4Balance: number; // 0..100 (Weight stripping, cargo balance, elevator rigging)
  readyForLaunch: boolean;
}

export interface RuinsPuzzles {
  mirrorPuzzleSolved: boolean;
  mirrorAngle: number; // Target 135 deg
  hydraulicPuzzleSolved: boolean;
  valveA: number; // 0..100, target 60
  valveB: number; // 0..100, target 40
  incensePuzzleSolved: boolean;
  activeHerbs: string[]; // target: ['blue_lotus', 'sulfur_leaf', 'mountain_sage']
  ancientAlloyCollected: boolean;
}

export interface GameState {
  day: number;
  timeOfDayHours: number; // 0..24
  weather: WeatherType;
  ambientTemperature: number;
  currentZone: ZoneId;
  player: PlayerStats;
  companion: CompanionState;
  inventory: Record<string, number>;
  base: BaseBuildingState;
  oceanRaft: OceanRaftProgress;
  airplane: AirplaneProgress;
  ruins: RuinsPuzzles;
  eventLogs: Array<{
    id: string;
    day: number;
    time: string;
    text: string;
    textHu: string;
    type: 'survival' | 'companion' | 'crafting' | 'danger' | 'escape';
  }>;
  catastrophesCount: number;
  isEscaped: boolean;
  escapeMethod?: 'raft' | 'airplane';
  isGameOver: boolean;
  gameOverReason?: string;
}

export const INITIAL_INVENTORY: Record<string, number> = {
  driftwood: 8,
  palm_leaves: 10,
  vine_rope: 6,
  coconut: 4,
  fresh_water_flask: 3,
  flint_shard: 2,
  medicinal_herb: 2,
  scrap_metal: 1,
};

export function createInitialState(): GameState {
  return {
    day: 1,
    timeOfDayHours: 8.5, // 08:30 morning
    weather: 'clear',
    ambientTemperature: 28,
    currentZone: 'coast',
    player: {
      health: 100,
      hunger: 85,
      thirst: 90,
      bodyTemp: 36.8,
      sanity: 80,
      stamina: 95,
      injuries: {
        fracture: false,
        bleeding: false,
        infection: false,
        malaria: false,
      },
    },
    companion: {
      id: 'maya-1',
      name: 'Maya Vance',
      gender: 'female',
      role: 'Tengerbiológus és navigátor (Hajótörött társ)',
      isAlive: true,
      health: 90,
      hunger: 70,
      thirst: 75,
      fatigue: 20,
      morale: 65,
      relationship: 3, // Semleges / Neutral
      relationshipPoints: 35,
      currentTask: 'idle',
      taskRemainingMinutes: 0,
      injuries: {
        fracture: false,
        bleeding: false,
        infection: false,
        malaria: false,
      },
      symptoms: {
        isLimping: false,
        isGroaning: false,
        isShivering: false,
        isFeverish: false,
        isExhausted: false,
        isDehydrated: false,
      },
      memories: [
        'A luxus óceánjáró felborult a sziklás zátonyoknál. Együtt sodródtunk a homokos partra.',
        'Még bizonytalan vagyok, vajon képesek leszünk-e megosztani a szűkös készleteket és kijutni innen.',
      ],
    },
    inventory: { ...INITIAL_INVENTORY },
    base: {
      stiltFoundation: 1, // basic stilt floor built
      shelterRoof: 1, // rudimentary thatch
      campfireLit: true,
      campfireFuel: 120, // 2 hours
      rainCollectorLevel: 25,
      rainCollectorBuilt: true,
      clayFurnaceBuilt: false,
      ironForgeBuilt: false,
      apothecaryBenchBuilt: false,
      dryingRackBuilt: true,
      fuelDistilleryBuilt: false,
      storageCapacity: 50,
    },
    oceanRaft: {
      phase1Hull: 25,
      phase2Sealing: 0,
      phase3Sails: 0,
      phase4Supplies: 0,
      readyForLaunch: false,
    },
    airplane: {
      phase1Runway: 10,
      phase2Airframe: 5,
      phase3Engine: 0,
      phase4Balance: 0,
      readyForLaunch: false,
    },
    ruins: {
      mirrorPuzzleSolved: false,
      mirrorAngle: 45,
      hydraulicPuzzleSolved: false,
      valveA: 20,
      valveB: 80,
      incensePuzzleSolved: false,
      activeHerbs: [],
      ancientAlloyCollected: false,
    },
    eventLogs: [
      {
        id: 'ev-init-1',
        day: 1,
        time: '08:30',
        text: 'Washed ashore on the volcanic island after shipwreck. Maya Vance survived with you.',
        textHu: 'Partra vetődtél a vulkanikus szigeten a hajótörés után. Maya Vance veled együtt élte túl.',
        type: 'survival',
      },
      {
        id: 'ev-init-2',
        day: 1,
        time: '08:35',
        text: 'High ocean currents and sharks encircle the shallows. Two escape ways spotted: building a deep-sea raft or repairing the vintage cargo plane in the jungle.',
        textHu: 'Erős áramlatok és mélyvízi cápák övezik a partot. Két menekülési esély látszik: tengerálló tutaj építése, vagy a dzsungelben lezuhant teherszállító gép helyreállítása.',
        type: 'escape',
      },
    ],
    catastrophesCount: 0,
    isEscaped: false,
    isGameOver: false,
  };
}

/**
 * Updates companion observational symptoms based on hidden physical state.
 * Implements Section 4: "Permadeath és az emberi odafigyelés teszt: Nincs UI figyelmeztetés".
 */
export function updateCompanionSymptoms(comp: CompanionState): CompanionState {
  const isLimping = comp.injuries.fracture || comp.health < 40;
  const isGroaning = comp.injuries.bleeding || comp.injuries.fracture || comp.health < 30;
  const isShivering = comp.injuries.malaria || comp.morale < 25;
  const isFeverish = comp.injuries.infection || comp.injuries.malaria || comp.health < 50;
  const isExhausted = comp.fatigue > 75 || comp.hunger < 20;
  const isDehydrated = comp.thirst < 25;

  return {
    ...comp,
    symptoms: {
      isLimping,
      isGroaning,
      isShivering,
      isFeverish,
      isExhausted,
      isDehydrated,
    },
  };
}

/**
 * Advance time and simulate physiological changes over passed minutes.
 */
export function tickSimulation(state: GameState, minutesPassed: number): GameState {
  const next = structuredClone(state);
  const hoursPassed = minutesPassed / 60;

  // Advance clock
  next.timeOfDayHours = (next.timeOfDayHours + hoursPassed) % 24;
  if (next.timeOfDayHours < state.timeOfDayHours) {
    next.day += 1;
  }

  // Update weather dynamically
  const isNight = next.timeOfDayHours < 6 || next.timeOfDayHours > 19;
  if (Math.random() < 0.15 * hoursPassed) {
    const weathers: WeatherType[] = ['clear', 'heatwave', 'rain', 'storm'];
    next.weather = weathers[Math.floor(Math.random() * weathers.length)];
  }

  // Calculate ambient temperature
  let baseTemp = isNight ? 20 : 31;
  if (next.weather === 'heatwave') baseTemp += 9;
  if (next.weather === 'rain') baseTemp -= 4;
  if (next.weather === 'storm') baseTemp -= 6;
  if (next.currentZone === 'volcano') baseTemp -= 7; // high altitude
  next.ambientTemperature = Math.round(baseTemp);

  // Campfire tick
  if (next.base.campfireLit) {
    next.base.campfireFuel = Math.max(0, next.base.campfireFuel - minutesPassed);
    if (next.base.campfireFuel === 0) {
      next.base.campfireLit = false;
    }
  }

  // Rain collector tick
  if (next.base.rainCollectorBuilt && (next.weather === 'rain' || next.weather === 'storm')) {
    next.base.rainCollectorLevel = Math.min(100, next.base.rainCollectorLevel + Math.round(hoursPassed * 25));
  }

  // Player physiological tick
  const hungerLoss = (hoursPassed * 3.5);
  const thirstLoss = (hoursPassed * (next.weather === 'heatwave' ? 7.0 : 4.5));
  
  next.player.hunger = Math.max(0, Math.round(next.player.hunger - hungerLoss));
  next.player.thirst = Math.max(0, Math.round(next.player.thirst - thirstLoss));

  // Temperature regulation
  if (next.ambientTemperature > 36 && !next.base.campfireLit) {
    next.player.bodyTemp = Math.min(41.0, +(next.player.bodyTemp + 0.1 * hoursPassed).toFixed(1));
  } else if (next.ambientTemperature < 18 && !next.base.campfireLit && isNight) {
    next.player.bodyTemp = Math.max(34.0, +(next.player.bodyTemp - 0.15 * hoursPassed).toFixed(1));
  } else {
    // Normalizing towards 36.8
    if (next.player.bodyTemp > 36.8) next.player.bodyTemp = +(next.player.bodyTemp - 0.1 * hoursPassed).toFixed(1);
    if (next.player.bodyTemp < 36.8) next.player.bodyTemp = +(next.player.bodyTemp + 0.1 * hoursPassed).toFixed(1);
  }

  // Health damage if starving, dehydrated, severe injuries or temp extreme
  let healthDelta = 0;
  if (next.player.hunger === 0) healthDelta -= 4 * hoursPassed;
  if (next.player.thirst === 0) healthDelta -= 8 * hoursPassed;
  if (next.player.bodyTemp > 39.5 || next.player.bodyTemp < 35.0) healthDelta -= 5 * hoursPassed;
  if (next.player.injuries.bleeding) healthDelta -= 6 * hoursPassed;
  if (next.player.injuries.infection) healthDelta -= 4 * hoursPassed;
  if (next.player.injuries.malaria) healthDelta -= 3 * hoursPassed;

  // Natural healing if well fed & hydrated and in shelter
  if (next.player.hunger > 60 && next.player.thirst > 60 && !next.player.injuries.bleeding && healthDelta === 0) {
    healthDelta += 2 * hoursPassed;
  }
  next.player.health = Math.max(0, Math.min(100, Math.round(next.player.health + healthDelta)));

  // Sanity/Morale
  let sanityDelta = 0;
  if (isNight && !next.base.campfireLit) sanityDelta -= 3 * hoursPassed;
  if (next.player.health < 40) sanityDelta -= 2 * hoursPassed;
  if (!next.companion.isAlive) sanityDelta -= 4 * hoursPassed;
  if (next.companion.isAlive && next.companion.relationship >= 4) sanityDelta += 2 * hoursPassed;
  if (next.base.shelterRoof >= 2) sanityDelta += 1 * hoursPassed;

  next.player.sanity = Math.max(0, Math.min(100, Math.round(next.player.sanity + sanityDelta)));

  // Companion simulation (Permadeath & Needs)
  if (next.companion.isAlive) {
    const compHungerLoss = (hoursPassed * 3.0);
    const compThirstLoss = (hoursPassed * 4.0);
    next.companion.hunger = Math.max(0, Math.round(next.companion.hunger - compHungerLoss));
    next.companion.thirst = Math.max(0, Math.round(next.companion.thirst - compThirstLoss));

    let compHealthDelta = 0;
    if (next.companion.hunger === 0) compHealthDelta -= 5 * hoursPassed;
    if (next.companion.thirst === 0) compHealthDelta -= 10 * hoursPassed;
    if (next.companion.injuries.bleeding) compHealthDelta -= 7 * hoursPassed;
    if (next.companion.injuries.infection) compHealthDelta -= 4 * hoursPassed;
    if (next.companion.injuries.malaria) compHealthDelta -= 3 * hoursPassed;

    if (next.companion.hunger > 60 && next.companion.thirst > 60 && compHealthDelta === 0) {
      compHealthDelta += 2 * hoursPassed;
    }

    next.companion.health = Math.max(0, Math.min(100, Math.round(next.companion.health + compHealthDelta)));

    // Permadeath check
    if (next.companion.health <= 0) {
      next.companion.isAlive = false;
      next.companion.currentTask = 'idle';
      next.eventLogs.unshift({
        id: `ev-comp-death-${Date.now()}`,
        day: next.day,
        time: `${Math.floor(next.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `PERMADEATH: ${next.companion.name} succumbed to injuries and neglect. The island is dead silent.`,
        textHu: `VÉGLEGES HALÁL: ${next.companion.name} belehalt a sérüléseibe és az ellátatlanságba. A szigetre néma csend borult.`,
        type: 'danger',
      });
      next.player.sanity = Math.max(10, next.player.sanity - 40);
    } else {
      // Progress active task if working
      if (next.companion.currentTask !== 'idle' && next.companion.currentTask !== 'resting') {
        next.companion.taskRemainingMinutes = Math.max(0, next.companion.taskRemainingMinutes - minutesPassed);
        next.companion.fatigue = Math.min(100, next.companion.fatigue + Math.round(hoursPassed * 10));

        if (next.companion.taskRemainingMinutes === 0) {
          // Task finished: deliver results
          resolveCompanionTask(next);
        }
      } else if (next.companion.currentTask === 'resting') {
        next.companion.fatigue = Math.max(0, next.companion.fatigue - Math.round(hoursPassed * 25));
        if (next.companion.fatigue === 0) {
          next.companion.currentTask = 'idle';
        }
      }

      // Update observational cues
      next.companion = updateCompanionSymptoms(next.companion);
    }
  }

  // Check Game Over for player
  if (next.player.health <= 0) {
    next.isGameOver = true;
    next.gameOverReason = 'A sziget kíméletlen természeti erői legyőzték testedet. A túlélés véget ért.';
  }

  return next;
}

/**
 * Resolves companion task completion and rewards resources.
 */
function resolveCompanionTask(state: GameState): void {
  const task = state.companion.currentTask;
  state.companion.currentTask = 'idle';

  switch (task) {
    case 'gathering_wood':
      state.inventory.driftwood = (state.inventory.driftwood || 0) + 6;
      state.inventory.palm_leaves = (state.inventory.palm_leaves || 0) + 4;
      state.eventLogs.unshift({
        id: `ev-task-${Date.now()}`,
        day: state.day,
        time: `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `${state.companion.name} returned from the jungle with hardwood and palm leaves.`,
        textHu: `${state.companion.name} visszatért a dzsungelből fával és pálmalevelekkel.`,
        type: 'companion',
      });
      break;

    case 'gathering_food':
      state.inventory.coconut = (state.inventory.coconut || 0) + 3;
      state.inventory.medicinal_herb = (state.inventory.medicinal_herb || 0) + 2;
      state.eventLogs.unshift({
        id: `ev-task-${Date.now()}`,
        day: state.day,
        time: `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `${state.companion.name} gathered edible coconuts and medicinal herbs.`,
        textHu: `${state.companion.name} ehető kókuszdiót és gyógynövényeket gyűjtött.`,
        type: 'companion',
      });
      break;

    case 'fetching_water':
      state.inventory.fresh_water_flask = (state.inventory.fresh_water_flask || 0) + 2;
      state.eventLogs.unshift({
        id: `ev-task-${Date.now()}`,
        day: state.day,
        time: `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `${state.companion.name} filled the flasks from the freshwater stream.`,
        textHu: `${state.companion.name} megtöltötte a kulacsokat a dzsungel édesvizű patakjából.`,
        type: 'companion',
      });
      break;

    case 'working_vehicle':
      // Progress either raft or airplane
      if (state.oceanRaft.phase1Hull < 100) {
        state.oceanRaft.phase1Hull = Math.min(100, state.oceanRaft.phase1Hull + 15);
      } else if (state.airplane.phase1Runway < 100) {
        state.airplane.phase1Runway = Math.min(100, state.airplane.phase1Runway + 15);
      }
      state.eventLogs.unshift({
        id: `ev-task-${Date.now()}`,
        day: state.day,
        time: `${Math.floor(state.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `${state.companion.name} made substantial progress on escape vehicle assembly!`,
        textHu: `${state.companion.name} jelentősen előrelendítette a menekülő jármű szerelését!`,
        type: 'escape',
      });
      break;
  }
}

/**
 * Companion relationship points progression
 * Scale: 1: Hostile, 2: Exploited, 3: Neutral, 4: Cooperative, 5: Loyal, 6: Romantic
 */
export function adjustRelationship(comp: CompanionState, deltaPoints: number, reason: string): CompanionState {
  if (!comp.isAlive) return comp;

  let points = Math.max(0, Math.min(100, comp.relationshipPoints + deltaPoints));
  let tier: RelationshipTier = 3;

  if (points <= 15) tier = 1; // Ellenséges
  else if (points <= 30) tier = 2; // Kizsákmányolt
  else if (points <= 55) tier = 3; // Semleges
  else if (points <= 75) tier = 4; // Együttműködő
  else if (points <= 92) tier = 5; // Hűséges
  else tier = 6; // Romantikus Társ

  const newMemories = [reason, ...comp.memories].slice(0, 8);

  return {
    ...comp,
    relationship: tier,
    relationshipPoints: points,
    memories: newMemories,
  };
}

/**
 * Calculates escape readiness and risk for Ocean Raft
 */
export function evaluateOceanRaft(raft: OceanRaftProgress, weather: WeatherType): {
  readinessPercent: number;
  catastropheRiskPercent: number;
  missingRequirements: string[];
} {
  const missing: string[] = [];
  if (raft.phase1Hull < 100) missing.push(`Váz és felhajtóerő (fa rönkök / hordók): ${raft.phase1Hull}%`);
  if (raft.phase2Sealing < 100) missing.push(`Vízzáró gyantázás és szerkezeti merevítés: ${raft.phase2Sealing}%`);
  if (raft.phase3Sails < 100) missing.push(`Vitorlázat és kormánymű: ${raft.phase3Sails}%`);
  if (raft.phase4Supplies < 100) missing.push(`Iránytű, csillagtérkép és tengeri készletek: ${raft.phase4Supplies}%`);

  const total = (raft.phase1Hull + raft.phase2Sealing + raft.phase3Sails + raft.phase4Supplies) / 4;
  let risk = 100 - total;

  if (weather === 'storm') risk = Math.min(100, risk + 45);
  if (weather === 'rain') risk = Math.min(100, risk + 20);

  return {
    readinessPercent: Math.round(total),
    catastropheRiskPercent: Math.max(0, Math.min(100, Math.round(risk))),
    missingRequirements: missing,
  };
}

/**
 * Calculates escape readiness and risk for Airplane
 */
export function evaluateAirplane(plane: AirplaneProgress, weather: WeatherType): {
  readinessPercent: number;
  catastropheRiskPercent: number;
  missingRequirements: string[];
} {
  const missing: string[] = [];
  if (plane.phase1Runway < 100) missing.push(`Felszállópálya irtása a dzsungelben: ${plane.phase1Runway}%`);
  if (plane.phase2Airframe < 100) missing.push(`Sárkányszerkezet és szárnyak foltozása: ${plane.phase2Airframe}%`);
  if (plane.phase3Engine < 100) missing.push(`Motor alkatrészek és bio-üzemanyag (etanol): ${plane.phase3Engine}%`);
  if (plane.phase4Balance < 100) missing.push(`Súlycsökkentés és egyensúlyozás: ${plane.phase4Balance}%`);

  const total = (plane.phase1Runway + plane.phase2Airframe + plane.phase3Engine + plane.phase4Balance) / 4;
  let risk = 100 - total;

  if (weather === 'storm') risk = Math.min(100, risk + 50);
  if (weather === 'rain') risk = Math.min(100, risk + 25);

  return {
    readinessPercent: Math.round(total),
    catastropheRiskPercent: Math.max(0, Math.min(100, Math.round(risk))),
    missingRequirements: missing,
  };
}

/**
 * Simulates the Rogue-lite Disaster Cycle (Section 5.C):
 * 1. Player wakes on beach bruised/injured
 * 2. Base & inventory stay
 * 3. Vehicle is ruined
 * 4. Companion trust/morale plummets
 */
export function triggerCatastropheCycle(state: GameState, vehicleType: 'raft' | 'airplane', failureReason: string): GameState {
  const next = structuredClone(state);
  next.catastrophesCount += 1;
  next.currentZone = 'coast';
  
  // Player injuries from the crash
  next.player.health = Math.max(25, next.player.health - 45);
  next.player.injuries.bleeding = true;
  if (Math.random() > 0.4) {
    next.player.injuries.fracture = true;
  }
  next.player.sanity = Math.max(15, next.player.sanity - 30);

  // Vehicle destroyed
  if (vehicleType === 'raft') {
    next.oceanRaft = {
      phase1Hull: 10,
      phase2Sealing: 0,
      phase3Sails: 0,
      phase4Supplies: 0,
      readyForLaunch: false,
    };
  } else {
    next.airplane = {
      phase1Runway: Math.max(20, next.airplane.phase1Runway - 30),
      phase2Airframe: 10,
      phase3Engine: 0,
      phase4Balance: 0,
      readyForLaunch: false,
    };
  }

  // Companion trauma & trust loss
  if (next.companion.isAlive) {
    next.companion.health = Math.max(20, next.companion.health - 35);
    next.companion.morale = Math.max(10, next.companion.morale - 40);
    next.companion = adjustRelationship(
      next.companion,
      -25,
      `Katasztrófát szenvedtünk a(z) ${vehicleType === 'raft' ? 'tutajjal' : 'repülővel'}! Majdnem odavesztünk a szikláknál.`
    );
  }

  next.eventLogs.unshift({
    id: `ev-catastrophe-${Date.now()}`,
    day: next.day,
    time: `${Math.floor(next.timeOfDayHours).toString().padStart(2, '0')}:00`,
    text: `CATASTROPHE: ${failureReason}. You washed up battered on the coast. The base remains, but the vehicle was pulverized!`,
    textHu: `KATASZTRÓFA: ${failureReason}. Zúzódásokkal telve ébredtél a kezdő tengerparton. A bázisod megmaradt, de a jármű megsemmisült!`,
    type: 'danger',
  });

  return next;
}
