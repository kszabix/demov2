import React, { useState } from 'react';
import { GameState } from '../game/simulation';
import { CRAFTING_RECIPES, CraftingRecipe } from '../game/recipes';
import { sound } from '../utils/audio';
import {
  Hammer,
  Shield,
  Layers,
  Flame,
  Droplets,
  HeartPulse,
  Package,
  CheckCircle,
  Plus,
  AlertCircle,
  Sparkles,
  Award,
  ArrowUpDown,
  Filter,
  Home,
  DoorOpen,
  DoorClosed,
  Paintbrush,
  Grid,
  Thermometer,
  CloudLightning,
  Sun,
  Trash2,
  ArrowUp,
  Box,
  Wrench,
} from 'lucide-react';
import {
  BuildingPiece,
  BuildingPieceType,
  BuildingTier,
  BuildingComfortInfo,
  PIECE_BLUEPRINTS,
  TIER_CONFIG,
  INSULATION_COSTS,
  canAffordPiece,
  deductPieceCost,
  getDemolishRefund,
  calculateStructuralIntegrity,
  analyzeBuildingComfort,
} from '../game/buildingSystem';

export type ItemCategory = 'food' | 'medicine' | 'tool' | 'raw' | 'relic';

export interface ItemInfo {
  nameHu: string;
  category: ItemCategory;
  icon: string;
}

export const ITEM_CATALOG: Record<string, ItemInfo> = {
  // Élelem & Ivóvíz
  coconut: { nameHu: 'Kókuszdió', category: 'food', icon: '🥥' },
  roasted_meal: { nameHu: 'Sült tápláló étel', category: 'food', icon: '🍖' },
  clean_water: { nameHu: 'Forralt tiszta víz', category: 'food', icon: '💧' },
  fresh_water_flask: { nameHu: 'Friss patakvíz kulacs', category: 'food', icon: '🍶' },
  // Orvosi kellékek
  medicinal_herb: { nameHu: 'Gyógynövény', category: 'medicine', icon: '🌿' },
  herbal_bandage: { nameHu: 'Gyógynövényes kötés', category: 'medicine', icon: '🩹' },
  splint: { nameHu: 'Favázas sín', category: 'medicine', icon: '🪵' },
  fever_tea: { nameHu: 'Kinin orchidea tea', category: 'medicine', icon: '🍵' },
  // Szerszámok & Fegyverek
  crude_spear: { nameHu: 'Bambusz lándzsa', category: 'tool', icon: '🗡️' },
  stone_axe: { nameHu: 'Pattintott kőbalta', category: 'tool', icon: '🪓' },
  metal_machete: { nameHu: 'Kovácsolt bozótvágó', category: 'tool', icon: '⚔️' },
  bone_needle: { nameHu: 'Csontvarrótű', category: 'tool', icon: '🪡' },
  titanium_chisel: { nameHu: 'Titánium véső', category: 'tool', icon: '⛏️' },
  magnetic_compass: { nameHu: 'Mágneses iránytű', category: 'tool', icon: '🧭' },
  // Nyersanyagok
  driftwood: { nameHu: 'Uszadékfa / rönk', category: 'raw', icon: '🪵' },
  palm_leaves: { nameHu: 'Pálmalevél', category: 'raw', icon: '🌴' },
  vine_rope: { nameHu: 'Lián / kötél', category: 'raw', icon: '🪢' },
  flint_shard: { nameHu: 'Tűzkő és szilánk', category: 'raw', icon: '🔥' },
  river_clay: { nameHu: 'Folyami agyag', category: 'raw', icon: '🏺' },
  basalt_stone: { nameHu: 'Bazaltkő', category: 'raw', icon: '🪨' },
  iron_ore: { nameHu: 'Vasérc', category: 'raw', icon: '⛏️' },
  sulfur: { nameHu: 'Kénkristály', category: 'raw', icon: '🧪' },
  scrap_metal: { nameHu: 'Roncsfém lemez', category: 'raw', icon: '⚙️' },
  iron_ingot: { nameHu: 'Kovácsolt vasrúd', category: 'raw', icon: '🪙' },
  resin_pitch: { nameHu: 'Vízhatlan gyantaszurok', category: 'raw', icon: '🛢️' },
  refined_fuel: { nameHu: 'Finomított repülőgép-üzemanyag', category: 'raw', icon: '⛽' },
  // Ereklyék
  ancient_alloy: { nameHu: 'Ősi titánium ötvözet', category: 'relic', icon: '✨' },
  relic_fragment: { nameHu: 'Ősi ereklyetöredék', category: 'relic', icon: '🔮' },
};

export const CATEGORY_DEFINITIONS: Record<
  ItemCategory,
  {
    nameHu: string;
    icon: string;
    order: number;
    badgeClass: string;
    borderClass: string;
    textClass: string;
  }
> = {
  food: {
    nameHu: 'Élelem & Víz',
    icon: '🍎',
    order: 1,
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
    borderClass: 'border-l-amber-500',
    textClass: 'text-amber-400',
  },
  medicine: {
    nameHu: 'Orvosi kellékek',
    icon: '💊',
    order: 2,
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-600/50',
    borderClass: 'border-l-rose-500',
    textClass: 'text-rose-400',
  },
  tool: {
    nameHu: 'Szerszámok & Fegyverek',
    icon: '🔨',
    order: 3,
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-600/50',
    borderClass: 'border-l-sky-500',
    textClass: 'text-sky-400',
  },
  raw: {
    nameHu: 'Nyersanyagok',
    icon: '🪵',
    order: 4,
    badgeClass: 'bg-stone-800/80 text-stone-300 border-stone-600/50',
    borderClass: 'border-l-emerald-600',
    textClass: 'text-stone-300',
  },
  relic: {
    nameHu: 'Ereklyék & High-tech',
    icon: '✨',
    order: 5,
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-600/50',
    borderClass: 'border-l-purple-500',
    textClass: 'text-purple-400',
  },
};

