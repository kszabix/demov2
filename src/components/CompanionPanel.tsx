import React from 'react';
import { GameState, CompanionTask } from '../game/simulation';
import { sound } from '../utils/audio';
import {
  Heart,
  Users,
  MessageSquare,
  Sparkles,
  AlertOctagon,
  Eye,
  Shield,
  Coffee,
  Compass,
  Footprints,
  Send,
  Loader2,
  Skull,
  Flame,
  Droplets,
  HeartHandshake,
} from 'lucide-react';

interface CompanionPanelProps {
  state: GameState;
  onAssignTask: (task: CompanionTask, durationMinutes: number) => void;
  onShareSupplies: (type: 'water' | 'food' | 'bandage' | 'tea') => void;
  onSendChatMessage: (message: string) => Promise<void>;
  isSendingChat: boolean;
  onTriggerRomanceMoment: () => void;
}

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  state,
  onAssignTask,
  onShareSupplies,
  onSendChatMessage,
  isSendingChat,
  onTriggerRomanceMoment,
}) => {
  const [chatInput, setChatInput] = React.useState('');
  const comp = state.companion;

  const relationshipNames: Record<number, { name: string; desc: string; color: string }> = {
    1: { name: '1. Ellenséges', desc: 'Bizalmatlan, éjszaka meglophatja a tábort és elszökhet.', color: 'text-rose-500' },
    2: { name: '2. Kizsákmányolt', desc: 'Úgy érzi csak kihasználod, morálja nagyon mélyen van.', color: 'text-orange-400' },
    3: { name: '3. Semleges', desc: 'Óvatos hajótörött társ, a túlélésre összpontosít.', color: 'text-stone-300' },
    4: { name: '4. Együttműködő', desc: 'Bízik az ítélőképességedben és szívesen segít.', color: 'text-emerald-400' },
    5: { name: '5. Hűséges Társ', desc: 'Mély bajtársiasság, a végsőkig kitart melletted.', color: 'text-cyan-400' },
    6: { name: '6. Romantikus Társ', desc: 'Intim kötődés és szerelem a szigeten. Maximális hűség.', color: 'text-pink-400 font-bold' },
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !comp.isAlive) return;
    const msg = chatInput.trim();
    setChatInput('');
    await onSendChatMessage(msg);
  };

  if (!comp.isAlive) {
    return (
      <div className="bg-slate-900/90 border border-rose-950/80 rounded-xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-900 border border-stone-800 flex items-center justify-center">
          <Skull className="w-8 h-8 text-stone-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-200 mb-2">Végleges Permadeath Emlékhely</h2>
        <p className="text-sm text-stone-400 max-w-md mx-auto mb-6">
          {comp.name} nem élte túl a sziget kíméletlen megpróbáltatásait. A Project Isle nem adott UI figyelmeztetést – a fizikai jelek figyelmen kívül hagyása végzetesnek bizonyult.
        </p>

        <div className="bg-stone-950/80 border border-stone-800 rounded-lg p-4 max-w-lg mx-auto text-left mb-6">
          <span className="text-xs uppercase font-semibold text-stone-500 block mb-2">
            Megőrzött Emlékek &amp; Utolsó szavak:
          </span>
          <ul className="space-y-1.5 text-xs text-stone-400 italic">
            {comp.memories.map((mem, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-stone-600">•</span>
                <span>"{mem}"</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-stone-500">
          Napokkal vagy hetekkel később a tengeráramlat talán egy új túlélőt sodor a partra...
        </p>
      </div>
    );
  }

  const relInfo = relationshipNames[comp.relationship];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Companion Status & The Observational Attention Test */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-700 to-cyan-900 border border-emerald-500/50 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">{comp.name}</h3>
                <p className="text-xs text-stone-400">{comp.role}</p>
              </div>
            </div>

            {comp.relationship === 6 && (
              <button
                onClick={() => {
                  sound.playClick();
                  onTriggerRomanceMoment();
                }}
                className="flex items-center gap-1.5 text-xs bg-pink-950/80 hover:bg-pink-900 text-pink-300 border border-pink-700/80 px-2.5 py-1 rounded-full transition shadow animate-pulse"
              >
                <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                <span>Romantikus Pillanat</span>
              </button>
            )}
          </div>

          {/* Relationship Scale (1..6) */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-stone-400 font-medium">Kapcsolati Skála:</span>
              <span className={`font-semibold ${relInfo.color}`}>{relInfo.name}</span>
            </div>

            {/* Stepped progress bar */}
            <div className="grid grid-cols-6 gap-1 h-2 mb-2">
              {[1, 2, 3, 4, 5, 6].map((tier) => (
                <div
                  key={tier}
                  className={`rounded-full transition-all ${
                    comp.relationship >= tier
                      ? tier === 6
                        ? 'bg-pink-500'
                        : tier >= 4
                        ? 'bg-emerald-500'
                        : tier === 3
                        ? 'bg-cyan-500'
                        : 'bg-rose-500'
                  : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-stone-400 leading-snug">{relInfo.desc}</p>
          </div>

          {/* GDD Section 4: Human Attention Test (Observational Signs, NO cheat health bar) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Megfigyeléses Diagnosztika (Nincs UI Életcsík)</span>
              </h4>
              <span className="text-[10px] text-stone-500 font-mono">Permadeath Kockázat</span>
            </div>

            <div className="bg-stone-950/80 border border-amber-900/30 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">Járás és mozgás:</span>
                <span className={`font-medium ${comp.symptoms.isLimping ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {comp.symptoms.isLimping ? '⚠️ Sántít, nehezen lép (törés vagy sérülés)' : 'Magabiztos, egyenletes léptek'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-400">Légzés és hangok:</span>
                <span className={`font-medium ${comp.symptoms.isGroaning ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {comp.symptoms.isGroaning ? '⚠️ Fájdalmasan nyögdécsel, szapora pulzus' : 'Nyugodt lélegzetvétel'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-400">Arcszín és bőr:</span>
                <span className={`font-medium ${comp.symptoms.isFeverish ? 'text-orange-400 font-bold' : 'text-emerald-400'}`}>
                  {comp.symptoms.isFeverish ? '⚠️ Lázas kipirosodás, gyöngyöző homlok' : 'Egészséges tónus'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-400">Kifejezés és ajkak:</span>
                <span className={`font-medium ${comp.symptoms.isDehydrated ? 'text-cyan-400 font-bold' : 'text-emerald-400'}`}>
                  {comp.symptoms.isDehydrated ? '⚠️ Kiszáradt, cserepes ajkak' : 'Hidratált'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-stone-400">Tartás és testbeszéd:</span>
                <span className={`font-medium ${comp.symptoms.isShivering ? 'text-purple-400 font-bold' : 'text-emerald-400'}`}>
                  {comp.symptoms.isShivering ? '⚠️ Remeg, didergés a sokktól/maláriától' : 'Stabil testtartás'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Task & Fatigue */}
          <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-stone-400">Jelenlegi feladat:</span>
              <span className="font-semibold text-stone-200 uppercase tracking-wide">
                {comp.currentTask === 'idle'
                  ? 'Készenlétben a tábornál'
                  : comp.currentTask === 'resting'
                  ? 'Pihen a menedékben'
                  : comp.currentTask === 'gathering_wood'
                  ? `Favágás a dzsungelben (${comp.taskRemainingMinutes}p)`
                  : comp.currentTask === 'gathering_food'
                  ? `Élelemgyűjtés (${comp.taskRemainingMinutes}p)`
                  : comp.currentTask === 'fetching_water'
                  ? `Vízhozatal a patakról (${comp.taskRemainingMinutes}p)`
                  : `Menekülő jármű szerelése (${comp.taskRemainingMinutes}p)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>Fáradtság szintje:</span>
              <span>{comp.fatigue}%</span>
            </div>
          </div>
        </div>

        {/* Share supplies buttons */}
        <div className="mt-4 pt-3 border-t border-stone-800">
          <span className="text-xs font-semibold text-stone-400 block mb-2">
            Gondoskodás &amp; Készletek megosztása:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                sound.playClick();
                onShareSupplies('water');
              }}
              disabled={(state.inventory.clean_water || 0) < 1 && (state.inventory.fresh_water_flask || 0) < 1}
              className="py-1.5 px-2 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-200 transition font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Vízadás</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onShareSupplies('food');
              }}
              disabled={(state.inventory.roasted_meal || 0) < 1 && (state.inventory.coconut || 0) < 1}
              className="py-1.5 px-2 rounded bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 text-amber-200 transition font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-400" />
              <span>Ételadás</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onShareSupplies('bandage');
              }}
              disabled={(state.inventory.herbal_bandage || 0) < 1}
              className="py-1.5 px-2 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-200 transition font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>Kötözés</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onShareSupplies('tea');
              }}
              disabled={(state.inventory.fever_tea || 0) < 1}
              className="py-1.5 px-2 rounded bg-lime-950/70 hover:bg-lime-900 border border-lime-800/80 text-lime-200 transition font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-lime-400" />
              <span>Kinin tea</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Task Assignment & Natural Language Dialogue */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
        <div>
          {/* Task Delegation Controls */}
          <div className="mb-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-emerald-400" />
              <span>Dinamikus Feladatkiosztás (Behavior Tree &amp; Utasítások)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onAssignTask('gathering_wood', 60);
                }}
                disabled={comp.currentTask !== 'idle' || comp.fatigue > 85}
                className="p-2.5 rounded-lg bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700 text-left transition disabled:opacity-50 text-xs"
              >
                <span className="font-semibold text-stone-200 block">🌲 Fa &amp; Lián gyűjtése</span>
                <span className="text-[10px] text-stone-400">Dzsungel rönkök (60p)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onAssignTask('gathering_food', 60);
                }}
                disabled={comp.currentTask !== 'idle' || comp.fatigue > 85}
                className="p-2.5 rounded-lg bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700 text-left transition disabled:opacity-50 text-xs"
              >
                <span className="font-semibold text-stone-200 block">🥥 Élelem és gyógynövény</span>
                <span className="text-[10px] text-stone-400">Kókusz &amp; orvosság (60p)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onAssignTask('fetching_water', 45);
                }}
                disabled={comp.currentTask !== 'idle' || comp.fatigue > 85}
                className="p-2.5 rounded-lg bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700 text-left transition disabled:opacity-50 text-xs"
              >
                <span className="font-semibold text-stone-200 block">💧 Friss patakvíz</span>
                <span className="text-[10px] text-stone-400">Kulacsok töltése (45p)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onAssignTask('working_vehicle', 90);
                }}
                disabled={comp.currentTask !== 'idle' || comp.fatigue > 85}
                className="p-2.5 rounded-lg bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700 text-left transition disabled:opacity-50 text-xs"
              >
                <span className="font-semibold text-stone-200 block">⛵ Menekülő jármű</span>
                <span className="text-[10px] text-stone-400">Tutaj vagy repülő (90p)</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  onAssignTask('resting', 60);
                }}
                disabled={comp.currentTask !== 'idle'}
                className="p-2.5 rounded-lg bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-700 text-left transition disabled:opacity-50 text-xs"
              >
                <span className="font-semibold text-stone-200 block">⛺ Pihenés a táborban</span>
                <span className="text-[10px] text-stone-400">Fáradtság pihentetése</span>
              </button>
            </div>
          </div>

          {/* AI Dialogue Chat Log */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Természetes Nyelvű Kommunikáció (LLM Function Calling)</span>
              </h4>
              <span className="text-[10px] text-stone-500 font-mono">Gemini AI</span>
            </div>

            <div className="bg-stone-950/90 border border-stone-800 rounded-lg p-3 h-48 overflow-y-auto space-y-2 mb-3 text-xs font-mono">
              <div className="bg-emerald-950/40 border border-emerald-900/40 p-2.5 rounded text-emerald-300">
                <strong>{comp.name}:</strong> "Hallgatlak. Akármit szeretnél megbeszélni, vagy utasítást adni, mondd nyugodtan szabad szövegben!"
              </div>

              {comp.memories.slice(0, 4).map((mem, idx) => (
                <div key={idx} className="bg-stone-900/60 p-2 rounded text-stone-400 border border-stone-800/80">
                  <span className="text-stone-500 text-[10px] uppercase block">Emléknyom #{idx + 1}:</span>
                  <span>{mem}</span>
                </div>
              ))}
            </div>

            {/* Quick dialogue suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2.5 text-[11px]">
              <button
                type="button"
                onClick={() => setChatInput('Kérlek menj gyűjts száraz fát és pálmalevelet a tűzhöz!')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-0.5 rounded border border-stone-700 transition"
              >
                "Gyűjts fát a dzsungelből"
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Igyál ebből a friss vízből és pihenj kicsit az árnyékban.')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-0.5 rounded border border-stone-700 transition"
              >
                "Igyál vizet és pihenj"
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Hogy érzed magad? Fáj valamid?')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-0.5 rounded border border-stone-700 transition"
              >
                "Hogy érzed magad?"
              </button>
              <button
                type="button"
                onClick={() => setChatInput('Együtt megcsináljuk, ki fogunk jutni erről a szigetről!')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-0.5 rounded border border-stone-700 transition"
              >
                "Bátorítás / Morál"
              </button>
            </div>
          </div>
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSend} className="pt-2 border-t border-stone-800 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Szólj ${comp.name}-hoz (pl. "Menj fát vágni", "Egyél kókuszdiót")...`}
            disabled={isSendingChat}
            className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isSendingChat || !chatInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow"
          >
            {isSendingChat ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Küldés</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
