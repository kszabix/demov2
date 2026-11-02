import React from 'react';
import { GameState } from '../game/simulation';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Sun,
  Droplets,
  Wind,
  CheckCircle,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface AncientRuinsPuzzlesProps {
  state: GameState;
  onSolveMirrorPuzzle: (angle: number) => void;
  onSolveHydraulicPuzzle: (valveA: number, valveB: number) => void;
  onSolveIncensePuzzle: (selectedHerbs: string[]) => void;
  onClaimAncientAlloy: () => void;
}

export const AncientRuinsPuzzles: React.FC<AncientRuinsPuzzlesProps> = ({
  state,
  onSolveMirrorPuzzle,
  onSolveHydraulicPuzzle,
  onSolveIncensePuzzle,
  onClaimAncientAlloy,
}) => {
  // Mirror puzzle state
  const [currentAngle, setCurrentAngle] = React.useState<number>(state.ruins.mirrorAngle || 45);

  // Hydraulic puzzle state
  const [valveA, setValveA] = React.useState<number>(state.ruins.valveA || 20);
  const [valveB, setValveB] = React.useState<number>(state.ruins.valveB || 80);

  // Incense puzzle state
  const [selectedHerbs, setSelectedHerbs] = React.useState<string[]>(state.ruins.activeHerbs || []);

  const herbsAvailable = [
    { id: 'blue_lotus', nameHu: 'Kék Lótusz (Spóra-kötő)', correct: true },
    { id: 'sulfur_leaf', nameHu: 'Kénes Páfránylevél (Gáz-semlegesítő)', correct: true },
    { id: 'mountain_sage', nameHu: 'Hegyi Zsálya (Tudattisztító)', correct: true },
    { id: 'swamp_moss', nameHu: 'Mocsári Moha (Nem hatékony)', correct: false },
    { id: 'deadly_nightshade', nameHu: 'Mérges Csucsor (Mérgező füst)', correct: false },
  ];

  const handleHerbToggle = (id: string) => {
    sound.playClick();
    if (selectedHerbs.includes(id)) {
      setSelectedHerbs(selectedHerbs.filter((h) => h !== id));
    } else {
      if (selectedHerbs.length < 3) {
        setSelectedHerbs([...selectedHerbs, id]);
      }
    }
  };

  const handleTestMirror = () => {
    sound.playClick();
    onSolveMirrorPuzzle(currentAngle);
  };

  const handleTestHydraulics = () => {
    sound.playClick();
    onSolveHydraulicPuzzle(valveA, valveB);
  };

  const handleTestIncense = () => {
    sound.playClick();
    onSolveIncensePuzzle(selectedHerbs);
  };

  const allSolved =
    state.ruins.mirrorPuzzleSolved &&
    state.ruins.hydraulicPuzzleSolved &&
    state.ruins.incensePuzzleSolved;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/90 border border-amber-900/60 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-stone-100">
              Ősi Romok &amp; Mechanikus Fejtörők (GDD 6. Fejezet)
            </h2>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
            {allSolved ? 'Minden kamra felnyitva (3/3)' : 'Katakombák Zárva'}
          </span>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed max-w-4xl">
          Egy évszázadokkal ezelőtt élt, fejlett mérnöki tudású nép kőtemplomai. A "misztikum" valójában a barlangokból feltörő pszichoaktív spórák okozta érzékcsalódás. A fejtörők megoldása nem kötelező, de kiváló minőségű <strong>Ősi Titánium Ötvözetet</strong> biztosít, ami azonnal garantálja a menekülő járművek törésmentes indítását!
        </p>
      </div>

      {/* 3 Puzzles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Puzzle 1: Light Mirror */}
        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>1. Fény- és Tükör-mechanizmus</span>
              </span>
              {state.ruins.mirrorPuzzleSolved && (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Forgasd el a bronz tükröt úgy, hogy a tetőnyíláson beáramló napfény pontosan a kristály prizmára fókuszálódjon (Cél: 135° délkeleti beesés).
            </p>

            <div className="bg-stone-950/80 p-4 rounded-lg border border-stone-800 text-center mb-4">
              <div className="text-xs text-stone-400 mb-1">Tükör dőlésszöge:</div>
              <div className="text-2xl font-mono font-bold text-amber-400 mb-2">
                {currentAngle}°
              </div>

              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={currentAngle}
                onChange={(e) => setCurrentAngle(Number(e.target.value))}
                disabled={state.ruins.mirrorPuzzleSolved}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleTestMirror}
            disabled={state.ruins.mirrorPuzzleSolved}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition ${
              state.ruins.mirrorPuzzleSolved
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 cursor-default'
                : 'bg-amber-600 hover:bg-amber-500 text-white'
            }`}
          >
            {state.ruins.mirrorPuzzleSolved ? 'Fénysugár Fókuszálva ✓' : 'Fénysugár Igazítása'}
          </button>
        </div>

        {/* Puzzle 2: Hydraulic Water Pressure */}
        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>2. Hidraulikus Zsiliprendszer</span>
              </span>
              {state.ruins.hydraulicPuzzleSolved && (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Az elárasztott alsó kripta lecsapolásához szabályozd a két beömlő szelep nyomását (Cél: A = 60 bar, B = 40 bar egyensúly).
            </p>

            <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800 space-y-3 mb-4 text-xs">
              <div>
                <div className="flex justify-between text-stone-400 mb-1">
                  <span>A-Szelep Nyomás:</span>
                  <span className="font-mono text-cyan-400 font-bold">{valveA} bar</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={valveA}
                  onChange={(e) => setValveA(Number(e.target.value))}
                  disabled={state.ruins.hydraulicPuzzleSolved}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-stone-400 mb-1">
                  <span>B-Szelep Nyomás:</span>
                  <span className="font-mono text-cyan-400 font-bold">{valveB} bar</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={valveB}
                  onChange={(e) => setValveB(Number(e.target.value))}
                  disabled={state.ruins.hydraulicPuzzleSolved}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleTestHydraulics}
            disabled={state.ruins.hydraulicPuzzleSolved}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition ${
              state.ruins.hydraulicPuzzleSolved
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 cursor-default'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {state.ruins.hydraulicPuzzleSolved ? 'Víz Elvezetve ✓' : 'Zsilip Kiegyenlítése'}
          </button>
        </div>

        {/* Puzzle 3: Incense Herbal Spore Neutralizer */}
        <div className="bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-stone-100 flex items-center gap-2">
                <Wind className="w-4 h-4 text-purple-400" />
                <span>3. Pszichoaktív Spóra Füstölő</span>
              </span>
              {state.ruins.incensePuzzleSolved && (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <p className="text-xs text-stone-400 mb-4 leading-relaxed">
              Válaszd ki a 3 megfelelő szárított gyógynövényt a bronz füstölőbe, hogy semlegesítsd a hallucinációkat kiváltó gázokat.
            </p>

            <div className="space-y-1.5 mb-4">
              {herbsAvailable.map((herb) => {
                const selected = selectedHerbs.includes(herb.id);
                return (
                  <button
                    key={herb.id}
                    onClick={() => handleHerbToggle(herb.id)}
                    disabled={state.ruins.incensePuzzleSolved}
                    className={`w-full text-left p-2 rounded text-xs border transition flex items-center justify-between ${
                      selected
                        ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <span>{herb.nameHu}</span>
                    <span className="text-[10px] font-mono">{selected ? 'Kiválasztva' : '+'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleTestIncense}
            disabled={state.ruins.incensePuzzleSolved || selectedHerbs.length !== 3}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition ${
              state.ruins.incensePuzzleSolved
                ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 cursor-default'
                : 'bg-purple-600 hover:bg-purple-500 text-white disabled:bg-stone-800 disabled:text-stone-500'
            }`}
          >
            {state.ruins.incensePuzzleSolved ? 'Spórák Semlegesítve ✓' : 'Füstölő Meggyújtása (3 fű)'}
          </button>
        </div>
      </div>

      {/* Secret Vault Reward Section */}
      {allSolved && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500 rounded-xl p-6 text-center shadow-2xl animate-in fade-in">
          <Award className="w-12 h-12 text-amber-400 mx-auto mb-2 animate-bounce" />
          <h3 className="text-xl font-bold text-amber-200 uppercase tracking-wide mb-1">
            Az Ősi Rejtett Titánium Kripta Feltárult!
          </h3>
          <p className="text-xs text-stone-300 max-w-xl mx-auto mb-4">
            A mechanizmusok kinyitották a sziklába vájt páncéltermet. Itt található a repülőgép-építéshez és tengerálló hajóhoz szükséges legkiválóbb anyag:
          </p>

          {!state.ruins.ancientAlloyCollected ? (
            <button
              onClick={() => {
                sound.playCraftSuccess();
                onClaimAncientAlloy();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition shadow-lg inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ősi Titánium Ötvözet &amp; Giroszkóp Begyűjtése (+3x Titánium)</span>
            </button>
          ) : (
            <div className="text-xs text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-700 max-w-sm mx-auto py-2 rounded">
              ✓ Az ötvözet a készletedben van. Használd fel a menekülő járműhöz!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