export const itemNamesHu: Record<string, string> = {
  driftwood: 'Uszadékfa / rönk',
  palm_leaves: 'Pálmalevél',
  vine_rope: 'Lián / kötél',
  coconut: 'Kókuszdió',
  fresh_water_flask: 'Friss patakvíz kulacs',
  clean_water: 'Forralt tiszta víz',
  roasted_meal: 'Sült tápláló étel',
  flint_shard: 'Tűzkő és szilánk',
  medicinal_herb: 'Gyógynövény',
  river_clay: 'Folyami agyag',
  basalt_stone: 'Bazaltkő',
  iron_ore: 'Vasérc',
  sulfur: 'Kénkristály',
  scrap_metal: 'Roncsfém lemez',
  ancient_alloy: 'Ősi titánium ötvözet',
  crude_spear: 'Bambusz lándzsa',
  stone_axe: 'Pattintott kőbalta',
  metal_machete: 'Kovácsolt bozótvágó',
  herbal_bandage: 'Gyógynövényes kötés',
  splint: 'Favázas sín',
  fever_tea: 'Kinin orchidea tea',
  bone_needle: 'Csontvarrótű',
  titanium_chisel: 'Titánium véső',
  magnetic_compass: 'Mágneses iránytű',
  iron_ingot: 'Kovácsolt vasrúd',
  resin_pitch: 'Vízhatlan gyantaszurok',
  refined_fuel: 'Finomított repülőgép-üzemanyag',
  relic_fragment: 'Ősi ereklyetöredék',
};

interface BaseWorkshopProps {
  state: GameState;
  onCraft: (recipe: CraftingRecipe) => void;
  onTreatPlayer: (treatmentType: 'splint' | 'bandage' | 'tea' | 'balm') => void;
  onCollectRainWater: () => void;
  onTendFire: () => void;
  onUpdateModularBase?: (pieces: BuildingPiece[]) => void;
  onSwitchTo3DBuildMode?: () => void;
}

