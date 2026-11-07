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
  Car,
  Ticket,
  BookOpen,
  Globe2,
  Smile,
  Wrench,
  Trees,
  Award,
  ChevronRight,
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
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'dossier' | 'relics'>('overview');
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
  const backstory = comp.backstory;

  return (
    <div className="space-y-5">
      {/* Top Companion Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-emerald-950/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-emerald-600 to-cyan-700 border-2 border-emerald-400/50 flex items-center justify-center text-xl shadow-lg">
              🧗‍♀️
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-950 rounded-full" title="Életben van" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-stone-100">{comp.name}</h2>
              <span className="text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-600/70 px-2 py-0.5 rounded-full">
                {backstory?.age || 21} éves
              </span>
              <span className="text-xs font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-600/70 px-2 py-0.5 rounded-full">
                Második túlélő veled
              </span>
            </div>
            <p className="text-xs text-stone-400">{comp.role}</p>
          </div>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 bg-stone-950/70 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('overview');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'overview'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Túlélés &amp; Feladatok</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('dossier');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'dossier'
                ? 'bg-amber-600 text-white shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Maya Dosszié &amp; Történet</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveSubTab('relics');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              activeSubTab === 'relics'
                ? 'bg-cyan-700 text-white shadow'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Személyes Ereklyék ('89-es Autó)</span>
          </button>
        </div>
      </div>

      {/* VIEW: DOSSIER (Maya's rich background requested by user) */}
      {activeSubTab === 'dossier' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Hero Banner: Sole Survivor Context */}
          <div className="bg-gradient-to-r from-amber-950/70 via-stone-900 to-cyan-950/70 border border-amber-500/40 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Trópusi Sziget • Túlélőtárs Dosszié
              </span>
              <h3 className="text-xl font-extrabold text-white">
                Maya Vance — 21 éves felfedező és túlélő
              </h3>
              <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
                {backstory?.backgroundSummaryHu}
              </p>
            </div>
            <div className="bg-amber-900/40 border border-amber-500/50 rounded-xl px-4 py-3 shrink-0 text-center">
              <span className="text-2xl block mb-0.5">🤝</span>
              <strong className="text-xs text-amber-200 block">Csak mi ketten</strong>
              <span className="text-[10px] text-amber-400/80">A luxushajó egyetlen túlélői</span>
            </div>
          </div>

          {/* Grid of Story Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: A Nyereményjáték & Világjárás */}
            <div className="bg-slate-900/90 border border-amber-900/50 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Ticket className="w-4 h-4 text-amber-400" />
                <span>A Nyereményjáték &amp; Az Álom</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {backstory?.sweepstakesStoryHu}
              </p>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 italic">
                "{backstory?.dreamHu}"
              </div>
            </div>

            {/* Card 2: Az Első Autó: '89-es Rozsdás Villám */}
            <div className="bg-slate-900/90 border border-cyan-900/50 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Car className="w-4 h-4 text-cyan-400" />
                <span>A '89-es "Rozsdás Villám" Autó</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {backstory?.carStoryHu}
              </p>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-cyan-300 font-mono">
                🔧 Barkácstudás: drót, laposfogó és soha fel nem adás!
              </div>
            </div>

            {/* Card 3: Természetfilmek & Hegyi Túrázás */}
            <div className="bg-slate-900/90 border border-emerald-900/50 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Trees className="w-4 h-4 text-emerald-400" />
                <span>Természetfilmek &amp; Túrázás</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {backstory?.natureLoreHu}
              </p>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>David Attenborough rajongó</span>
              </div>
            </div>

            {/* Card 4: Fantasy Filmek & Vidám Természet */}
            <div className="bg-slate-900/90 border border-purple-900/50 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                <Smile className="w-4 h-4 text-purple-400" />
                <span>Fantasy Filmek &amp; Humor</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {backstory?.fantasyLoreHu}
              </p>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-purple-300 italic font-mono">
                "A vulkán? Az nekem csak a Végzet Hegye!"
              </div>
            </div>

            {/* Card 5: Idegen Nyelvek */}
            <div className="bg-slate-900/90 border border-stone-800 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                <Globe2 className="w-4 h-4 text-sky-400" />
                <span>Beszélt Nyelvek &amp; Kommunikáció</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Mindig vágyott a világ megismerésére, ezért szívesen tanul nyelveket:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {backstory?.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-stone-950 px-2 py-0.5 rounded border border-stone-700 text-stone-300"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Card 6: Személyiségjegyek */}
            <div className="bg-slate-900/90 border border-stone-800 rounded-xl p-4 shadow-lg space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-rose-400" />
                <span>Személyiség &amp; Értékek</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {backstory?.personalityTraitsHu.map((trait, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded"
                  >
                    ✓ {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Favorite Quotes Strip */}
          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-4">
            <span className="text-xs uppercase font-bold tracking-wider text-amber-400 block mb-2.5">
              💬 Maya Kedvenc Mondásai &amp; Szállóigéi:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-stone-300 italic">
              {backstory?.favoriteQuotesHu.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-stone-900/60 p-2.5 rounded-lg border border-stone-800/80">
                  <span className="text-amber-400 text-sm">“</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: RELICS (Maya's 4 salvaged personal artifacts) */}
      {activeSubTab === 'relics' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="bg-slate-900/90 border border-cyan-900/60 rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Car className="w-5 h-5 text-cyan-400" />
              <span>Maya Személyes Túlélő-Ereklyéi</span>
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed max-w-2xl">
              Ezeket az apró, de pótolhatatlan tárgyakat mentette ki Maya a vízálló övtáskájában a luxushajó felborulásakor.
              Minden egyes darab a múltjához, az álmaihoz és a makacs élni akarásához köti.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {backstory?.relics.map((relic) => (
              <div
                key={relic.id}
                className="bg-stone-950/90 border border-stone-800 hover:border-cyan-500/60 rounded-2xl p-4 shadow-lg transition flex items-start gap-3.5 group"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition">
                  {relic.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-100 group-hover:text-cyan-300 transition">
                    {relic.nameHu}
                  </h4>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {relic.descHu}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveSubTab('overview');
                      setChatInput(`Mesélj nekem erről: ${relic.nameHu}! Miért olyan fontos neked?`);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1 transition"
                  >
                    <span>Kérdezz erről Mayától a tábortűznél</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: OVERVIEW (Standard Survival Dashboard & Chat) */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
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
                    <span>Természetes Nyelvű Kommunikáció (Gemini AI)</span>
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">21 éves túlélőtárs</span>
                </div>

                <div className="bg-stone-950/90 border border-stone-800 rounded-lg p-3 h-48 overflow-y-auto space-y-2 mb-3 text-xs font-mono">
                  <div className="bg-emerald-950/40 border border-emerald-900/40 p-2.5 rounded text-emerald-300">
                    <strong>{comp.name}:</strong> "Hallgatlak! Kérdezz bátran a nyereményútról, a Rozsdás Villám autómról, vagy találjunk ki valami jó kis túlélési trükköt a természetfilmekből!"
                  </div>

                  {comp.memories.slice(0, 4).map((mem, idx) => (
                    <div key={idx} className="bg-stone-900/60 p-2 rounded text-stone-400 border border-stone-800/80">
                      <span className="text-stone-500 text-[10px] uppercase block">Emléknyom #{idx + 1}:</span>
                      <span>{mem}</span>
                    </div>
                  ))}
                </div>

                {/* Quick dialogue suggestions covering user requested lore */}
                <div className="flex flex-wrap gap-1.5 mb-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setChatInput('Mesélj a nyereményjátékról és a luxushajó utadról! Hogy kerültél ide?')}
                    className="bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 px-2 py-0.5 rounded border border-amber-700/60 transition"
                  >
                    "Mesélj a nyereményútról!"
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('Hogy néz ki a régi autód, a Rozsdás Villám? Miért imádod ennyire?')}
                    className="bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-200 px-2 py-0.5 rounded border border-cyan-700/60 transition"
                  >
                    "Mesélj a '89-es autódról!"
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('Egy dolog nem sétál be csak úgy a vulkáni kalderába!')}
                    className="bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 px-2 py-0.5 rounded border border-purple-700/60 transition"
                  >
                    "Végzet Hegye (Fantasy idézet)"
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('Mit tanultál a természetfilmekből, ami itt megmentheti az életünket?')}
                    className="bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/60 transition"
                  >
                    "Természetfilmes túlélőtippek?"
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatInput('Csak mi ketten menekültünk meg. Örülök, hogy nem vagyok egyedül.')}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-2 py-0.5 rounded border border-stone-700 transition"
                  >
                    "Csak mi ketten (Kötődés)"
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
                placeholder={`Beszélj ${comp.name}-val (pl. "Menj fát vágni", "Mesélj az autódról")...`}
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
      )}
    </div>
  );
};
