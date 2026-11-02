import React from 'react';
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
} from 'lucide-react';

interface BaseWorkshopProps {
  state: GameState;
  onCraft: (recipe: CraftingRecipe) => void;
  onTreatPlayer: (treatmentType: 'splint' | 'bandage' | 'tea' | 'balm') => void;
  onCollectRainWater: () => void;
  onTendFire: () => void;
}

export const BaseWorkshop: React.FC<BaseWorkshopProps> = ({
  state,
  onCraft,
  onTreatPlayer,
  onCollectRainWater,
  onTendFire,
}) => {
  const [selectedTier, setSelectedTier] = React.useState<number>(0); // 0 = all
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

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

  const inventoryEntries = Object.entries(state.inventory).filter(([_, count]) => count > 0);

  const itemNamesHu: Record<string, string> = {
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
  };

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
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-stone-100">Készlet &amp; Raktár (Inventory)</h3>
            </div>

            <p className="text-xs text-stone-400 mb-3">
              A szigeten gyűjtött és készített nyersanyagok listája:
            </p>

            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {inventoryEntries.length === 0 ? (
                <div className="text-center py-6 text-xs text-stone-500">
                  Üres a raktár. Gyűjts uszadékfát a partról!
                </div>
              ) : (
                inventoryEntries.map(([itemId, count]) => (
                  <div
                    key={itemId}
                    className="bg-stone-950/60 border border-stone-800/80 rounded px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <span className="text-stone-300 font-medium">{itemNamesHu[itemId] || itemId}</span>
                    <span className="font-mono text-emerald-400 font-bold bg-stone-900 px-2 py-0.5 rounded border border-stone-700">
                      x{count}
                    </span>
                  </div>
                ))
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
