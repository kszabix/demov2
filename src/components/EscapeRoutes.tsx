import React from 'react';
import { GameState, evaluateOceanRaft, evaluateAirplane } from '../game/simulation';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sailboat,
  Plane,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Flame,
  Droplets,
  Zap,
} from 'lucide-react';

interface EscapeRoutesProps {
  state: GameState;
  onAttemptEscape: (vehicleType: 'raft' | 'airplane') => void;
  onContributePhase: (vehicleType: 'raft' | 'airplane', phase: number) => void;
  onResetCatastropheModal: () => void;
  catastropheModal: {
    isOpen: boolean;
    vehicleType: 'raft' | 'airplane';
    reason: string;
  } | null;
}

export const EscapeRoutes: React.FC<EscapeRoutesProps> = ({
  state,
  onAttemptEscape,
  onContributePhase,
  onResetCatastropheModal,
  catastropheModal,
}) => {
  const [activeTab, setActiveTab] = React.useState<'raft' | 'airplane'>('raft');

  const raftEval = evaluateOceanRaft(state.oceanRaft, state.weather);
  const planeEval = evaluateAirplane(state.airplane, state.weather);

  const currentEval = activeTab === 'raft' ? raftEval : planeEval;

  const triggerVictoryConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  React.useEffect(() => {
    if (state.isEscaped) {
      triggerVictoryConfetti();
    }
  }, [state.isEscaped]);

  if (state.isEscaped) {
    return (
      <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-sky-950 border border-emerald-500 rounded-xl p-8 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce">
          <Sparkles className="w-10 h-10 text-emerald-300" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-wide mb-2 uppercase">
          🎉 SIKERES SIKERÜLT MENEKÜLÉS! 🎉
        </h2>
        <p className="text-sm text-stone-300 max-w-lg mx-auto mb-6">
          Megvalósítottad a lehetetlent! A gondosan felépített {state.escapeMethod === 'raft' ? 'mélytengeri hajóval' : 'helyreállított repülőgéppel'} átszeltétek a viharos óceánt és elérertétek a mentőhajók nemzetközi zónáját.
        </p>

        <div className="bg-stone-950/80 border border-emerald-900/60 rounded-lg p-4 max-w-md mx-auto text-left mb-6 text-xs text-stone-300 space-y-1.5 font-mono">
          <div>• Túlélési idő: {state.day} nap</div>
          <div>• Társ: {state.companion.isAlive ? `${state.companion.name} (Túlélte veled!)` : 'Egyedül'}</div>
          <div>• Katasztrófák száma a siker előtt: {state.catastrophesCount}</div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-lg transition shadow-lg inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Új Túlélés Kezdése</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Route Switcher Tabs */}
      <div className="flex border-b border-stone-800 bg-slate-900/80 rounded-t-xl p-1 gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('raft');
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'raft'
              ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-800/80 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Sailboat className="w-4 h-4 text-cyan-400" />
          <span>1. Útvonal: Nyílt Tengeri Tutaj / Hajó ({raftEval.readinessPercent}%)</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('airplane');
          }}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 ${
            activeTab === 'airplane'
              ? 'bg-amber-950/90 text-amber-200 border border-amber-800/80 shadow'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Plane className="w-4 h-4 text-amber-400" />
          <span>2. Útvonal: Lezuhant Repülőgép Helyreállítása ({planeEval.readinessPercent}%)</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Phase Checklist & Construction Progress */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                {activeTab === 'raft' ? (
                  <>
                    <Sailboat className="w-5 h-5 text-cyan-400" />
                    <span>Tengerálló Tutaj Építési Fázisai</span>
                  </>
                ) : (
                  <>
                    <Plane className="w-5 h-5 text-amber-400" />
                    <span>Lezuhant Kétmotoros Gép Restaurálása</span>
                  </>
                )}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {activeTab === 'raft'
                  ? 'A korallzátonyok és cápák áttöréséhez merevített test, vitorlázat és készletek kellenek.'
                  : 'A sűrű dzsungel és sziklás terep miatt kifutópálya, szárnyjavítás és bio-etanol kell.'}
              </p>
            </div>

            <span className="text-xs font-mono px-3 py-1 rounded bg-stone-950 border border-stone-800 font-bold text-emerald-400">
              Készültség: {currentEval.readinessPercent}%
            </span>
          </div>

          {/* Phases detailed cards */}
          <div className="space-y-3">
            {activeTab === 'raft' ? (
              <>
                {/* Raft Phase 1 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>1. Fázis: Váz &amp; Felhajtóerő</span>
                      {state.oceanRaft.phase1Hull >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Keményfa rönkök és zárt fémhordók egymáshoz kötözése.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-cyan-500" style={{ width: `${state.oceanRaft.phase1Hull}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 font-bold block">
                      {state.oceanRaft.phase1Hull}%
                    </span>
                    <button
                      onClick={() => onContributePhase('raft', 1)}
                      disabled={state.oceanRaft.phase1Hull >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.oceanRaft.phase1Hull >= 100 ? 'Elkészült' : '+25% Szerelés'}
                    </button>
                  </div>
                </div>

                {/* Raft Phase 2 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>2. Fázis: Szerkezeti merevítés &amp; Vízzáró szurkozás</span>
                      {state.oceanRaft.phase2Sealing >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Fenyőgyanta és tömítés a tengeri szétesés és süllyedés kivédésére.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-cyan-500" style={{ width: `${state.oceanRaft.phase2Sealing}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 font-bold block">
                      {state.oceanRaft.phase2Sealing}%
                    </span>
                    <button
                      onClick={() => onContributePhase('raft', 2)}
                      disabled={state.oceanRaft.phase2Sealing >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.oceanRaft.phase2Sealing >= 100 ? 'Elkészült' : '+25% Szurkozás'}
                    </button>
                  </div>
                </div>

                {/* Raft Phase 3 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>3. Fázis: Vitorlázat &amp; Kormánymű</span>
                      {state.oceanRaft.phase3Sails >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Erős szőtt vitorlavászon és irányítható kormánylapát.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-cyan-500" style={{ width: `${state.oceanRaft.phase3Sails}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 font-bold block">
                      {state.oceanRaft.phase3Sails}%
                    </span>
                    <button
                      onClick={() => onContributePhase('raft', 3)}
                      disabled={state.oceanRaft.phase3Sails >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.oceanRaft.phase3Sails >= 100 ? 'Elkészült' : '+25% Vitorlázat'}
                    </button>
                  </div>
                </div>

                {/* Raft Phase 4 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>4. Fázis: Navigáció, Iránytű &amp; Tengeri Készletek</span>
                      {state.oceanRaft.phase4Supplies >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Tájoló, csillagtérkép, forralt víz és tartós füstölt élelem.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-cyan-500" style={{ width: `${state.oceanRaft.phase4Supplies}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-cyan-400 font-bold block">
                      {state.oceanRaft.phase4Supplies}%
                    </span>
                    <button
                      onClick={() => onContributePhase('raft', 4)}
                      disabled={state.oceanRaft.phase4Supplies >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.oceanRaft.phase4Supplies >= 100 ? 'Elkészült' : '+25% Készlet'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Airplane Phase 1 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>1. Fázis: Felszállópálya irtása a dzsungelben</span>
                      {state.airplane.phase1Runway >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Fák kivágása, gyökerek kiásása és a talaj elsimítása a lezuhanás elkerülésére.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: `${state.airplane.phase1Runway}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 font-bold block">
                      {state.airplane.phase1Runway}%
                    </span>
                    <button
                      onClick={() => onContributePhase('airplane', 1)}
                      disabled={state.airplane.phase1Runway >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.airplane.phase1Runway >= 100 ? 'Elkészült' : '+25% Irtás'}
                    </button>
                  </div>
                </div>

                {/* Airplane Phase 2 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>2. Fázis: Sárkányszerkezet &amp; Szárnyak foltozása</span>
                      {state.airplane.phase2Airframe >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Alumínium lemezek és fém szegek beszegecselése a szárnyakba.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: `${state.airplane.phase2Airframe}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 font-bold block">
                      {state.airplane.phase2Airframe}%
                    </span>
                    <button
                      onClick={() => onContributePhase('airplane', 2)}
                      disabled={state.airplane.phase2Airframe >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.airplane.phase2Airframe >= 100 ? 'Elkészült' : '+25% Foltozás'}
                    </button>
                  </div>
                </div>

                {/* Airplane Phase 3 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>3. Fázis: Motor felújítás &amp; Bio-etanol üzemanyag</span>
                      {state.airplane.phase3Engine >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Erjesztett gyümölcsből lepárolt magas oktánszámú üzemanyag (60L).</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: `${state.airplane.phase3Engine}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 font-bold block">
                      {state.airplane.phase3Engine}%
                    </span>
                    <button
                      onClick={() => onContributePhase('airplane', 3)}
                      disabled={state.airplane.phase3Engine >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.airplane.phase3Engine >= 100 ? 'Elkészült' : '+25% Üzemanyag'}
                    </button>
                  </div>
                </div>

                {/* Airplane Phase 4 */}
                <div className="p-3.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-stone-200 flex items-center gap-2">
                      <span>4. Fázis: Súlycsökkentés &amp; Súlypont egyensúly</span>
                      {state.airplane.phase4Balance >= 100 && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    </span>
                    <p className="text-xs text-stone-400">Felesleges teher kiszórása a sziklaszirtnél történő átesés elkerülésére.</p>
                    <div className="w-48 bg-stone-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-amber-500" style={{ width: `${state.airplane.phase4Balance}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-amber-400 font-bold block">
                      {state.airplane.phase4Balance}%
                    </span>
                    <button
                      onClick={() => onContributePhase('airplane', 4)}
                      disabled={state.airplane.phase4Balance >= 100}
                      className="mt-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1 rounded border border-stone-700 disabled:opacity-40"
                    >
                      {state.airplane.phase4Balance >= 100 ? 'Elkészült' : '+25% Súlyozás'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Launch Risk Assessment & Escape Execution */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-stone-100">Kockázatértékelés (Rogue-lite)</h3>
            </div>

            <p className="text-xs text-stone-400 mb-4">
              GDD 5.C Szabály: Az elhamarkodott indítás nem hoz végleges halált, de katasztrófát idéz elő! A jármű megsemmisül, sérülten ébredsz a parton, és a társad bizalma meginog.
            </p>

            {/* Risk gauges */}
            <div className="space-y-3 mb-4 text-xs">
              <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-stone-400">Katasztrófa kockázata:</span>
                  <span className={`font-mono font-bold ${currentEval.catastropheRiskPercent > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currentEval.catastropheRiskPercent}%
                  </span>
                </div>
                <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentEval.catastropheRiskPercent > 30 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${currentEval.catastropheRiskPercent}%` }}
                  />
                </div>
              </div>

              {/* Weather hazard impact */}
              <div className="bg-stone-950/70 p-2.5 rounded-lg border border-stone-800 text-[11px] text-stone-400">
                <span className="block text-stone-300 font-semibold mb-0.5">Időjárási tényező:</span>
                {state.weather === 'storm' ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Viharos idő! (+45% halálos hullámverés / szélnyírás)
                  </span>
                ) : state.weather === 'rain' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5" /> Esős idő! (+20% csúszós pálya és szivárgás)
                  </span>
                ) : (
                  <span className="text-emerald-400">Ideális, tiszta időjárás.</span>
                )}
              </div>

              {/* Missing requirements */}
              {currentEval.missingRequirements.length > 0 && (
                <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-2.5 text-[11px]">
                  <span className="text-rose-300 font-semibold block mb-1">Hiányzó feltételek:</span>
                  <ul className="space-y-0.5 text-rose-300/80">
                    {currentEval.missingRequirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Escape attempt button */}
          <div className="pt-3 border-t border-stone-800">
            <button
              onClick={() => {
                sound.playClick();
                onAttemptEscape(activeTab);
              }}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                currentEval.catastropheRiskPercent > 40
                  ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {currentEval.catastropheRiskPercent > 40
                  ? 'Kockázatos Indítás Megkísérlése!'
                  : 'Menekülés Indítása (Biztonságos)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Catastrophe Modal (Section 5.C) */}
      {catastropheModal && catastropheModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-xl max-w-lg w-full p-6 text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-950 border border-rose-600 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>

            <h3 className="text-xl font-black text-rose-200 uppercase tracking-wide mb-2">
              Katasztrófa Következett Be!
            </h3>

            <p className="text-xs text-rose-200/90 leading-relaxed mb-4 bg-rose-950/60 p-3 rounded-lg border border-rose-900/60 text-left">
              {catastropheModal.reason}
            </p>

            <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-3 text-xs text-left text-stone-300 space-y-1.5 mb-6">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                Rogue-lite Hatások a túlélésre:
              </span>
              <div>• Bázis és raktározott tárgyak: <strong className="text-emerald-400">MEGMARADTAK</strong></div>
              <div>• Jármű állapota: <strong className="text-rose-400">MEGSEMMISÜLT / Újra kell építeni</strong></div>
              <div>• Testi sérülések: <strong className="text-rose-400">Vérzés és zúzódások a szikláktól</strong></div>
              <div>• Társ morálja: <strong className="text-rose-400">-40 morál &amp; bizalomvesztés</strong></div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onResetCatastropheModal();
              }}
              className="w-full bg-rose-700 hover:bg-rose-600 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider transition shadow-lg"
            >
              Ébredés a kezdő tengerparton...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
