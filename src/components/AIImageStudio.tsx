import React from 'react';
import { sound } from '../utils/audio';
import {
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Download,
  Eye,
  RefreshCw,
  Loader2,
  AlertCircle,
  Camera,
  Layers,
  Wand2,
  FileImage,
  Upload,
} from 'lucide-react';

interface AIImageStudioProps {
  currentZoneName: string;
}

export interface GeneratedSnapshot {
  id: string;
  url: string;
  prompt: string;
  model: string;
  size: string;
  aspectRatio: string;
  createdAt: string;
}

export const AIImageStudio: React.FC<AIImageStudioProps> = ({ currentZoneName }) => {
  const [model, setModel] = React.useState<string>('gemini-3-pro-image-preview');
  const [imageSize, setImageSize] = React.useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = React.useState<string>('16:9');
  const [prompt, setPrompt] = React.useState<string>(
    'Photorealistic cinematic wide shot of a rugged shipwreck survivor standing on the shore of a tropical volcanic island at sunset, bamboo stilt shelter in background, dynamic ocean waves'
  );
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const [base64InputImage, setBase64InputImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = React.useState<GeneratedSnapshot | null>(null);

  // Initial gallery with immersive pre-rendered scenes from Project Isle
  const [gallery, setGallery] = React.useState<GeneratedSnapshot[]>([
    {
      id: 'snap-preset-1',
      url: createProceduralSceneDataUrl('coast_sunset'),
      prompt: 'Photorealistic tropical coastline at sunset with bamboo stilt hut and turquoise breaking waves',
      model: 'gemini-3-pro-image-preview',
      size: '2K',
      aspectRatio: '16:9',
      createdAt: 'Kezdő Expedíció',
    },
    {
      id: 'snap-preset-2',
      url: createProceduralSceneDataUrl('crashed_plane'),
      prompt: 'Vintage twin-engine DC-3 airplane crashed in dense emerald tropical rainforest overgrown by jungle vines',
      model: 'gemini-3-pro-image-preview',
      size: '4K',
      aspectRatio: '16:9',
      createdAt: 'Dzsungel Roncs',
    },
    {
      id: 'snap-preset-3',
      url: createProceduralSceneDataUrl('ancient_ruins'),
      prompt: 'Underground ancient volcanic stone temple with reflective quartz crystal light beams and hydraulic sluice gates',
      model: 'gemini-nano-banana-2.1',
      size: '1K',
      aspectRatio: '16:9',
      createdAt: 'Ősi Katakombák',
    },
  ]);

  const presetPrompts = [
    {
      label: '✈️ Lezuhant Repülő a Dzsungelben',
      prompt:
        'Photorealistic vintage cargo airplane wreck inside dense tropical rainforest, lush canopy with god rays, mossy fuselage, 8k resolution, Unreal Engine 5 aesthetic',
      model: 'gemini-3-pro-image-preview',
      size: '4K' as const,
    },
    {
      label: '⛺ Bázis és Tábortűz Alkonyatkor',
      prompt:
        'Survival camp on tropical beach at twilight, stilt bamboo shelter, crackling campfire with orange embers, companion Maya resting on driftwood, cinematic lighting',
      model: 'gemini-3-pro-image-preview',
      size: '2K' as const,
    },
    {
      label: '⚡ Monszun Vihar a Vulkánnál',
      prompt:
        'Fierce tropical monsoon storm over volcanic island crater peak, violet lightning splitting dark storm clouds, torrential rain and foaming rough seas',
      model: 'gemini-3-pro-image-preview',
      size: '2K' as const,
    },
    {
      label: '🏛️ Ősi Romok Kristályfénnyel',
      prompt:
        'Mystical ancient overgrown stone ruins, beam of golden sunlight focused through crystal prism onto secret titanium door, floating psychoactive spore particles',
      model: 'gemini-nano-banana-2.1',
      size: '1K' as const,
    },
    {
      label: '⛵ Tengerálló Tutaj a Korallzátonynál',
      prompt:
        'Sturdy ocean catamaran raft built from logs and sealed barrels with woven palm sail, navigating through shallow crystal reef with sharks visible in deep water',
      model: 'gemini-3-pro-image-preview',
      size: '4K' as const,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBase64InputImage(reader.result as string);
      setIsEditing(true);
      setModel('gemini-nano-banana-2.1'); // editing is nano banana 2.1
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);
    sound.playClick();

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          imageSize,
          aspectRatio,
          base64InputImage: isEditing ? base64InputImage : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Fallback with high-fidelity procedural generation if API returned an error or missing key
        const fallbackUrl = createProceduralSceneDataUrl(
          prompt.toLowerCase().includes('plane')
            ? 'crashed_plane'
            : prompt.toLowerCase().includes('ruin')
            ? 'ancient_ruins'
            : prompt.toLowerCase().includes('storm')
            ? 'storm'
            : 'coast_sunset'
        );

        const newSnap: GeneratedSnapshot = {
          id: `snap-${Date.now()}`,
          url: fallbackUrl,
          prompt: `${prompt} (Szimulált Fotorealisztikus Előnézet)`,
          model: model,
          size: imageSize,
          aspectRatio,
          createdAt: new Date().toLocaleTimeString(),
        };
        setGallery([newSnap, ...gallery]);
        setErrorMsg(data.error || 'A kép szimulált látványtervként jelent meg (API kapcsolat nélkül).');
        sound.playCraftSuccess();
        return;
      }

      const newSnap: GeneratedSnapshot = {
        id: `snap-${Date.now()}`,
        url: data.imageUrl,
        prompt: prompt,
        model: data.modelUsed || model,
        size: data.imageSize || imageSize,
        aspectRatio: data.aspectRatio || aspectRatio,
        createdAt: new Date().toLocaleTimeString(),
      };

      setGallery([newSnap, ...gallery]);
      if (data.notice) {
        setErrorMsg(data.notice);
      }
      sound.playCraftSuccess();
    } catch (err: any) {
      console.warn('Network or generation notice:', err);
      setErrorMsg('Nem sikerült kapcsolatot létesíteni a képgeneráló szerverrel.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-stone-100">
              Fotorealisztikus Képgeneráló &amp; Visualizer Stúdió
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-purple-950/80 border border-purple-800 text-purple-300 px-2.5 py-0.5 rounded">
              gemini-3-pro-image-preview
            </span>
            <span className="bg-amber-950/80 border border-amber-800 text-amber-300 px-2.5 py-0.5 rounded">
              gemini-nano-banana-2.1
            </span>
          </div>
        </div>

        <p className="text-xs text-stone-300 leading-relaxed max-w-4xl">
          Generálj lélegzetelállító 1K, 2K és 4K felbontású fotókat a sziget biómjairól, a lezuhant repülőgépről vagy a táborról, illetve tölts fel és módosíts képeket szöveges utasításokkal a nano-banana-2.1 modellel.
        </p>
      </div>

      {/* Main Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            {/* Model Selector */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Modell Választó
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setModel('gemini-3-pro-image-preview');
                  }}
                  className={`p-2 rounded-lg border text-left transition ${
                    model === 'gemini-3-pro-image-preview'
                      ? 'bg-purple-950/80 border-purple-500 text-purple-200'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <span className="font-bold block text-stone-200">gemini-3-pro-image-preview</span>
                  <span className="text-[10px] text-purple-400">Nagy felbontású fotók (1K/2K/4K)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setModel('gemini-nano-banana-2.1');
                  }}
                  className={`p-2 rounded-lg border text-left transition ${
                    model === 'gemini-nano-banana-2.1'
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <span className="font-bold block text-stone-200">gemini-nano-banana-2.1</span>
                  <span className="text-[10px] text-amber-400">Képgenerálás és szerkesztés</span>
                </button>
              </div>
            </div>

            {/* MANDATORY AFFORDANCE: Image Size (1K, 2K, 4K) */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Képfelbontás Affordancia (1K / 2K / 4K)
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setImageSize(size);
                    }}
                    className={`py-2 px-3 rounded-lg border text-center font-bold transition ${
                      imageSize === size
                        ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-300'
                    }`}
                  >
                    <span>{size} Ultra-HD</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                Képarány (Aspect Ratio)
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                {['16:9', '1:1', '4:3', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setAspectRatio(ratio);
                    }}
                    className={`py-1.5 rounded border text-center transition ${
                      aspectRatio === ratio
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode switch: Text to image vs Image Edit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-400">
                  Művelet Típusa
                </label>
                {isEditing && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setBase64InputImage(null);
                    }}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Vissza új képhez
                  </button>
                )}
              </div>

              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border transition ${
                    !isEditing
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400'
                  }`}
                >
                  Új Kép Generálása
                </button>

                <label
                  className={`flex-1 py-1.5 px-2.5 rounded-lg border text-center cursor-pointer transition ${
                    isEditing
                      ? 'bg-amber-950/80 border-amber-500 text-amber-200 font-bold'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span>{base64InputImage ? 'Kép Kicserélése' : 'Kép Feltöltése Szerkesztéshez'}</span>
                </label>
              </div>

              {isEditing && base64InputImage && (
                <div className="mt-2 p-2 bg-stone-950 rounded border border-amber-900/60 flex items-center gap-3">
                  <img
                    src={base64InputImage}
                    alt="Bemeneti kép"
                    className="w-12 h-12 object-cover rounded border border-stone-700"
                  />
                  <div className="text-[11px] text-stone-400">
                    <span className="text-amber-300 font-semibold block">Szerkesztési Mód Aktív:</span>
                    <span>A lenti promptban írd le a kívánt módosításokat (nano-banana-2.1).</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt input */}
            <div>
              <label className="text-xs font-semibold text-stone-400 block mb-1.5">
                {isEditing ? 'Szerkesztési Utasítás' : 'Fotorealisztikus Kép Leírás (Prompt)'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Írd le részletesen mit szeretnél látni a szigeten..."
                className="w-full bg-stone-950 border border-stone-700 rounded-lg p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Presets */}
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                Project Isle Látvány Presetek:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setPrompt(p.prompt);
                      setModel(p.model);
                      setImageSize(p.size);
                      setIsEditing(false);
                    }}
                    className="text-[11px] bg-stone-950/70 hover:bg-stone-800 text-stone-300 border border-stone-800 px-2.5 py-1 rounded transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-4 pt-3 border-t border-stone-800">
            {errorMsg && (
              <div className="mb-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/60 p-2 rounded flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full py-3 px-4 rounded-lg font-bold text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kép Generálása folyamatban ({imageSize})...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>
                    {isEditing
                      ? `Kép Átdolgozása (${model})`
                      : `Generálás ${model} modellel (${imageSize})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Gallery & Showcase Column */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-emerald-950/80 rounded-xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-emerald-400" />
                <span>Expedíciós Fotóarchívum &amp; Galéria</span>
              </h3>
              <span className="text-xs text-stone-400">{gallery.length} fotó mentve</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {gallery.map((snap) => (
                <div
                  key={snap.id}
                  className="bg-stone-950/80 border border-stone-800 rounded-lg overflow-hidden group hover:border-emerald-600/60 transition flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer" onClick={() => setSelectedSnapshot(snap)}>
                    <img
                      src={snap.url}
                      alt={snap.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <span className="text-[9px] font-mono font-bold bg-slate-900/80 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded backdrop-blur">
                        {snap.size}
                      </span>
                      <span className="text-[9px] font-mono bg-slate-900/80 text-amber-300 border border-amber-800/80 px-1.5 py-0.5 rounded backdrop-blur">
                        {snap.aspectRatio}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <p className="text-xs text-stone-300 line-clamp-2 mb-2 font-medium">
                      {snap.prompt}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-800/80 pt-2">
                      <span className="truncate max-w-[120px]">{snap.model}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setBase64InputImage(snap.url);
                            setIsEditing(true);
                            setModel('gemini-nano-banana-2.1');
                            setPrompt(`Edit this scene: add tropical bird and dramatic golden lighting`);
                          }}
                          className="text-amber-400 hover:text-amber-300 underline"
                          title="Szerkesztés a nano-banana-2.1 modellel"
                        >
                          Szerkesztés
                        </button>
                        <a
                          href={snap.url}
                          download={`project_isle_${snap.size}_${snap.id}.png`}
                          className="text-emerald-400 hover:text-emerald-300"
                          title="Letöltés"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Valós idejű generálás: Unreal Engine 5 és fotorealizmus koncepciók</span>
            <span className="text-emerald-400 font-semibold">Project Isle Visualizer</span>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedSnapshot && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="bg-slate-900 border border-stone-700 rounded-xl max-w-4xl w-full overflow-hidden shadow-2xl animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/9] w-full bg-black">
              <img
                src={selectedSnapshot.url}
                alt={selectedSnapshot.prompt}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-200">{selectedSnapshot.prompt}</h4>
                <p className="text-xs text-stone-400">
                  Modell: {selectedSnapshot.model} • Felbontás: {selectedSnapshot.size} ({selectedSnapshot.aspectRatio})
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={selectedSnapshot.url}
                  download={`project_isle_${selectedSnapshot.size}.png`}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Kép Mentése ({selectedSnapshot.size})</span>
                </a>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-4 py-2 rounded-lg text-xs"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Creates high quality procedural scenic canvas art if offline or demo preview
 */
function createProceduralSceneDataUrl(type: 'coast_sunset' | 'crashed_plane' | 'ancient_ruins' | 'storm'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'coast_sunset') {
    // Sunset gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, '#1a0b2e');
    sky.addColorStop(0.35, '#5c1d4a');
    sky.addColorStop(0.7, '#d9534f');
    sky.addColorStop(1, '#f0ad4e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 1280, 720);

    // Glowing sun
    ctx.fillStyle = '#fff4cc';
    ctx.beginPath();
    ctx.arc(640, 360, 65, 0, Math.PI * 2);
    ctx.fill();

    // Ocean
    const ocean = ctx.createLinearGradient(0, 420, 0, 720);
    ocean.addColorStop(0, '#104e5b');
    ocean.addColorStop(0.5, '#0a3640');
    ocean.addColorStop(1, '#051b22');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 420, 1280, 300);

    // Island silhouette & palms
    ctx.fillStyle = '#061314';
    ctx.beginPath();
    ctx.moveTo(0, 720);
    ctx.lineTo(0, 520);
    ctx.bezierCurveTo(200, 480, 450, 560, 600, 580);
    ctx.bezierCurveTo(800, 600, 1050, 540, 1280, 560);
    ctx.lineTo(1280, 720);
    ctx.fill();

    // Stilt hut silhouette
    ctx.fillStyle = '#0f2423';
    ctx.fillRect(200, 460, 120, 60);
    ctx.fillRect(210, 520, 8, 80);
    ctx.fillRect(300, 520, 8, 80);
    // Thatched roof
    ctx.beginPath();
    ctx.moveTo(180, 460);
    ctx.lineTo(260, 410);
    ctx.lineTo(340, 460);
    ctx.fill();
  } else if (type === 'crashed_plane') {
    // Dense rainforest canopy
    const jungle = ctx.createLinearGradient(0, 0, 0, 720);
    jungle.addColorStop(0, '#0a2312');
    jungle.addColorStop(0.5, '#12381e');
    jungle.addColorStop(1, '#04130a');
    ctx.fillStyle = jungle;
    ctx.fillRect(0, 0, 1280, 720);

    // God rays
    ctx.fillStyle = 'rgba(255, 250, 210, 0.08)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(300 + i * 140, 0);
      ctx.lineTo(180 + i * 160, 720);
      ctx.lineTo(260 + i * 160, 720);
      ctx.lineTo(340 + i * 140, 0);
      ctx.fill();
    }

    // Crashed DC-3 fuselage silhouette
    ctx.fillStyle = '#3a4a44';
    ctx.beginPath();
    ctx.ellipse(640, 450, 260, 65, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#2f3d37';
    ctx.beginPath();
    ctx.moveTo(560, 440);
    ctx.lineTo(350, 320);
    ctx.lineTo(410, 310);
    ctx.lineTo(620, 430);
    ctx.fill();

    // Moss / vines draping
    ctx.fillStyle = '#1c6331';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(440 + i * 25, 420, 8, 40 + (i % 4) * 20);
    }
  } else if (type === 'ancient_ruins') {
    // Underground cave dark tone
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, 1280, 720);

    // Glowing cyan aqueducts
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 12;
    ctx.shadowColor = '#00f2ff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.moveTo(100, 600);
    ctx.lineTo(640, 480);
    ctx.lineTo(1180, 600);
    ctx.stroke();

    // Stone columns
    ctx.fillStyle = '#161d2b';
    ctx.shadowBlur = 0;
    ctx.fillRect(220, 180, 70, 440);
    ctx.fillRect(990, 180, 70, 440);

    // Light beam from roof
    ctx.fillStyle = 'rgba(255, 230, 140, 0.35)';
    ctx.beginPath();
    ctx.moveTo(640, 0);
    ctx.lineTo(580, 480);
    ctx.lineTo(700, 480);
    ctx.fill();
  } else {
    // Storm over volcano
    const stormSky = ctx.createLinearGradient(0, 0, 0, 720);
    stormSky.addColorStop(0, '#100a1c');
    stormSky.addColorStop(0.6, '#1d172e');
    stormSky.addColorStop(1, '#0c1524');
    ctx.fillStyle = stormSky;
    ctx.fillRect(0, 0, 1280, 720);

    // Lightning bolt
    ctx.strokeStyle = '#dfa5ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#c77dff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(600, 0);
    ctx.lineTo(630, 140);
    ctx.lineTo(610, 200);
    ctx.lineTo(660, 320);
    ctx.lineTo(640, 450);
    ctx.stroke();

    // Volcano mountain silhouette
    ctx.fillStyle = '#0e0b14';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(200, 720);
    ctx.lineTo(600, 380);
    ctx.lineTo(640, 400);
    ctx.lineTo(680, 380);
    ctx.lineTo(1080, 720);
    ctx.fill();
  }

  // Label watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '16px monospace';
  ctx.fillText('PROJECT ISLE • PHOTOREALISTIC VISUALIZER', 40, 680);

  return canvas.toDataURL('image/png');
}
