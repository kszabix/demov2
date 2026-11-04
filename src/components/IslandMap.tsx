import React from 'react';
import { GameState, ZoneId, WeatherType } from '../game/simulation';
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
  Sun,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  CloudSun,
  RefreshCw,
} from 'lucide-react';

interface WeatherEffectConfig {
  nameHu: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  icon: React.ReactNode;
  tempModifier: string;
  survivalImpact: string;
  descriptionHu: string;
}

const WEATHER_CONFIGS: Record<WeatherType, WeatherEffectConfig> = {
  clear: {
    nameHu: 'Trópusi Napsütés',
    badgeBg: 'bg-amber-950/85',
    badgeBorder: 'border-amber-500/70',
    textColor: 'text-amber-200',
    icon: <Sun className="w-4 h-4 text-amber-400" />,
    tempModifier: 'Meleg, száraz levegő',
    survivalImpact: 'Normál hidratáció és kényelmes utazási sebesség.',
    descriptionHu: 'Tiszta égbolt és ragyogó trópusi fény a sziget felett.',
  },
  heatwave: {
    nameHu: 'Tikkasztó Hőségriadó',
    badgeBg: 'bg-orange-950/90',
    badgeBorder: 'border-orange-500/90',
    textColor: 'text-orange-200',
    icon: <Flame className="w-4 h-4 text-orange-400 animate-pulse" />,
    tempModifier: 'Extrém forróság & UV',
    survivalImpact: 'Fokozott szomjazás (-35% víz), napszúrás kockázata!',
    descriptionHu: 'Forró délibáb és perzselő hőség a sziklás hegygerinceken.',
  },
  rain: {
    nameHu: 'Trópusi Esőzés',
    badgeBg: 'bg-cyan-950/90',
    badgeBorder: 'border-cyan-500/80',
    textColor: 'text-cyan-200',
    icon: <CloudRain className="w-4 h-4 text-cyan-400" />,
    tempModifier: 'Hűvös monszun zápor',
    survivalImpact: 'Ivóvíz gyűjtési bónusz (+50%), de testhőmérséklet-csökkenés!',
    descriptionHu: 'Áztató záporeső, párás esőerdő és csúszós ösvények.',
  },
  storm: {
    nameHu: 'Ciklon & Vihar',
    badgeBg: 'bg-purple-950/95',
    badgeBorder: 'border-yellow-400/90',
    textColor: 'text-yellow-200',
    icon: <CloudLightning className="w-4 h-4 text-yellow-300 animate-pulse" />,
    tempModifier: 'Viharos szél & Villámlás',
    survivalImpact: 'Kritikus veszély: erős áramlatok és sérülés kockázat!',
    descriptionHu: 'Sötét viharfellegek, heves széllökések és villámlás a vulkán felett.',
  },
};

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
  const [previewWeather, setPreviewWeather] = React.useState<WeatherType | null>(null);

  const activeWeather: WeatherType = previewWeather || state.weather || 'clear';
  const weatherInfo = WEATHER_CONFIGS[activeWeather] || WEATHER_CONFIGS.clear;
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

          {/* Weather Status Bar & Simulation Indicator */}
          <div className="mb-3 p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 backdrop-blur-sm transition-colors duration-500 bg-stone-950/70 border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border shadow-sm ${weatherInfo.badgeBg} ${weatherInfo.badgeBorder}`}>
                {weatherInfo.icon}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${weatherInfo.textColor}`}>
                    {weatherInfo.nameHu}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60 font-semibold">
                    {state.ambientTemperature}°C
                  </span>
                  {previewWeather && (
                    <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-700/60 px-1.5 py-0.2 rounded">
                      Előnézet
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-stone-300 leading-tight mt-0.5">
                  {weatherInfo.survivalImpact}
                </span>
              </div>
            </div>

            {/* Quick Weather Tester Pills */}
            <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
              <span className="text-[9px] uppercase tracking-wider text-stone-400 font-mono hidden md:inline mr-1">
                Időjárás:
              </span>
              <button
                onClick={() => {
                  sound.playClick();
                  setPreviewWeather(previewWeather === 'clear' ? null : 'clear');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition ${
                  activeWeather === 'clear'
                    ? 'bg-amber-950 text-amber-200 border-amber-500'
                    : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
                title="Tiszta Napsütés"
              >
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Nap</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setPreviewWeather(previewWeather === 'heatwave' ? null : 'heatwave');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition ${
                  activeWeather === 'heatwave'
                    ? 'bg-orange-950 text-orange-200 border-orange-500'
                    : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
                title="Hőségriadó"
              >
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="hidden sm:inline">Hőség</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setPreviewWeather(previewWeather === 'rain' ? null : 'rain');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition ${
                  activeWeather === 'rain'
                    ? 'bg-cyan-950 text-cyan-200 border-cyan-500'
                    : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
                title="Trópusi Eső"
              >
                <CloudRain className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Eső</span>
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setPreviewWeather(previewWeather === 'storm' ? null : 'storm');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-0.5 transition ${
                  activeWeather === 'storm'
                    ? 'bg-purple-950 text-yellow-200 border-yellow-400'
                    : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
                title="Vihar & Ciklon"
              >
                <CloudLightning className="w-3 h-3 text-yellow-300" />
                <span className="hidden sm:inline">Vihar</span>
              </button>
              {previewWeather && (
                <button
                  onClick={() => {
                    sound.playClick();
                    setPreviewWeather(null);
                  }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-emerald-800/60 flex items-center gap-0.5 transition"
                  title="Visszaállítás a játék valós szimulációjára"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Élő</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Topological Island Graphic SVG/Canvas styling */}
          <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-emerald-900/40 bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 p-3 shadow-inner">
            {/* CSS Animation Keyframes for Weather Effects */}
            <style>{`
              @keyframes rainScroll {
                0% { transform: translateY(-60px) translateX(25px); }
                100% { transform: translateY(0px) translateX(0px); }
              }
              @keyframes stormFlash {
                0%, 90%, 94%, 98%, 100% { opacity: 0; }
                91% { opacity: 0.65; }
                92% { opacity: 0.15; }
                93% { opacity: 0.5; }
              }
              @keyframes heatShimmer {
                0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.25; }
                50% { transform: translateY(-7px) scaleY(1.12); opacity: 0.6; }
              }
              @keyframes sunPulse {
                0%, 100% { transform: scale(1); opacity: 0.25; }
                50% { transform: scale(1.22); opacity: 0.45; }
              }
              @keyframes windStreak {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>

            {/* DYNAMIC VISUAL WEATHER OVERLAYS */}
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {/* 1. Clear: Golden Tropical Sky Glow & Sun Rays */}
              {activeWeather === 'clear' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-yellow-400/5 to-transparent transition-opacity duration-700" />
                  <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-amber-400/20 blur-2xl animate-[sunPulse_6s_ease-in-out_infinite]" />
                  <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-yellow-200/15 blur-lg" />
                </>
              )}

              {/* 2. Heatwave: Orange/Red Heat Dome & Shimmering Waves */}
              {activeWeather === 'heatwave' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-600/25 via-amber-600/15 to-red-950/25 transition-opacity duration-700" />
                  <div className="absolute inset-0 flex flex-col justify-around opacity-45">
                    <div className="w-full h-10 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent blur-sm animate-[heatShimmer_3s_ease-in-out_infinite]" />
                    <div className="w-full h-10 bg-gradient-to-r from-transparent via-red-500/25 to-transparent blur-sm animate-[heatShimmer_4s_ease-in-out_infinite_1s]" />
                    <div className="w-full h-10 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent blur-sm animate-[heatShimmer_3.5s_ease-in-out_infinite_2s]" />
                  </div>
                </>
              )}

              {/* 3. Rain: Cool Slate Tint & Diagonal Animated Rain Streaks */}
              {activeWeather === 'rain' && (
                <>
                  <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[0.5px] transition-opacity duration-700" />
                  <svg className="absolute inset-0 w-full h-full opacity-65" preserveAspectRatio="none">
                    <defs>
                      <pattern id="rainPattern" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
                        <line x1="10" y1="0" x2="8" y2="28" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.8" />
                        <line x1="35" y1="12" x2="33" y2="40" stroke="#bae6fd" strokeWidth="1.0" strokeOpacity="0.65" />
                        <line x1="50" y1="5" x2="48" y2="35" stroke="#7dd3fc" strokeWidth="1.3" strokeOpacity="0.75" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#rainPattern)" className="animate-[rainScroll_0.8s_linear_infinite]" />
                  </svg>
                </>
              )}

              {/* 4. Storm: Dark Tempestuous Sky, Torrential Rain & Lightning Flashes */}
              {activeWeather === 'storm' && (
                <>
                  <div className="absolute inset-0 bg-slate-950/60 transition-opacity duration-700" />
                  <svg className="absolute inset-0 w-full h-full opacity-80" preserveAspectRatio="none">
                    <defs>
                      <pattern id="stormRainPattern" width="50" height="50" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
                        <line x1="8" y1="0" x2="5" y2="32" stroke="#38bdf8" strokeWidth="1.8" strokeOpacity="0.9" />
                        <line x1="28" y1="10" x2="25" y2="44" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
                        <line x1="44" y1="4" x2="41" y2="38" stroke="#7dd3fc" strokeWidth="1.8" strokeOpacity="0.85" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#stormRainPattern)" className="animate-[rainScroll_0.5s_linear_infinite]" />
                  </svg>
                  {/* Lightning Flash Overlay */}
                  <div className="absolute inset-0 bg-cyan-100/40 animate-[stormFlash_4.5s_ease-in-out_infinite]" />
                  {/* Swirling High-Altitude Wind Gusts */}
                  <div className="absolute top-[20%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent blur-xs animate-[windStreak_1.8s_linear_infinite]" />
                  <div className="absolute top-[60%] left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-xs animate-[windStreak_2.2s_linear_infinite_0.9s]" />
                </>
              )}
            </div>

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
