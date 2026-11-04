import React from 'react';
import { GameState, ZoneId } from '../game/simulation';
import { ISLAND_ZONES, ZoneData } from '../game/recipes';
import { sound } from '../utils/audio';
import {
  Compass,
  MapPin,
  Waves,
  Trees,
  Skull,
  Mountain,
  Sparkles,
  AlertTriangle,
  Pickaxe,
  Footprints,
  ShieldAlert,
  Flame,
} from 'lucide-react';

interface IslandMapProps {
  state: GameState;
  onSelectZone: (zoneId: ZoneId) => void;
  onForageInZone: () => void;
  isGathering: boolean;
}

export const IslandMap: React.FC<IslandMapProps> = ({
  state,
  onSelectZone,
  onForageInZone,
  isGathering,
}) => {
  const [selectedZoneKey, setSelectedZoneKey] = React.useState<ZoneId>(state.currentZone);
  const activeZone: ZoneData = ISLAND_ZONES[selectedZoneKey] || ISLAND_ZONES.coast;

  const zoneIcons: Record<string, React.ReactNode> = {
    coast: <Waves className="w-5 h-5 text-cyan-400" />,
    rainforest: <Trees className="w-5 h-5 text-emerald-400" />,
    swamp: <Skull className="w-5 h-5 text-lime-400" />,
    volcano: <Mountain className="w-5 h-5 text-orange-400" />,
    ruins: <Sparkles className="w-5 h-5 text-amber-400" />,
  };

  const isCurrent = state.currentZone === selectedZoneKey;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Visual Topological Map Representation */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400 animate-spin-slow" />
              <h2 className="text-lg font-bold tracking-wide text-stone-100 uppercase">
                Sziget Topográfia &amp; Zónák (10 km² • Max +850m • Mélység -30m)
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Láthatatlan falak nélkül
            </span>
          </div>

          <p className="text-xs text-stone-400 mb-4">
            A sziget teljes területe kb. 10 km², legmagasabb pontja az északi vulkán csúcsa (+850m), míg a part menti korallzátonyok után a tengerfenék -30 méter mélységig süllyed. Válassz zónát az átvonuláshoz!
          </p>

          {/* Interactive Topological Island Graphic SVG/Canvas styling */}
          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-emerald-900/40 bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 p-3 shadow-inner">
            {/* Deep ocean boundary & sharks indicator */}
            <div className="absolute inset-0 border-4 border-dashed border-cyan-800/30 rounded-lg pointer-events-none flex items-center justify-center">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest bg-slate-950/85 px-3 py-1 rounded border border-cyan-800/60 shadow">
                Nyílt Óceán &amp; Ragadozó Cápák (Mélység: -30m • Távolság: &gt;1800m)
              </span>
            </div>

            {/* Topographic Regions buttons */}
            {/* 1. North: Extinct Volcano */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedZoneKey('volcano');
              }}
              className={`absolute top-[8%] left-[32%] w-[36%] h-[26%] rounded-xl transition-all flex flex-col items-center justify-center p-2 text-center border ${
                selectedZoneKey === 'volcano'
                  ? 'bg-orange-950/80 border-orange-500 ring-2 ring-orange-500/50 shadow-lg shadow-orange-950'
                  : 'bg-orange-950/40 hover:bg-orange-950/60 border-orange-900/60'
              }`}
            >
              <Mountain className="w-6 h-6 text-orange-400 mb-0.5" />
              <span className="text-xs font-bold text-orange-200">Kihűlt Vulkán</span>
              <span className="text-[10px] text-orange-300 font-mono">Csúcs: +850m • Kaldera</span>
              {state.currentZone === 'volcano' && (
                <span className="mt-1 flex items-center gap-1 text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" /> Jelenlegi hely
                </span>
              )}
            </button>

            {/* 2. Center: Tropical Rainforest */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedZoneKey('rainforest');
              }}
              className={`absolute top-[38%] left-[22%] w-[56%] h-[32%] rounded-xl transition-all flex flex-col items-center justify-center p-2 text-center border ${
                selectedZoneKey === 'rainforest'
                  ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950'
                  : 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-900/60'
              }`}
            >
              <Trees className="w-7 h-7 text-emerald-400 mb-0.5" />
              <span className="text-xs font-bold text-emerald-200">Trópusi Esőerdő</span>
              <span className="text-[10px] text-emerald-300 font-mono">Folyóvölgy &amp; Repülőgép (+25m...+150m)</span>
              {state.currentZone === 'rainforest' && (
                <span className="mt-1 flex items-center gap-1 text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" /> Jelenlegi hely
                </span>
              )}
            </button>

            {/* 3. Southeast: Swamp */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedZoneKey('swamp');
              }}
              className={`absolute bottom-[10%] right-[6%] w-[38%] h-[26%] rounded-xl transition-all flex flex-col items-center justify-center p-2 text-center border ${
                selectedZoneKey === 'swamp'
                  ? 'bg-lime-950/80 border-lime-500 ring-2 ring-lime-500/50 shadow-lg shadow-lime-950'
                  : 'bg-lime-950/40 hover:bg-lime-950/60 border-lime-900/60'
              }`}
            >
              <Skull className="w-5 h-5 text-lime-400 mb-0.5" />
              <span className="text-xs font-bold text-lime-200">Mocsárvidék</span>
              <span className="text-[10px] text-lime-300 font-mono">Iszap &amp; Orchideák (+2m...+25m)</span>
              {state.currentZone === 'swamp' && (
                <span className="mt-1 flex items-center gap-1 text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" /> Jelenlegi hely
                </span>
              )}
            </button>

            {/* 4. Southwest / Edge: Coast & Shallows */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedZoneKey('coast');
              }}
              className={`absolute bottom-[10%] left-[6%] w-[38%] h-[26%] rounded-xl transition-all flex flex-col items-center justify-center p-2 text-center border ${
                selectedZoneKey === 'coast'
                  ? 'bg-cyan-950/80 border-cyan-500 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-950'
                  : 'bg-cyan-950/40 hover:bg-cyan-950/60 border-cyan-900/60'
              }`}
            >
              <Waves className="w-5 h-5 text-cyan-400 mb-0.5" />
              <span className="text-xs font-bold text-cyan-200">Partvidék &amp; Zátonyok</span>
              <span className="text-[10px] text-cyan-300 font-mono">Bázis (0m...+15m • Mélység -30m)</span>
              {state.currentZone === 'coast' && (
                <span className="mt-1 flex items-center gap-1 text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                  <MapPin className="w-2.5 h-2.5" /> Jelenlegi hely
                </span>
              )}
            </button>

            {/* 5. Center-North hidden: Ancient Ruins */}
            <button
              onClick={() => {
                sound.playClick();
                setSelectedZoneKey('ruins');
              }}
              className={`absolute top-[28%] right-[8%] w-[26%] h-[20%] rounded-xl transition-all flex flex-col items-center justify-center p-1.5 text-center border ${
                selectedZoneKey === 'ruins'
                  ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950'
                  : 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-900/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 mb-0.5" />
              <span className="text-[11px] font-bold text-amber-200">Ősi Romok</span>
              <span className="text-[9px] text-amber-300 font-mono">Templomhegy (+160m...+340m)</span>
              {state.currentZone === 'ruins' && (
                <span className="mt-0.5 flex items-center gap-0.5 text-[8px] bg-emerald-500 text-slate-950 font-bold px-1 py-0.2 rounded-full">
                  <MapPin className="w-2 h-2" /> Itt vagy
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Travel action if not current */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            Kijelölve: <strong className="text-stone-200">{activeZone.nameHu}</strong>
          </div>
          {!isCurrent ? (
            <button
              onClick={() => {
                sound.playClick();
                onSelectZone(selectedZoneKey);
              }}
              className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md"
            >
              <Footprints className="w-4 h-4" />
              <span>Átvonulás erre a zónára (30 perc)</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <MapPin className="w-3.5 h-3.5" /> Jelenleg ebben a zónában tartózkodsz
            </span>
          )}
        </div>
      </div>

      {/* Selected Zone Details, Resources & Foraging Station */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-stone-800 border border-stone-700">
              {zoneIcons[selectedZoneKey]}
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-100">{activeZone.nameHu}</h3>
              <p className="text-xs text-stone-400">{activeZone.nameEn} • {activeZone.ratio} terület</p>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed bg-stone-950/60 p-3 rounded-lg border border-stone-800/80 mb-4">
            {activeZone.descriptionHu}
          </p>

          {/* Resources Available */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <Pickaxe className="w-3.5 h-3.5 text-amber-400" /> Jellegzetes Nyersanyagok
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {activeZone.resources.map((res) => (
                <div
                  key={res.id}
                  className="bg-stone-950/50 border border-stone-800/80 rounded px-2.5 py-1.5 flex items-center justify-between text-xs"
                >
                  <span className="text-stone-300 font-medium">{res.nameHu}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {Math.round(res.chance * 100)}% esély
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hazards & Environmental Dangers */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Természeti Veszélyek
            </h4>
            <ul className="space-y-1.5">
              {activeZone.hazards.map((haz, idx) => (
                <li
                  key={idx}
                  className="text-xs text-rose-200/90 bg-rose-950/30 border border-rose-900/40 rounded px-2.5 py-1 flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{haz}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Foraging Action */}
        <div className="mt-4 pt-3 border-t border-stone-800">
          {isCurrent ? (
            <button
              onClick={() => {
                sound.playClick();
                onForageInZone();
              }}
              disabled={isGathering || state.player.stamina < 15}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                isGathering || state.player.stamina < 15
                  ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              <Pickaxe className={`w-4 h-4 ${isGathering ? 'animate-bounce' : ''}`} />
              <span>
                {isGathering
                  ? 'Átfésülöd a területet...'
                  : state.player.stamina < 15
                  ? 'Kimerültél (-15 állóképesség kell)'
                  : 'Környezet Átfésülése & Gyűjtögetés (-15 Stamina)'}
              </span>
            </button>
          ) : (
            <div className="text-center py-2 text-xs text-stone-500">
              Gyűjtögetéshez először vonulj át erre a zónára.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
