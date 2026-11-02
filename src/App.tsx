/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  createInitialState,
  GameState,
  tickSimulation,
  ZoneId,
  CompanionTask,
  adjustRelationship,
  triggerCatastropheCycle,
  evaluateOceanRaft,
  evaluateAirplane,
} from './game/simulation';
import { ISLAND_ZONES, CraftingRecipe } from './game/recipes';
import { HeaderHUD } from './components/HeaderHUD';
import { IslandMap } from './components/IslandMap';
import { BaseWorkshop } from './components/BaseWorkshop';
import { CompanionPanel } from './components/CompanionPanel';
import { EscapeRoutes } from './components/EscapeRoutes';
import { AncientRuinsPuzzles } from './components/AncientRuinsPuzzles';
import { AIImageStudio } from './components/AIImageStudio';
import { ThreeDView } from './components/ThreeDView';
import { sound } from './utils/audio';
import {
  Map,
  Home,
  Users,
  Compass,
  Sparkles,
  Camera,
  RotateCcw,
  Heart,
  Skull,
  ScrollText,
  Gamepad2,
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const [activeTab, setActiveTab] = useState<
    '3d' | 'map' | 'base' | 'companion' | 'escape' | 'ruins' | 'studio'
  >('3d');
  const [isGathering, setIsGathering] = useState<boolean>(false);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [catastropheModal, setCatastropheModal] = useState<{
    isOpen: boolean;
    vehicleType: 'raft' | 'airplane';
    reason: string;
  } | null>(null);
  const [romanceModalOpen, setRomanceModalOpen] = useState<boolean>(false);

  // Time advancement ticker (e.g. passive simulation tick every 20 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.isGameOver || prev.isEscaped) return prev;
        return tickSimulation(prev, 5); // 5 minutes pass passively every 20s
      });
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const handleAdvanceTime = (minutes: number) => {
    setGameState((prev) => {
      if (prev.isGameOver || prev.isEscaped) return prev;
      return tickSimulation(prev, minutes);
    });
  };

  const handleTendFire = () => {
    setGameState((prev) => {
      const woodCount = prev.inventory.driftwood || 0;
      if (woodCount < 1) {
        sound.playDangerWarning();
        return prev;
      }
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          driftwood: woodCount - 1,
        },
        base: {
          ...prev.base,
          campfireLit: true,
          campfireFuel: Math.min(360, prev.base.campfireFuel + 60),
        },
        eventLogs: [
          {
            id: `ev-fire-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: 'Fed the campfire with dry hardwood. The flames crackle against the damp jungle night.',
            textHu: 'Száraz fát dobtál a tűzre. A lángok melege távol tartja a hideget és a fenevadakat.',
            type: 'survival',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleCollectRainWater = () => {
    setGameState((prev) => {
      if (prev.base.rainCollectorLevel < 20) return prev;
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          clean_water: (prev.inventory.clean_water || 0) + 2,
        },
        base: {
          ...prev.base,
          rainCollectorLevel: Math.max(0, prev.base.rainCollectorLevel - 40),
        },
        eventLogs: [
          {
            id: `ev-rain-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: 'Collected purified rainwater from the collector into clean flasks.',
            textHu: 'Tiszta esővizet mertél ki a pálmaleveles gyűjtőből a kulacsokba.',
            type: 'survival',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleSelectZone = (zoneId: ZoneId) => {
    setGameState((prev) => {
      const advanced = tickSimulation(prev, 30); // 30 min travel time
      advanced.currentZone = zoneId;
      advanced.eventLogs.unshift({
        id: `ev-travel-${Date.now()}`,
        day: advanced.day,
        time: `${Math.floor(advanced.timeOfDayHours).toString().padStart(2, '0')}:00`,
        text: `Traveled to ${ISLAND_ZONES[zoneId]?.nameHu}.`,
        textHu: `Átvonultál a(z) ${ISLAND_ZONES[zoneId]?.nameHu} területére.`,
        type: 'survival',
      });
      return advanced;
    });
  };

  const handleForageInZone = () => {
    if (gameState.player.stamina < 15 || isGathering) return;
    setIsGathering(true);

    setTimeout(() => {
      setGameState((prev) => {
        const advanced = tickSimulation(prev, 45); // 45 minutes foraging
        advanced.player.stamina = Math.max(0, advanced.player.stamina - 15);
        const zoneData = ISLAND_ZONES[prev.currentZone] || ISLAND_ZONES.coast;

        const lootedItems: Record<string, number> = {};
        for (const res of zoneData.resources) {
          if (Math.random() <= res.chance) {
            const amount =
              Math.floor(Math.random() * (res.amount[1] - res.amount[0] + 1)) + res.amount[0];
            lootedItems[res.id] = (lootedItems[res.id] || 0) + amount;
            advanced.inventory[res.id] = (advanced.inventory[res.id] || 0) + amount;
          }
        }

        // Small chance of dangerous encounter
        if (Math.random() < 0.12) {
          if (prev.currentZone === 'swamp') {
            advanced.player.injuries.malaria = true;
            sound.playDangerWarning();
            advanced.eventLogs.unshift({
              id: `ev-haz-${Date.now()}`,
              day: advanced.day,
              time: `${Math.floor(advanced.timeOfDayHours).toString().padStart(2, '0')}:00`,
              text: 'A swarm of infected mosquitoes bit you in the swamp. Contracted malaria fever!',
              textHu: 'Fertőzött mocsári szúnyograj támadott meg. Trópusi maláriás láz döntött le!',
              type: 'danger',
            });
          } else if (prev.currentZone === 'volcano') {
            advanced.player.injuries.fracture = true;
            sound.playDangerWarning();
            advanced.eventLogs.unshift({
              id: `ev-haz-${Date.now()}`,
              day: advanced.day,
              time: `${Math.floor(advanced.timeOfDayHours).toString().padStart(2, '0')}:00`,
              text: 'Loose basalt gave way on the volcanic cliff! Fractured bone from the fall.',
              textHu: 'Omlós bazalt sziklafal szakadt le a hegyen! Lezuhantál és eltört a lábad.',
              type: 'danger',
            });
          }
        }

        const lootSummary = Object.entries(lootedItems)
          .map(([id, count]) => `${count}x ${id}`)
          .join(', ');

        advanced.eventLogs.unshift({
          id: `ev-forage-${Date.now()}`,
          day: advanced.day,
          time: `${Math.floor(advanced.timeOfDayHours).toString().padStart(2, '0')}:00`,
          text: `Foraged ${zoneData.nameHu}: gathered ${lootSummary || 'nothing'}.`,
          textHu: `Átfésülted a területet (${zoneData.nameHu}): találtál ${lootSummary || 'semmit'}.`,
          type: 'survival',
        });

        sound.playCraftSuccess();
        return advanced;
      });
      setIsGathering(false);
    }, 450);
  };

  const handleCraft = (recipe: CraftingRecipe) => {
    setGameState((prev) => {
      const nextInv = { ...prev.inventory };
      // Deduct cost
      for (const [id, amount] of Object.entries(recipe.cost)) {
        nextInv[id] = (nextInv[id] || 0) - amount;
      }

      const nextBase = { ...prev.base };
      const nextRaft = { ...prev.oceanRaft };
      const nextPlane = { ...prev.airplane };

      // Apply output
      if (recipe.outputItem) {
        nextInv[recipe.outputItem.id] = (nextInv[recipe.outputItem.id] || 0) + recipe.outputItem.count;
      }

      if (recipe.baseUpgrade === 'clayFurnaceBuilt') nextBase.clayFurnaceBuilt = true;
      if (recipe.baseUpgrade === 'ironForgeBuilt') nextBase.ironForgeBuilt = true;
      if (recipe.baseUpgrade === 'fuelDistilleryBuilt') nextBase.fuelDistilleryBuilt = true;
      if (recipe.baseUpgrade === 'stiltFoundation_2') nextBase.stiltFoundation = 2;

      if (recipe.vehicleUpgrade) {
        if (recipe.vehicleUpgrade.type === 'raft') {
          if (recipe.vehicleUpgrade.phase === 1) nextRaft.phase1Hull = Math.min(100, nextRaft.phase1Hull + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 2) nextRaft.phase2Sealing = Math.min(100, nextRaft.phase2Sealing + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 3) nextRaft.phase3Sails = Math.min(100, nextRaft.phase3Sails + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 4) nextRaft.phase4Supplies = Math.min(100, nextRaft.phase4Supplies + recipe.vehicleUpgrade.points);
        } else {
          if (recipe.vehicleUpgrade.phase === 1) nextPlane.phase1Runway = Math.min(100, nextPlane.phase1Runway + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 2) nextPlane.phase2Airframe = Math.min(100, nextPlane.phase2Airframe + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 3) nextPlane.phase3Engine = Math.min(100, nextPlane.phase3Engine + recipe.vehicleUpgrade.points);
          if (recipe.vehicleUpgrade.phase === 4) nextPlane.phase4Balance = Math.min(100, nextPlane.phase4Balance + recipe.vehicleUpgrade.points);
        }
      }

      return {
        ...prev,
        inventory: nextInv,
        base: nextBase,
        oceanRaft: nextRaft,
        airplane: nextPlane,
        eventLogs: [
          {
            id: `ev-craft-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: `Crafted: ${recipe.nameHu}.`,
            textHu: `Sikeresen elkészítetted: ${recipe.nameHu}.`,
            type: 'crafting',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleTreatPlayer = (type: 'splint' | 'bandage' | 'tea' | 'balm') => {
    setGameState((prev) => {
      const nextInv = { ...prev.inventory };
      const nextInjuries = { ...prev.player.injuries };
      let healHp = 10;

      if (type === 'bandage' && (nextInv.herbal_bandage || 0) >= 1) {
        nextInv.herbal_bandage -= 1;
        nextInjuries.bleeding = false;
        healHp = 15;
      } else if (type === 'splint' && (nextInv.splint || 0) >= 1) {
        nextInv.splint -= 1;
        nextInjuries.fracture = false;
        healHp = 15;
      } else if (type === 'tea' && (nextInv.fever_tea || 0) >= 1) {
        nextInv.fever_tea -= 1;
        nextInjuries.malaria = false;
        healHp = 20;
      } else if (type === 'balm' && (nextInv.medicinal_herb || 0) >= 2) {
        nextInv.medicinal_herb -= 2;
        nextInjuries.infection = false;
        healHp = 15;
      }

      return {
        ...prev,
        inventory: nextInv,
        player: {
          ...prev.player,
          health: Math.min(100, prev.player.health + healHp),
          injuries: nextInjuries,
        },
        eventLogs: [
          {
            id: `ev-treat-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: 'Applied medical treatment to yourself. Vital condition stabilized.',
            textHu: 'Orvosi kezelést alkalmaztál magadon. Az állapotod stabilizálódott.',
            type: 'survival',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleAssignCompanionTask = (task: CompanionTask, durationMinutes: number) => {
    setGameState((prev) => {
      if (!prev.companion.isAlive) return prev;
      return {
        ...prev,
        companion: {
          ...prev.companion,
          currentTask: task,
          taskRemainingMinutes: durationMinutes,
        },
        eventLogs: [
          {
            id: `ev-task-assign-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: `Assigned task to ${prev.companion.name}: ${task}.`,
            textHu: `Feladatot adtál ${prev.companion.name}-nak: elindult végrehajtani (${durationMinutes} perc).`,
            type: 'companion',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleShareSupplies = (type: 'water' | 'food' | 'bandage' | 'tea') => {
    setGameState((prev) => {
      if (!prev.companion.isAlive) return prev;
      const nextInv = { ...prev.inventory };
      let comp = { ...prev.companion };

      if (type === 'water') {
        if ((nextInv.clean_water || 0) > 0) nextInv.clean_water -= 1;
        else if ((nextInv.fresh_water_flask || 0) > 0) nextInv.fresh_water_flask -= 1;
        else return prev;
        comp.thirst = Math.min(100, comp.thirst + 40);
        comp.health = Math.min(100, comp.health + 10);
        comp = adjustRelationship(comp, 5, 'Megosztottad vele az értékes tiszta ivóvizet.');
      } else if (type === 'food') {
        if ((nextInv.roasted_meal || 0) > 0) nextInv.roasted_meal -= 1;
        else if ((nextInv.coconut || 0) > 0) nextInv.coconut -= 1;
        else return prev;
        comp.hunger = Math.min(100, comp.hunger + 40);
        comp.health = Math.min(100, comp.health + 10);
        comp = adjustRelationship(comp, 5, 'Meleg, tápláló ételt adtál neki a tűznél.');
      } else if (type === 'bandage' && (nextInv.herbal_bandage || 0) > 0) {
        nextInv.herbal_bandage -= 1;
        comp.injuries.bleeding = false;
        comp.health = Math.min(100, comp.health + 25);
        comp = adjustRelationship(comp, 8, 'Elláttad és bekötözted a vérző sebeit.');
      } else if (type === 'tea' && (nextInv.fever_tea || 0) > 0) {
        nextInv.fever_tea -= 1;
        comp.injuries.malaria = false;
        comp.health = Math.min(100, comp.health + 25);
        comp = adjustRelationship(comp, 10, 'Megitattad kinin teával, csillapítva a lázát.');
      }

      return {
        ...prev,
        inventory: nextInv,
        companion: comp,
        eventLogs: [
          {
            id: `ev-share-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: `Shared ${type} with ${comp.name}.`,
            textHu: `Gondoskodtál ${comp.name}-ról: átadtál készletet (${type}).`,
            type: 'companion',
          },
          ...prev.eventLogs,
        ],
      };
    });
  };

  const handleSendChatMessage = async (msg: string) => {
    if (!msg.trim() || isSendingChat) return;
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          companionName: gameState.companion.name,
          relationshipLevel: gameState.companion.relationship,
          relationshipName: gameState.companion.relationship === 6 ? 'Romantikus' : 'Együttműködő',
          healthStatus: gameState.companion.health > 60 ? 'Jó' : 'Sérült és gyenge',
          hunger: gameState.companion.hunger,
          thirst: gameState.companion.thirst,
          morale: gameState.companion.morale,
          memories: gameState.companion.memories,
        }),
      });

      const data = await res.json();

      setGameState((prev) => {
        if (!prev.companion.isAlive) return prev;
        let comp = adjustRelationship(
          prev.companion,
          data.relationshipDelta || 1,
          data.reason || 'Beszélgettetek a partvidéki táborban.'
        );

        // Function calling intent execution
        if (data.detectedAction === 'gather_wood') {
          comp.currentTask = 'gathering_wood';
          comp.taskRemainingMinutes = 60;
        } else if (data.detectedAction === 'gather_food') {
          comp.currentTask = 'gathering_food';
          comp.taskRemainingMinutes = 60;
        } else if (data.detectedAction === 'fetch_water') {
          comp.currentTask = 'fetching_water';
          comp.taskRemainingMinutes = 45;
        } else if (data.detectedAction === 'work_vehicle') {
          comp.currentTask = 'working_vehicle';
          comp.taskRemainingMinutes = 90;
        } else if (data.detectedAction === 'rest') {
          comp.currentTask = 'resting';
          comp.taskRemainingMinutes = 60;
        } else if (data.detectedAction === 'romance') {
          setRomanceModalOpen(true);
        }

        return {
          ...prev,
          companion: comp,
          eventLogs: [
            {
              id: `ev-chat-${Date.now()}`,
              day: prev.day,
              time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
              text: `${prev.companion.name}: "${data.reply}"`,
              textHu: `${prev.companion.name}: "${data.reply}"`,
              type: 'companion',
            },
            ...prev.eventLogs,
          ],
        };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleAttemptEscape = (vehicleType: 'raft' | 'airplane') => {
    const evalResult =
      vehicleType === 'raft'
        ? evaluateOceanRaft(gameState.oceanRaft, gameState.weather)
        : evaluateAirplane(gameState.airplane, gameState.weather);

    const roll = Math.random() * 100;
    if (roll < evalResult.catastropheRiskPercent) {
      // Catastrophe triggered! Section 5.C
      sound.playDangerWarning();
      sound.playThunder();

      const failureReason =
        vehicleType === 'raft'
          ? 'A kíméletlen tengeri áramlatok és a heves vihar szétzúzták a tutaj tartógerendáit a korallzátonynál'
          : 'A rövid kifutópálya és a nem megfelelő oktánszámú üzemanyag miatt a repülőgép lecsúszott a vulkáni szirtről';

      setCatastropheModal({
        isOpen: true,
        vehicleType,
        reason: failureReason,
      });

      setGameState((prev) => triggerCatastropheCycle(prev, vehicleType, failureReason));
    } else {
      // Success!
      sound.playCraftSuccess();
      setGameState((prev) => ({
        ...prev,
        isEscaped: true,
        escapeMethod: vehicleType,
        eventLogs: [
          {
            id: `ev-escaped-${Date.now()}`,
            day: prev.day,
            time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
            text: 'VICTORY: You escaped Project Isle!',
            textHu: 'GYŐZELEM: Sikeresen kijutottál a vulkanikus szigetről!',
            type: 'escape',
          },
          ...prev.eventLogs,
        ],
      }));
    }
  };

  const handleContributePhase = (vehicleType: 'raft' | 'airplane', phase: number) => {
    setGameState((prev) => {
      const nextRaft = { ...prev.oceanRaft };
      const nextPlane = { ...prev.airplane };

      if (vehicleType === 'raft') {
        if (phase === 1) nextRaft.phase1Hull = Math.min(100, nextRaft.phase1Hull + 25);
        if (phase === 2) nextRaft.phase2Sealing = Math.min(100, nextRaft.phase2Sealing + 25);
        if (phase === 3) nextRaft.phase3Sails = Math.min(100, nextRaft.phase3Sails + 25);
        if (phase === 4) nextRaft.phase4Supplies = Math.min(100, nextRaft.phase4Supplies + 25);
      } else {
        if (phase === 1) nextPlane.phase1Runway = Math.min(100, nextPlane.phase1Runway + 25);
        if (phase === 2) nextPlane.phase2Airframe = Math.min(100, nextPlane.phase2Airframe + 25);
        if (phase === 3) nextPlane.phase3Engine = Math.min(100, nextPlane.phase3Engine + 25);
        if (phase === 4) nextPlane.phase4Balance = Math.min(100, nextPlane.phase4Balance + 25);
      }

      return {
        ...prev,
        oceanRaft: nextRaft,
        airplane: nextPlane,
      };
    });
  };

  // Ancient ruins puzzle handlers
  const handleSolveMirrorPuzzle = (angle: number) => {
    setGameState((prev) => {
      // Target is 135 deg (+-15 deg tolerance)
      const solved = Math.abs(angle - 135) <= 15;
      if (solved) {
        sound.playCraftSuccess();
      } else {
        sound.playDangerWarning();
      }
      return {
        ...prev,
        ruins: {
          ...prev.ruins,
          mirrorAngle: angle,
          mirrorPuzzleSolved: solved,
        },
      };
    });
  };

  const handleSolveHydraulicPuzzle = (vA: number, vB: number) => {
    setGameState((prev) => {
      // Target is 60 & 40 (+-10 tolerance)
      const solved = Math.abs(vA - 60) <= 10 && Math.abs(vB - 40) <= 10;
      if (solved) {
        sound.playCraftSuccess();
      } else {
        sound.playDangerWarning();
      }
      return {
        ...prev,
        ruins: {
          ...prev.ruins,
          valveA: vA,
          valveB: vB,
          hydraulicPuzzleSolved: solved,
        },
      };
    });
  };

  const handleSolveIncensePuzzle = (herbs: string[]) => {
    setGameState((prev) => {
      const target = ['blue_lotus', 'sulfur_leaf', 'mountain_sage'];
      const solved =
        herbs.length === 3 &&
        target.every((h) => herbs.includes(h));
      if (solved) {
        sound.playCraftSuccess();
      } else {
        sound.playDangerWarning();
      }
      return {
        ...prev,
        ruins: {
          ...prev.ruins,
          activeHerbs: herbs,
          incensePuzzleSolved: solved,
        },
      };
    });
  };

  const handleClaimAncientAlloy = () => {
    setGameState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        ancient_alloy: (prev.inventory.ancient_alloy || 0) + 3,
        scrap_metal: (prev.inventory.scrap_metal || 0) + 5,
      },
      ruins: {
        ...prev.ruins,
        ancientAlloyCollected: true,
      },
      // Boost readiness of both vehicles
      oceanRaft: {
        ...prev.oceanRaft,
        phase2Sealing: 100,
      },
      airplane: {
        ...prev.airplane,
        phase2Airframe: 100,
      },
      eventLogs: [
        {
          id: `ev-alloy-${Date.now()}`,
          day: prev.day,
          time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
          text: 'Acquired Ancient Titanium Alloy! Escape vehicle durability dramatically bolstered.',
          textHu: 'Megszerezted az Ősi Titánium Ötvözetet! A menekülő járművek ellenállása a maximumra ugrott.',
          type: 'escape',
        },
        ...prev.eventLogs,
      ],
    }));
  };

  const handleUpdateInventoryFrom3D = (itemId: string, amount: number) => {
    setGameState((prev) => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [itemId]: (prev.inventory[itemId] || 0) + amount,
      },
    }));
  };

  const handleLogEventFrom3D = (textHu: string) => {
    setGameState((prev) => ({
      ...prev,
      eventLogs: [
        {
          id: `ev-3d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          day: prev.day,
          time: `${Math.floor(prev.timeOfDayHours).toString().padStart(2, '0')}:00`,
          text: textHu,
          textHu: textHu,
          type: 'survival',
        },
        ...prev.eventLogs,
      ],
    }));
  };

  // Game over state
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-slate-950 text-stone-200 flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-rose-800 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <Skull className="w-16 h-16 text-rose-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-black text-rose-200 uppercase tracking-wide mb-2">
            A Túlélés Véget Ért
          </h2>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed">
            {gameState.gameOverReason || 'A sziget természetes ragadozói és a zord időjárás felőrölték az erődet.'}
          </p>

          <div className="bg-stone-950 p-3 rounded border border-stone-800 text-xs text-stone-400 mb-6 font-mono text-left space-y-1">
            <div>• Túlélve: {gameState.day} nap</div>
            <div>• Társ állapota: {gameState.companion.isAlive ? 'Magára maradt' : 'Elhunyt'}</div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            Új Túlélés Indítása
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-stone-200 flex flex-col font-sans selection:bg-emerald-900 selection:text-white">
      {/* Top Survival HUD */}
      <HeaderHUD
        state={gameState}
        onAdvanceTime={handleAdvanceTime}
        onTendFire={handleTendFire}
        onOpenCrafting={() => setActiveTab('base')}
      />

      {/* Main Tab Navigation */}
      <nav className="bg-slate-900/95 border-b border-emerald-950/80 px-4 py-2 sticky top-[108px] z-30 backdrop-blur shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto scrollbar-none text-xs font-semibold py-1">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('3d');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === '3d'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40 ring-1 ring-amber-400'
                : 'text-amber-400 hover:text-amber-200 hover:bg-stone-800/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>🎮 3D Túlélő Mód</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('map');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>🗺️ Sziget Térkép</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('base');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'base'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>⛺ Bázis &amp; Műhely</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('companion');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'companion'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>🤝 AI Társ ({gameState.companion.isAlive ? gameState.companion.name : 'Emlékhely'})</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('escape');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'escape'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>⛵✈️ Menekülés (Tutaj / Gép)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('ruins');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'ruins'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🏛️ Ősi Romok</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('studio');
            }}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'studio'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 Képstúdió (1K/2K/4K)</span>
          </button>
        </div>
      </nav>

      {/* Viewport Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {activeTab === '3d' && (
          <ThreeDView
            gameState={gameState}
            onUpdateInventory={handleUpdateInventoryFrom3D}
            onLogEvent={handleLogEventFrom3D}
            onSwitchToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'map' && (
          <IslandMap
            state={gameState}
            onSelectZone={handleSelectZone}
            onForageInZone={handleForageInZone}
            isGathering={isGathering}
          />
        )}

        {activeTab === 'base' && (
          <BaseWorkshop
            state={gameState}
            onCraft={handleCraft}
            onTreatPlayer={handleTreatPlayer}
            onCollectRainWater={handleCollectRainWater}
            onTendFire={handleTendFire}
          />
        )}

        {activeTab === 'companion' && (
          <CompanionPanel
            state={gameState}
            onAssignTask={handleAssignCompanionTask}
            onShareSupplies={handleShareSupplies}
            onSendChatMessage={handleSendChatMessage}
            isSendingChat={isSendingChat}
            onTriggerRomanceMoment={() => setRomanceModalOpen(true)}
          />
        )}

        {activeTab === 'escape' && (
          <EscapeRoutes
            state={gameState}
            onAttemptEscape={handleAttemptEscape}
            onContributePhase={handleContributePhase}
            onResetCatastropheModal={() => setCatastropheModal(null)}
            catastropheModal={catastropheModal}
          />
        )}

        {activeTab === 'ruins' && (
          <AncientRuinsPuzzles
            state={gameState}
            onSolveMirrorPuzzle={handleSolveMirrorPuzzle}
            onSolveHydraulicPuzzle={handleSolveHydraulicPuzzle}
            onSolveIncensePuzzle={handleSolveIncensePuzzle}
            onClaimAncientAlloy={handleClaimAncientAlloy}
          />
        )}

        {activeTab === 'studio' && (
          <AIImageStudio currentZoneName={ISLAND_ZONES[gameState.currentZone]?.nameHu || 'Partvidék'} />
        )}
      </main>

      {/* Live Survival Event Ticker at bottom */}
      <footer className="bg-slate-900 border-t border-emerald-950/80 p-3 text-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-emerald-400 shrink-0">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Túlélési Napló:</span>
          </div>

          <div className="flex-1 overflow-x-auto whitespace-nowrap text-stone-300 font-mono flex items-center gap-4">
            {gameState.eventLogs.slice(0, 4).map((log) => (
              <span key={log.id} className="inline-flex items-center gap-1 text-[11px]">
                <strong className="text-amber-400">[{log.time}]</strong>
                <span>{log.textHu}</span>
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* Romantic Cinematic Cutscene Modal (Tier 6 Romance) */}
      {romanceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setRomanceModalOpen(false)}
        >
          <div
            className="bg-gradient-to-b from-slate-900 via-pink-950/40 to-slate-900 border-2 border-pink-500 rounded-xl max-w-lg w-full p-6 text-center shadow-2xl animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-950 border border-pink-500 flex items-center justify-center animate-pulse">
              <Heart className="w-8 h-8 text-pink-400 fill-pink-400" />
            </div>

            <h3 className="text-xl font-bold text-pink-200 mb-2">
              Intimitás a Tábortűz Fényében
            </h3>

            <p className="text-xs text-stone-300 leading-relaxed mb-4 italic bg-stone-950/70 p-3.5 rounded-lg border border-pink-900/40">
              "{gameState.companion.name} halkan melléd ül a cölöpház bambusz teraszán. A trópusi csillagok tükröződnek a sötét óceánon, miközben a tábortűz parazsa lassan pattog. Megfogja a kezedet, és a válladra hajtja a fejét: 'Amíg veled vagyok ezen a szigeten, már nem a rettegés tölt el... hanem a hála.'"
            </p>

            <div className="bg-pink-950/40 border border-pink-900/60 p-2.5 rounded text-[11px] text-pink-300 mb-6 font-mono">
              ✓ Ép Elme (Sanity) maximális regeneráció (+35 pont) • Törhetetlen bizalom
            </div>

            <button
              onClick={() => {
                sound.playCraftSuccess();
                setRomanceModalOpen(false);
                setGameState((prev) => ({
                  ...prev,
                  player: {
                    ...prev.player,
                    sanity: Math.min(100, prev.player.sanity + 35),
                  },
                }));
              }}
              className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition shadow-lg"
            >
              A pillanat megőrzése...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