export const BaseWorkshop: React.FC<BaseWorkshopProps> = ({
  state,
  onCraft,
  onTreatPlayer,
  onCollectRainWater,
  onTendFire,
  onUpdateModularBase,
  onSwitchTo3DBuildMode,
}) => {
  const [selectedTier, setSelectedTier] = React.useState<number>(0); // 0 = all
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [inventorySort, setInventorySort] = React.useState<'category' | 'count_desc' | 'name_asc'>('category');
  const [inventoryFilter, setInventoryFilter] = React.useState<'all' | ItemCategory>('all');

  // Modular Base Building State (GDD Trópusi Sziget Építési Rendszer)
  const [selectedBuildingTier, setSelectedBuildingTier] = useState<BuildingTier>('wood');
  const [selectedBuildingCategory, setSelectedBuildingCategory] = useState<'all' | 'foundation' | 'wall' | 'roof' | 'stairs'>('all');
  const [buildNotice, setBuildNotice] = useState<{ text: string; type: 'success' | 'warn' | 'info' } | null>(null);
  const [viewPlacedPieces, setViewPlacedPieces] = useState<boolean>(false);

  const modularPieces = state.modularBase?.pieces || [];
  const comfortInfo = state.modularBase?.comfort || analyzeBuildingComfort(
    modularPieces,
    state.ambientTemperature,
    state.weather,
    state.base.campfireLit
  );

  const triggerBuildNotice = (text: string, type: 'success' | 'warn' | 'info' = 'info') => {
    setBuildNotice({ text, type });
    setTimeout(() => setBuildNotice(null), 3500);
  };

  const handleBuildPiece = (type: BuildingPieceType) => {
    const blueprint = PIECE_BLUEPRINTS[type];
    if (!blueprint) return;

    const { canAfford, missing } = canAffordPiece(type, selectedBuildingTier, state.inventory);
    if (!canAfford) {
      sound.playDangerWarning();
      const missingList = Object.entries(missing)
        .map(([id, count]) => `${itemNamesHu[id] || id}: hiányzik ${count} db`)
        .join(', ');
      triggerBuildNotice(`Hiányzó nyersanyagok: ${missingList}`, 'warn');
      return;
    }

    // Determine logical next grid placement
    let nextGridX = 0;
    let nextGridZ = 0;
    let nextElevation = 0;

    if (type === 'foundation') {
      const foundations = modularPieces.filter((p) => p.type === 'foundation');
      if (foundations.length > 0) {
        // Expand adjacent to last foundation
        const last = foundations[foundations.length - 1];
        nextGridX = last.gridX + 1;
        nextGridZ = last.gridZ;
        if (foundations.some((f) => f.gridX === nextGridX && f.gridZ === nextGridZ)) {
          nextGridX = last.gridX;
          nextGridZ = last.gridZ + 1;
        }
      }
    } else if (type === 'wall' || type === 'doorframe' || type === 'windowframe' || type === 'gable') {
      nextElevation = 1;
      const walls = modularPieces.filter((p) => p.elevation === 1 && PIECE_BLUEPRINTS[p.type]?.category === 'wall');
      nextGridX = (walls.length % 3);
      nextGridZ = Math.floor(walls.length / 3);
    } else if (type === 'ceiling' || type === 'hatchframe' || type === 'sloped_roof') {
      nextElevation = 1;
      const roofs = modularPieces.filter((p) => p.elevation === 1 && (p.type === 'ceiling' || p.type === 'sloped_roof'));
      nextGridX = (roofs.length % 2);
      nextGridZ = Math.floor(roofs.length / 2);
    } else {
      nextElevation = 0;
    }

    const newPiece: BuildingPiece = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      tier: selectedBuildingTier,
      gridX: nextGridX,
      gridZ: nextGridZ,
      elevation: nextElevation,
      rotation: 0,
      si: 100,
      insulated: false,
      isOpen: false,
      hp: blueprint.maxHp[selectedBuildingTier],
      maxHp: blueprint.maxHp[selectedBuildingTier],
      placedAtDay: state.day,
    };

    // Calculate SI with new piece
    const { updatedPieces } = calculateStructuralIntegrity([...modularPieces, newPiece]);

    // Deduct cost
    const nextInv = deductPieceCost(type, selectedBuildingTier, state.inventory);
    for (const [id, count] of Object.entries(nextInv)) {
      state.inventory[id] = count;
    }

    onUpdateModularBase?.(updatedPieces);
    sound.playCraftSuccess();
    triggerBuildNotice(`Sikeresen megépítetted: ${blueprint.nameHu} (${TIER_CONFIG[selectedBuildingTier].nameHu})`, 'success');
  };

  const handleDemolishPiece = (pieceId: string) => {
    const target = modularPieces.find((p) => p.id === pieceId);
    if (!target) return;

    const remaining = modularPieces.filter((p) => p.id !== pieceId);
    const { updatedPieces, collapsedPieceIds } = calculateStructuralIntegrity(remaining);

    // 50% refund
    const refund = getDemolishRefund(target.type, target.tier);
    for (const [resId, count] of Object.entries(refund)) {
      state.inventory[resId] = (state.inventory[resId] || 0) + count;
    }

    onUpdateModularBase?.(updatedPieces);
    sound.playClick();

    if (collapsedPieceIds.length > 0) {
      sound.playDangerWarning();
      triggerBuildNotice(`Bontás megtörtént (50% visszatérítés). Figyelem! ${collapsedPieceIds.length} elem elvesztette a stabilitását és összeomlott (Dominó láncreakció)!`, 'warn');
    } else {
      triggerBuildNotice(`Sikeresen lebontottad az elemet. Nyersanyagok visszatérítve a raktárba.`, 'info');
    }
  };

  const handleInsulatePiece = (pieceId: string) => {
    const target = modularPieces.find((p) => p.id === pieceId);
    if (!target || target.insulated) return;

    const costs = INSULATION_COSTS[target.tier];
    let canAfford = true;
    for (const [resId, count] of Object.entries(costs)) {
      if ((state.inventory[resId] || 0) < count) {
        canAfford = false;
        break;
      }
    }

    if (!canAfford) {
      sound.playDangerWarning();
      triggerBuildNotice(`Nincs elég agyag/pálmalevél a szigeteléshez!`, 'warn');
      return;
    }

    for (const [resId, count] of Object.entries(costs)) {
      state.inventory[resId] = Math.max(0, (state.inventory[resId] || 0) - count);
    }

    const updated = modularPieces.map((p) => (p.id === pieceId ? { ...p, insulated: true } : p));
    onUpdateModularBase?.(updated);
    sound.playCraftSuccess();
    triggerBuildNotice(`Külső szigetelő réteg (agyagtapasztás) felvive! (+Vihar- és hővédelem)`, 'success');
  };

  const handleInsulateAll = () => {
    const uninsulated = modularPieces.filter((p) => !p.insulated);
    if (uninsulated.length === 0) {
      triggerBuildNotice(`Minden építőelem már rendelkezik szigeteléssel!`, 'info');
      return;
    }

    let insulatedCount = 0;
    const updated = [...modularPieces];

    for (const piece of updated) {
      if (!piece.insulated) {
        const costs = INSULATION_COSTS[piece.tier];
        let canAfford = true;
        for (const [resId, count] of Object.entries(costs)) {
          if ((state.inventory[resId] || 0) < count) {
            canAfford = false;
            break;
          }
        }
        if (canAfford) {
          for (const [resId, count] of Object.entries(costs)) {
            state.inventory[resId] = Math.max(0, (state.inventory[resId] || 0) - count);
          }
          piece.insulated = true;
          insulatedCount++;
        }
      }
    }

    if (insulatedCount > 0) {
      onUpdateModularBase?.(updated);
      sound.playCraftSuccess();
      triggerBuildNotice(`${insulatedCount} építőelem sikeresen szigetelve agyagtapasztással!`, 'success');
    } else {
      sound.playDangerWarning();
      triggerBuildNotice(`Nincs elegendő folyami agyag vagy pálmalevél a tömeges szigeteléshez.`, 'warn');
    }
  };

  const handleUpgradePiece = (pieceId: string, nextTier: BuildingTier) => {
    const target = modularPieces.find((p) => p.id === pieceId);
    if (!target || target.tier === nextTier) return;

    const blueprint = PIECE_BLUEPRINTS[target.type];
    const { canAfford } = canAffordPiece(target.type, nextTier, state.inventory);
    if (!canAfford) {
      sound.playDangerWarning();
      triggerBuildNotice(`Nincs elég nyersanyag a ${TIER_CONFIG[nextTier].nameHu} fejlesztéshez!`, 'warn');
      return;
    }

    const nextInv = deductPieceCost(target.type, nextTier, state.inventory);
    for (const [id, count] of Object.entries(nextInv)) {
      state.inventory[id] = count;
    }

    const updated = modularPieces.map((p) =>
      p.id === pieceId ? { ...p, tier: nextTier, hp: blueprint.maxHp[nextTier], maxHp: blueprint.maxHp[nextTier] } : p
    );
    onUpdateModularBase?.(updated);
    sound.playCraftSuccess();
    triggerBuildNotice(`Elem fejlesztve: ${blueprint.nameHu} ➔ ${TIER_CONFIG[nextTier].nameHu}!`, 'success');
  };

  const handleToggleDoor = (pieceId: string) => {
    const updated = modularPieces.map((p) =>
      p.id === pieceId ? { ...p, isOpen: !p.isOpen } : p
    );
    onUpdateModularBase?.(updated);
    sound.playClick();
  };

  const filteredRecipes = CRAFTING_RECIPES.filter((r) => {
    if (selectedTier !== 0 && r.tier !== selectedTier) return false;
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;
    return true;
  });

  const canCraft = (recipe: CraftingRecipe) => {
    for (const [itemId, amount] of Object.entries(recipe.cost)) {
      if ((state.inventory[itemId] || 0) < amount) {
        return false;
      }
    }
    return true;
  };

  const getItemCategory = (itemId: string): ItemCategory => {
    return ITEM_CATALOG[itemId]?.category || 'raw';
  };

  const getItemName = (itemId: string): string => {
    return ITEM_CATALOG[itemId]?.nameHu || itemNamesHu[itemId] || itemId;
  };

  // Inventory filtering and sorting
  const allActiveInventory = Object.entries(state.inventory).filter(([_, count]) => count > 0);

  const categoryCounts: Record<ItemCategory | 'all', number> = {
    all: allActiveInventory.length,
    food: allActiveInventory.filter(([id]) => getItemCategory(id) === 'food').length,
    medicine: allActiveInventory.filter(([id]) => getItemCategory(id) === 'medicine').length,
    tool: allActiveInventory.filter(([id]) => getItemCategory(id) === 'tool').length,
    raw: allActiveInventory.filter(([id]) => getItemCategory(id) === 'raw').length,
    relic: allActiveInventory.filter(([id]) => getItemCategory(id) === 'relic').length,
  };

  const filteredInventory = allActiveInventory.filter(([id]) => {
    if (inventoryFilter === 'all') return true;
    return getItemCategory(id) === inventoryFilter;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const [idA, countA] = a;
    const [idB, countB] = b;
    if (inventorySort === 'category') {
      const catA = getItemCategory(idA);
      const catB = getItemCategory(idB);
      const orderA = CATEGORY_DEFINITIONS[catA]?.order ?? 99;
      const orderB = CATEGORY_DEFINITIONS[catB]?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return countB - countA;
    }
    if (inventorySort === 'count_desc') {
      return countB - countA;
    }
    if (inventorySort === 'name_asc') {
      return getItemName(idA).localeCompare(getItemName(idB), 'hu');
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Base Overview & Structural Stability (Section 3.C) */}
      <div className="bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Moduláris Cölöptábor &amp; Bázis (Structural Stability)</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Cölöpös alapozás a part menti árapály és monszun áradások kivédésére, valamint éjszakai Sanity védelem.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {state.base.rainCollectorBuilt && (
              <button
                onClick={() => {
                  sound.playClick();
                  onCollectRainWater();
                }}
                disabled={state.base.rainCollectorLevel < 20}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                  state.base.rainCollectorLevel >= 20
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-200 hover:bg-cyan-900'
                    : 'bg-stone-800 border-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Esővíz gyűjtő ({state.base.rainCollectorLevel}%)</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                onTendFire();
              }}
              className="text-xs bg-amber-950/70 border border-amber-800/80 text-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-900 transition flex items-center gap-1.5 font-medium"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Tűz táplálása (+60p)</span>
            </button>
          </div>
        </div>

        {/* Modular Base Modules Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Cölöpalapzat:</span>
            <span className="font-semibold text-emerald-300">
              {state.base.stiltFoundation === 1
                ? 'Bambusz cölöpök (T1)'
                : state.base.stiltFoundation === 2
                ? 'Megerősített rönk (T2)'
                : 'Kő & Vas oszlopok (T3)'}
            </span>
          </div>

          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Tető / Védelem:</span>
            <span className="font-semibold text-emerald-300">
              {state.base.shelterRoof === 1
                ? 'Pálmafedés (T1)'
                : state.base.shelterRoof === 2
                ? 'Fagerenda zsindely (T2)'
                : 'Viharálló ponyva (T3)'}
            </span>
          </div>

          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Tábortűz állapota:</span>
            <span
              className={`font-semibold ${
                state.base.campfireLit ? 'text-amber-400' : 'text-stone-500'
              }`}
            >
              {state.base.campfireLit
                ? `Világít (${Math.round(state.base.campfireFuel)} perc)`
                : 'Kialudt'}
            </span>
          </div>

          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Agyagkemence:</span>
            <span
              className={`font-semibold ${
                state.base.clayFurnaceBuilt ? 'text-emerald-400' : 'text-stone-500'
              }`}
            >
              {state.base.clayFurnaceBuilt ? 'Működik' : 'Nincs megépítve'}
            </span>
          </div>

          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Kovácsműhely:</span>
            <span
              className={`font-semibold ${
                state.base.ironForgeBuilt ? 'text-emerald-400' : 'text-stone-500'
              }`}
            >
              {state.base.ironForgeBuilt ? 'Működik' : 'Nincs megépítve'}
            </span>
          </div>

          <div className="bg-stone-950/60 p-2.5 rounded border border-stone-800/80 text-xs">
            <span className="text-stone-400 block mb-1">Etanol lepárló:</span>
            <span
              className={`font-semibold ${
                state.base.fuelDistilleryBuilt ? 'text-emerald-400' : 'text-stone-500'
              }`}
            >
              {state.base.fuelDistilleryBuilt ? 'Működik' : 'Nincs megépítve'}
            </span>
          </div>
        </div>
      </div>

      {/* Tropical Island Modular Building System (GDD: Trópusi Sziget Építési Rendszer) */}
      <div className="bg-slate-900/95 border border-emerald-900/80 rounded-xl p-5 shadow-2xl space-y-4">
        {/* Header & 3D Switch Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                <span>Moduláris Bázisépítés (Grid &amp; Snapping: 2x2m)</span>
                <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-mono">
                  {modularPieces.length} építőelem
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              2x2 méteres rács és csatolási pont alapú túlélő-bázisépítő mechanika, szerkezeti terhelés-ellenőrzéssel és hőszigeteléssel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSwitchTo3DBuildMode && (
              <button
                onClick={() => {
                  sound.playClick();
                  onSwitchTo3DBuildMode();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition"
              >
                <Hammer className="w-4 h-4" />
                <span>🔨 3D Építő Mód Indítása</span>
              </button>
            )}

            <button
              onClick={handleInsulateAll}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600 text-xs font-medium flex items-center gap-1.5 transition"
              title="Agyagtapasztás felvitele minden szigeteletlen elemre (hő- és viharvédelem)"
            >
              <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
              <span>🧱 Tömeges Agyagszigetelés</span>
            </button>
          </div>
        </div>

        {/* Build Notification Toast */}
        {buildNotice && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 transition ${
              buildNotice.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-600/80 text-emerald-200'
                : buildNotice.type === 'warn'
                ? 'bg-amber-950/80 border-amber-600/80 text-amber-200'
                : 'bg-stone-900 border-stone-700 text-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{buildNotice.text}</span>
          </div>
        )}

        {/* 4 Pillars Status HUD (Section 4 & 6 of GDD) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Structural Integrity & Cascading Collapse */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Szerkezeti Stabilitás (SI)</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {modularPieces.length > 0
                  ? `${Math.round(modularPieces.reduce((acc, p) => acc + p.si, 0) / modularPieces.length)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${
                    modularPieces.length > 0
                      ? Math.round(modularPieces.reduce((acc, p) => acc + p.si, 0) / modularPieces.length)
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-[10px] text-stone-500">
              Alap: 100% | Emelet: -10% | Max. 1 konzol (50%). Lebegő elem automatikusan összeomlik.
            </p>
          </div>

          {/* 2. External Insulation (Szigetelés) */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1">
                <Paintbrush className="w-3.5 h-3.5 text-amber-400" />
                <span>Külső Szigetelés Réteg</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {comfortInfo.insulationRatio}%
              </span>
            </div>
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${comfortInfo.insulationRatio}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-500">
              Agyag-/pálmalevél-tapasztás. Megtartja a belső hőt és megvédi a szalmát a hurrikántól.
            </p>
          </div>

          {/* 3. Enclosed Space & Rain Protection */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zárt Menedék &amp; Eső</span>
              </span>
              <span className={`font-semibold text-xs ${comfortInfo.isEnclosed ? 'text-cyan-300' : 'text-stone-500'}`}>
                {comfortInfo.isEnclosed ? 'ZÁRT TÉR (0% nedvesség)' : 'Nyitott'}
              </span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium mb-1">
              {comfortInfo.rainProtected ? '🛡️ Védett az "Ázott" debuff ellen' : '⚠️ Esőben kitett'}
            </p>
            <p className="text-[10px] text-stone-500">
              Alap + 4 Fal + Födém + Zárt ajtó szükséges a teljes viharbiztos lezáráshoz.
            </p>
          </div>

          {/* 4. Thermal Regulation (Hőszabályozás) */}
          <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>Belső Klíma &amp; Hőmérséklet</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold text-sm">
                {comfortInfo.indoorTemperature}°C
              </span>
            </div>
            <p className="text-[11px] text-stone-300 font-medium mb-1">
              Környezeti kinti hő: {state.ambientTemperature}°C
            </p>
            <p className="text-[10px] text-stone-500">
              38°C hőségben a szigetelt bázis 24-26°C-on tart, megelőzve a hősokkot és szomjazást.
            </p>
          </div>
        </div>

        {/* Blueprint Catalog Controls: Tier Selector & Category Filter */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 3-Tier Selector Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-lg border border-stone-800">
              {(['thatch', 'wood', 'stone'] as BuildingTier[]).map((tier) => {
                const conf = TIER_CONFIG[tier];
                const isActive = selectedBuildingTier === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => {
                      sound.playClick();
                      setSelectedBuildingTier(tier);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                      isActive
                        ? `${conf.badgeClass} ring-1 ring-white/30 shadow-md`
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                    }`}
                  >
                    <span>{conf.nameHu}</span>
                  </button>
                );
              })}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'Összes Elem' },
                { id: 'foundation', label: 'Alapzat (1m)' },
                { id: 'wall', label: 'Falak & Nyílászárók' },
                { id: 'roof', label: 'Tető & Födém' },
                { id: 'stairs', label: 'Lépcsők (1-2m)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedBuildingCategory(cat.id as any);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    selectedBuildingCategory === cat.id
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(PIECE_BLUEPRINTS)
              .filter((bp) => {
                if (selectedBuildingCategory !== 'all' && bp.category !== selectedBuildingCategory) return false;
                if (!bp.allowedTiers.includes(selectedBuildingTier)) return false;
                return true;
              })
              .map((bp) => {
                const costs = bp.cost[selectedBuildingTier] || {};
                const { canAfford } = canAffordPiece(bp.type, selectedBuildingTier, state.inventory);
                const maxHp = bp.maxHp[selectedBuildingTier];

                return (
                  <div
                    key={bp.type}
                    className="bg-stone-950/80 border border-stone-800/80 hover:border-emerald-700/60 rounded-lg p-3.5 flex flex-col justify-between transition group shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-stone-100 group-hover:text-emerald-300 transition">
                          {bp.nameHu}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-700">
                          {maxHp} HP
                        </span>
                      </div>

                      <p className="text-xs text-stone-400 mb-2.5 line-clamp-2">
                        {bp.descriptionHu}
                      </p>

                      {/* Required Cost Pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {Object.entries(costs).map(([resId, amount]) => {
                          const have = state.inventory[resId] || 0;
                          const hasEnough = have >= amount;
                          return (
                            <span
                              key={resId}
                              className={`text-[10px] px-2 py-0.5 rounded font-mono border flex items-center gap-1 ${
                                hasEnough
                                  ? 'bg-stone-900/90 text-stone-300 border-stone-700'
                                  : 'bg-rose-950/70 text-rose-300 border-rose-800/80 font-bold'
                              }`}
                            >
                              <span>{itemNamesHu[resId] || resId}:</span>
                              <span className={hasEnough ? 'text-emerald-400' : 'text-rose-400'}>
                                {have}/{amount}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-800/60">
                      <button
                        onClick={() => handleBuildPiece(bp.type)}
                        disabled={!canAfford}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                            : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{canAfford ? 'Építés a bázison' : 'Hiányzó nyersanyag'}</span>
                      </button>

                      {onSwitchTo3DBuildMode && (
                        <button
                          onClick={onSwitchTo3DBuildMode}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
                          title="Elhelyezés a 3D nézetben"
                        >
                          <Grid className="w-4 h-4 text-emerald-400" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Placed Modules Inspector & Demolition (Cascading Collapse protection) */}
        <div className="pt-2 border-t border-stone-800">
          <button
            onClick={() => setViewPlacedPieces((prev) => !prev)}
            className="w-full py-2 px-3 bg-stone-950/60 hover:bg-stone-950 rounded-lg text-xs font-medium text-stone-300 flex items-center justify-between transition border border-stone-800"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Meglévő báziselemek részletes listája és kezelése ({modularPieces.length} tétel)</span>
            </span>
            <span className="text-[11px] text-emerald-400 underline">
              {viewPlacedPieces ? 'Elrejtés' : 'Megjelenítés'}
            </span>
          </button>

          {viewPlacedPieces && (
            <div className="mt-3 space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {modularPieces.map((p) => {
                const bp = PIECE_BLUEPRINTS[p.type];
                const canInsulate = !p.insulated;
                const isDoorOrWin = p.type === 'door' || p.type === 'window' || p.type === 'hatch';

                return (
                  <div
                    key={p.id}
                    className="bg-stone-950/80 border border-stone-800/80 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-stone-500 bg-stone-900 px-1.5 py-0.5 rounded">
                        ({p.gridX}, {p.gridZ}, sz:{p.elevation})
                      </span>
                      <span className="font-semibold text-stone-200">{bp?.nameHu || p.type}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${TIER_CONFIG[p.tier].badgeClass}`}>
                        {TIER_CONFIG[p.tier].nameHu.split(' ')[1]}
                      </span>
                      {p.insulated ? (
                        <span className="bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                          🧱 Szigetelt
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[10px]">Nem szigetelt</span>
                      )}
                      <span className="text-stone-400 text-[10px] font-mono">
                        SI: <b className="text-emerald-400">{p.si}%</b> | HP: {p.hp}/{p.maxHp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDoorOrWin && (
                        <button
                          onClick={() => handleToggleDoor(p.id)}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1 font-medium transition"
                        >
                          {p.isOpen ? <DoorOpen className="w-3 h-3 text-emerald-400" /> : <DoorClosed className="w-3 h-3 text-stone-400" />}
                          <span>{p.isOpen ? 'Nyitva' : 'Zárva'}</span>
                        </button>
                      )}

                      {canInsulate && (
                        <button
                          onClick={() => handleInsulatePiece(p.id)}
                          className="px-2 py-1 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-800/70 text-amber-300 text-[11px] font-medium transition"
                          title="Külső agyagtapasztás felvitele (2 agyag + 2 pálmalevél)"
                        >
                          Szigetelés
                        </button>
                      )}

                      {p.tier !== 'stone' && (
                        <button
                          onClick={() => handleUpgradePiece(p.id, p.tier === 'thatch' ? 'wood' : 'stone')}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-sky-300 text-[11px] font-medium transition"
                          title="Fejlesztés magasabb anyagszintre"
                        >
                          ⬆️ {p.tier === 'thatch' ? 'Fa' : 'Kő'}
                        </button>
                      )}

                      <button
                        onClick={() => handleDemolishPiece(p.id)}
                        className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-[11px] font-medium transition flex items-center gap-1"
                        title="Bontás (50% visszatérítés, dominó láncreakció vizsgálat)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Bontás</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Medical Care Station & Player Injury Treatment */}
      <div className="bg-rose-950/40 border border-rose-900/60 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <HeartPulse className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wide">
            Egészségügyi Állomás &amp; Sérülések Kezelése
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Bleeding */}
          <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-stone-200 block">Vérző seb</span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Állapot: {state.player.injuries.bleeding ? (
                  <span className="text-rose-400 font-bold">AKUT VÉRZÉS (-6 HP/óra)</span>
                ) : (
                  <span className="text-emerald-400">Nincs vérzés</span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onTreatPlayer('bandage');
              }}
              disabled={!state.player.injuries.bleeding || (state.inventory.herbal_bandage || 0) < 1}
              className={`mt-2 py-1.5 px-2.5 rounded font-medium transition ${
                state.player.injuries.bleeding && (state.inventory.herbal_bandage || 0) >= 1
                  ? 'bg-rose-700 hover:bg-rose-600 text-white'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              Kötözés ({state.inventory.herbal_bandage || 0} készleten)
            </button>
          </div>

          {/* Fracture */}
          <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-stone-200 block">Csonttörés</span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Állapot: {state.player.injuries.fracture ? (
                  <span className="text-rose-400 font-bold">TÖRÖTT VÉGTAG (Sántítás)</span>
                ) : (
                  <span className="text-emerald-400">Ép csontozat</span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onTreatPlayer('splint');
              }}
              disabled={!state.player.injuries.fracture || (state.inventory.splint || 0) < 1}
              className={`mt-2 py-1.5 px-2.5 rounded font-medium transition ${
                state.player.injuries.fracture && (state.inventory.splint || 0) >= 1
                  ? 'bg-amber-700 hover:bg-amber-600 text-white'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              Sín felhelyezése ({state.inventory.splint || 0} készleten)
            </button>
          </div>

          {/* Infection */}
          <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-stone-200 block">Sebfertőzés</span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Állapot: {state.player.injuries.infection ? (
                  <span className="text-purple-400 font-bold">FERTŐZÖTT (-4 HP/óra)</span>
                ) : (
                  <span className="text-emerald-400">Tiszta sebek</span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onTreatPlayer('balm');
              }}
              disabled={!state.player.injuries.infection || (state.inventory.medicinal_herb || 0) < 2}
              className={`mt-2 py-1.5 px-2.5 rounded font-medium transition ${
                state.player.injuries.infection && (state.inventory.medicinal_herb || 0) >= 2
                  ? 'bg-purple-700 hover:bg-purple-600 text-white'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              Fertőtlenítés (2 gyógynövény kell)
            </button>
          </div>

          {/* Malaria / Tropical Fever */}
          <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-stone-200 block">Malária / Láz</span>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Állapot: {state.player.injuries.malaria ? (
                  <span className="text-orange-400 font-bold">TRÓPUSI LÁZ (Didergés)</span>
                ) : (
                  <span className="text-emerald-400">Normál állapot</span>
                )}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onTreatPlayer('tea');
              }}
              disabled={!state.player.injuries.malaria || (state.inventory.fever_tea || 0) < 1}
              className={`mt-2 py-1.5 px-2.5 rounded font-medium transition ${
                state.player.injuries.malaria && (state.inventory.fever_tea || 0) >= 1
                  ? 'bg-lime-700 hover:bg-lime-600 text-white'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              Kinin tea ivása ({state.inventory.fever_tea || 0} készleten)
            </button>
          </div>
        </div>
      </div>

      {/* Crafting & Workshop Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Crafting Recipes Grid */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Hammer className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-stone-100">Készítés &amp; Műhely (Kraftolás)</h3>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                onClick={() => setSelectedTier(0)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedTier === 0 ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Minden Tier
              </button>
              <button
                onClick={() => setSelectedTier(1)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedTier === 1 ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Tier 1 (Organikus)
              </button>
              <button
                onClick={() => setSelectedTier(2)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedTier === 2 ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Tier 2 (Kő &amp; Agyag)
              </button>
              <button
                onClick={() => setSelectedTier(3)}
                className={`px-2.5 py-1 rounded transition font-medium ${
                  selectedTier === 3 ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                Tier 3 (Fém &amp; Gép)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredRecipes.map((recipe) => {
              const craftable = canCraft(recipe);
              return (
                <div
                  key={recipe.id}
                  className={`p-3.5 rounded-lg border transition flex flex-col justify-between ${
                    craftable
                      ? 'bg-stone-950/70 border-emerald-800/80 hover:border-emerald-500'
                      : 'bg-stone-950/40 border-stone-800/60 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-stone-200">{recipe.nameHu}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stone-800 text-amber-400">
                        Tier {recipe.tier}
                      </span>
                    </div>

                    <p className="text-xs text-stone-400 mb-2 leading-relaxed">{recipe.descriptionHu}</p>

                    {/* Cost */}
                    <div className="mb-3">
                      <span className="text-[11px] font-medium text-stone-400 block mb-1">Szükséges alapanyagok:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(recipe.cost).map(([itemId, required]) => {
                          const have = state.inventory[itemId] || 0;
                          const enough = have >= required;
                          return (
                            <span
                              key={itemId}
                              className={`text-[11px] px-2 py-0.5 rounded font-mono border ${
                                enough
                                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                                  : 'bg-rose-950/50 border-rose-900 text-rose-300'
                              }`}
                            >
                              {itemNamesHu[itemId] || itemId}: {have}/{required}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sound.playCraftSuccess();
                      onCraft(recipe);
                    }}
                    disabled={!craftable}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow ${
                      craftable
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    <Hammer className="w-3.5 h-3.5" />
                    <span>{craftable ? 'Elkészítés / Építés' : 'Hiányzó nyersanyagok'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Inventory & Stockpile */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-stone-100">Készlet &amp; Raktár (Inventory)</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                {allActiveInventory.length} féle tétel
              </span>
            </div>

            <p className="text-xs text-stone-400 mb-3">
              A szigeten gyűjtött és készített nyersanyagok rendezése és kezelése:
            </p>

            {/* Quick Sort Controls */}
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5 p-2 bg-stone-950/80 rounded-lg border border-stone-800/80">
              {/* Category Quick Sort Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setInventorySort('category');
                  setInventoryFilter('all');
                }}
                className={`px-2.5 py-1 text-xs rounded font-semibold transition flex items-center gap-1.5 shadow-sm ${
                  inventorySort === 'category'
                    ? 'bg-emerald-600 text-white shadow-emerald-900/40 ring-1 ring-emerald-400'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                }`}
                title="Kattints az azonnali kategória szerinti rendezéshez (Élelem, Orvosi, Szerszámok, Nyersanyagok, Ereklyék)"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-300" />
                <span>Kategória rendezés</span>
              </button>

              {/* Cycle Sort Mode Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setInventorySort((prev) =>
                    prev === 'category' ? 'count_desc' : prev === 'count_desc' ? 'name_asc' : 'category'
                  );
                }}
                className="px-2 py-1 text-xs rounded font-medium bg-stone-800/90 text-stone-300 hover:bg-stone-700 hover:text-white transition flex items-center gap-1 border border-stone-700/60"
                title="Rendezési mód váltása: Kategória / Mennyiség / Név"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {inventorySort === 'category'
                    ? 'Mód: Kategóriák'
                    : inventorySort === 'count_desc'
                    ? 'Mód: Mennyiség (↓)'
                    : 'Mód: Név (A-Z)'}
                </span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 mb-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setInventoryFilter('all');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  inventoryFilter === 'all'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-stone-800/80 text-stone-400 hover:text-stone-200'
                }`}
              >
                Mind ({allActiveInventory.length})
              </button>
              {(['food', 'medicine', 'tool', 'raw', 'relic'] as ItemCategory[]).map((cat) => {
                const conf = CATEGORY_DEFINITIONS[cat];
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setInventoryFilter(inventoryFilter === cat ? 'all' : cat);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                      inventoryFilter === cat
                        ? `${conf.badgeClass} ring-1 ring-white/30 font-semibold shadow`
                        : count > 0
                        ? 'bg-stone-800/70 text-stone-300 hover:bg-stone-700/70'
                        : 'bg-stone-900/40 text-stone-600 cursor-not-allowed'
                    }`}
                    disabled={count === 0}
                  >
                    <span>{conf.icon}</span>
                    <span>{conf.nameHu.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Items List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {allActiveInventory.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500 bg-stone-950/40 rounded-lg border border-dashed border-stone-800">
                  <Package className="w-8 h-8 mx-auto mb-2 text-stone-600" />
                  <p>Üres a raktár. Gyűjts uszadékfát és kókuszdiót a szigeten!</p>
                </div>
              ) : sortedInventory.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-500 bg-stone-950/40 rounded-lg">
                  <p>Nincs ilyen kategóriájú tétel a raktárban.</p>
                  <button
                    onClick={() => setInventoryFilter('all')}
                    className="mt-2 text-emerald-400 underline hover:text-emerald-300"
                  >
                    Összes tétel mutatása
                  </button>
                </div>
              ) : inventorySort === 'category' && inventoryFilter === 'all' ? (
                // Grouped by Category View
                (['food', 'medicine', 'tool', 'raw', 'relic'] as ItemCategory[]).map((cat) => {
                  const conf = CATEGORY_DEFINITIONS[cat];
                  const catItems = sortedInventory.filter(([id]) => getItemCategory(id) === cat);
                  if (catItems.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 px-1 pt-1.5 pb-0.5 border-b border-stone-800/60">
                        <span className="flex items-center gap-1.5">
                          <span className="text-xs">{conf.icon}</span>
                          <span className={conf.textClass}>{conf.nameHu}</span>
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {catItems.length} fajta ({catItems.reduce((acc, [_, c]) => acc + c, 0)} db)
                        </span>
                      </div>

                      {catItems.map(([itemId, count]) => {
                        const itemMeta = ITEM_CATALOG[itemId];
                        const itemName = getItemName(itemId);

                        return (
                          <div
                            key={itemId}
                            className={`bg-stone-950/70 border border-stone-800/80 rounded px-2.5 py-1.5 flex items-center justify-between text-xs transition hover:border-stone-700 ${conf.borderClass}`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="text-sm select-none shrink-0">{itemMeta?.icon || '📦'}</span>
                              <div className="min-w-0">
                                <span className="text-stone-200 font-medium truncate block">{itemName}</span>
                                <span className={`inline-block px-1 rounded text-[9px] font-semibold border ${conf.badgeClass}`}>
                                  {conf.nameHu}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-700 shrink-0 text-xs shadow-inner">
                              x{count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                // Flat / Custom Sorted View
                sortedInventory.map(([itemId, count]) => {
                  const cat = getItemCategory(itemId);
                  const conf = CATEGORY_DEFINITIONS[cat];
                  const itemMeta = ITEM_CATALOG[itemId];
                  const itemName = getItemName(itemId);

                  return (
                    <div
                      key={itemId}
                      className={`bg-stone-950/70 border border-stone-800/80 rounded px-2.5 py-1.5 flex items-center justify-between text-xs transition hover:border-stone-700 ${conf.borderClass}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="text-sm select-none shrink-0">{itemMeta?.icon || '📦'}</span>
                        <div className="min-w-0">
                          <span className="text-stone-200 font-medium truncate block">{itemName}</span>
                          <span className={`inline-block px-1 rounded text-[9px] font-semibold border ${conf.badgeClass}`}>
                            {conf.nameHu}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-700 shrink-0 text-xs shadow-inner">
                        x{count}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
            <span>Raktárkapacitás: {state.base.storageCapacity} tétel</span>
            <span className="text-emerald-400 font-semibold">Biztonságos a bázison</span>
          </div>
        </div>
      </div>
    </div>
  );
};
