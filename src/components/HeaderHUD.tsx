import React from 'react';
import { GameState } from '../game/simulation';
import { sound } from '../utils/audio';
import {
  Heart,
  Droplets,
  Flame,
  Sun,
  CloudRain,
  Zap,
  Thermometer,
  Brain,
  BatteryCharging,
  Clock,
  Compass,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';

interface HeaderHUDProps {
  state: GameState;
  onAdvanceTime: (minutes: number) => void;
  onTendFire: () => void;
  onOpenCrafting: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  state,
  onAdvanceTime,
  onTendFire,
  onOpenCrafting,
}) => {
  const [muted, setMuted] = React.useState(sound.getIsMuted());

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted) sound.playClick();
  };

  const weatherIcons: Record<string, React.ReactNode> = {
    clear: <Sun className="w-4 h-4 text-amber-400" />,
    heatwave: <Sun className="w-4 h-4 text-orange-500 animate-pulse" />,
    rain: <CloudRain className="w-4 h-4 text-cyan-400" />,
    storm: <Zap className="w-4 h-4 text-purple-400 animate-bounce" />,
  };

  const weatherNamesHu: Record<string, string> = {
    clear: 'Tiszta égbolt',
    heatwave: 'Hőhullám (38°C+)',
    rain: 'Trópusi monszuneső',
    storm: 'Heves óceáni vihar',
  };

  const hours = Math.floor(state.timeOfDayHours);
  const minutes = Math.floor((state.timeOfDayHours % 1) * 60);
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isNight = hours < 6 || hours >= 19;

  const hasInjuries =
    state.player.injuries.bleeding ||
    state.player.injuries.fracture ||
    state.player.injuries.infection ||
    state.player.injuries.malaria;

  return (
    <header className="bg-slate-900/95 border-b border-emerald-950/80 backdrop-blur sticky top-0 z-40 text-stone-200 px-4 py-2.5 shadow-xl">
      {/* Top row: Status, Weather, Time, Ambient */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold tracking-wider">
              {state.day}. NAP
            </span>
            <div className="flex items-center gap-1.5 text-xs text-stone-300 font-mono bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formattedTime}</span>
              <span className="text-[10px] text-stone-400">({isNight ? 'Éjszaka' : 'Nappal'})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700">
            {weatherIcons[state.weather]}
            <span className="text-stone-300">{weatherNamesHu[state.weather]}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-xs text-stone-300 bg-stone-800/80 px-2 py-0.5 rounded border border-stone-700">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span>Környezet: {state.ambientTemperature}°C</span>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          {state.base.campfireLit ? (
            <button
              onClick={() => {
                sound.playClick();
                onTendFire();
              }}
              className="flex items-center gap-1.5 text-xs bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 px-2.5 py-1 rounded transition"
              title="Fa hozzáadása a tűzhöz"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Tábortűz ({Math.round(state.base.campfireFuel)}p)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onTendFire();
              }}
              className="flex items-center gap-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 px-2.5 py-1 rounded transition"
            >
              <Flame className="w-3.5 h-3.5 text-stone-400" />
              <span>Tűzgyújtás</span>
            </button>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onAdvanceTime(60);
            }}
            className="flex items-center gap-1 text-xs bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-700/60 px-2.5 py-1 rounded transition font-medium"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>+1 Óra pihenés</span>
          </button>

          <button
            onClick={toggleSound}
            aria-label={muted ? 'Hang bekapcsolása' : 'Hang némítása'}
            className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Second row: Survival meters */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
        {/* Health */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-rose-300">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" /> Életerő
            </span>
            <span className="font-mono text-stone-200">{state.player.health}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                state.player.health > 50 ? 'bg-rose-500' : 'bg-red-600 animate-pulse'
              }`}
              style={{ width: `${state.player.health}%` }}
            />
          </div>
        </div>

        {/* Hunger */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Jóllakottság
            </span>
            <span className="font-mono text-stone-200">{state.player.hunger}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${state.player.hunger}%` }}
            />
          </div>
        </div>

        {/* Thirst */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-cyan-300">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Hidratáció
            </span>
            <span className="font-mono text-stone-200">{state.player.thirst}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${state.player.thirst}%` }}
            />
          </div>
        </div>

        {/* Body Temp */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-emerald-300">
              <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> Testhő
            </span>
            <span className={`font-mono ${state.player.bodyTemp > 38 ? 'text-rose-400 font-bold' : state.player.bodyTemp < 35.5 ? 'text-cyan-400 font-bold' : 'text-stone-200'}`}>
              {state.player.bodyTemp}°C
            </span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                state.player.bodyTemp > 38
                  ? 'bg-rose-500'
                  : state.player.bodyTemp < 35.5
                  ? 'bg-cyan-400'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.max(10, Math.min(100, ((state.player.bodyTemp - 33) / 9) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Sanity */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-purple-300">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> Ép elme (Morál)
            </span>
            <span className="font-mono text-stone-200">{state.player.sanity}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                state.player.sanity < 35 ? 'bg-purple-600 animate-pulse' : 'bg-purple-500'
              }`}
              style={{ width: `${state.player.sanity}%` }}
            />
          </div>
        </div>

        {/* Stamina */}
        <div className="bg-stone-950/60 p-1.5 rounded border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="flex items-center gap-1 font-medium text-yellow-300">
              <BatteryCharging className="w-3.5 h-3.5 text-yellow-400" /> Állóképesség
            </span>
            <span className="font-mono text-stone-200">{state.player.stamina}%</span>
          </div>
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${state.player.stamina}%` }}
            />
          </div>
        </div>
      </div>

      {/* Critical Injury Warning Alert */}
      {hasInjuries && (
        <div className="max-w-7xl mx-auto mt-2 bg-rose-950/80 border border-rose-800/80 rounded px-3 py-1.5 flex items-center justify-between text-xs text-rose-200 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Aktív testi sérülés:</strong>{' '}
              {[
                state.player.injuries.bleeding && 'Vérző seb',
                state.player.injuries.fracture && 'Csonttörés',
                state.player.injuries.infection && 'Elfertőződött seb',
                state.player.injuries.malaria && 'Trópusi láz/malária',
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
          <button
            onClick={onOpenCrafting}
            className="underline hover:text-white font-semibold transition"
          >
            Kötözés / Műhely megnyitása &rarr;
          </button>
        </div>
      )}
    </header>
  );
};
