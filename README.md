# 🌴 Project Isle: 3D Tropical Survival & Escape Simulator

Fotorealisztikus trópusi túlélőszimulátor és interaktív 3D WebGL világ, AI túlélőtárssal (Maya Vance), bázisépítéssel, ősi romok mechanizmusaival és kettős menekülési útvonallal (óceánjáró tutaj és lezuhant DC-3 teherszállító repülőgép).

---

## 🚀 Hogyan indítsd el a gépeden (AI Studión kívül)?

A játék önállóan, bármilyen modern Windows, Mac vagy Linux számítógépen futtatható közvetlenül a böngésződben.

### 1. Előfeltétel
- **Node.js (v18 vagy újabb)**: Ha még nincs a gépeden, töltsd le az ingyenes hivatalos oldalról: [https://nodejs.org](https://nodejs.org).

### 2. Letöltés / Klónozás GitHub-ról
Nyiss meg egy terminált vagy parancssort (CMD / PowerShell), és futtasd:
```bash
git clone https://github.com/kszabix/demov2.git
cd demov2
```

### 3. Indítás Windows alatt (1 kattintással)
Egyszerűen kattints duplán a **`start-windows.bat`** fájlra!
- A script automatikusan ellenőrzi a Node.js-t.
- Automatikusan telepíti a szükséges csomagokat (`npm install`), ha még nem tetted meg.
- Elindítja a szervert és automatikusan megnyitja a böngésződet a `http://localhost:3000` címen.

### 4. Kézi indítás terminálból (Windows / Mac / Linux)
```bash
npm install
npm run dev
```
Ezután nyisd meg a böngésződben:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 📱 Hogyan nyisd meg és játszd TELEFONRÓL?

Nem kell semmit telepíteni a telefonodra!

1. Csatlakoztasd a mobilodat **ugyanarra az otthoni Wi-Fi hálózatra**, amelyen a számítógéped is van.
2. A terminál / `start-windows.bat` az indításkor azonnal kiírja a helyi hálózati címet, például:
   ```
   📱 Mobiltelefonról (Wi-Fi): http://192.168.1.150:3000
   ```
3. Írd be ezt a címet a telefonod böngészőjébe (Safari / Chrome)!
4. A játék automatikusan betöltődik az érintőképernyős **3D Virtuális D-Pad és gombok** felületével!

---

## 🎮 Irányítási Útmutató

### 💻 Windows PC / Asztali gép (Egér + Billentyűzet):
- **W, A, S, D** vagy **Nyilak**: Mozgás (előre, hátra, balra, jobbra)
- **Shift**: Futás / Sprint
- **Egér**: Körbetekintés (Kattints a képernyőre a kurzor rögzítéséhez)
- **Szóköz**: Ugrás
- **E billentyű**: Interakció / Gyűjtés (Uszadékfa rönkök felvétele a partról, beszélgetés Maya Vance-szel, bázis használata)
- **V billentyű**: Kameranézet váltása (TPS Külső nézet ↔ FPS Belső nézet)

### 📱 Mobiltelefon (Érintőképernyő):
- **Bal alsó D-Pad gombok (⬆️ ⬇️ ⬅️ ➡️)**: Valós idejű karaktermozgás
- **⚡ Sprint gomb**: Futási sebesség növelése
- **🦘 Ugrás gomb**: Karakter ugrása a dűnéken és sziklákon
- **🖐️ Gyűjtés / E gomb**: Tárgyak azonnali felvétele és interakció
- **↺ ↻ Forgás gombok**: Finom kamerafordulás balra/jobbra
- **Jobb oldali képernyő húzása**: Szabad kameraforgatás tetszőleges szögben
- **Kamera [V]**: Külső/belső nézet váltás egyetlen érintéssel

---

## 🔑 Opcionális: Gemini AI API kulcs beállítása
A játék **offline állapotban is 100%-ban játszható** (beépített determinisztikus AI válaszmotorral és SVG képgenerátorral).
Ha a valós Google Gemini 2.5 Flash modellt szeretnéd használni a társ párbeszédeihez és képgeneráláshoz:
1. Másold át a `.env.example` fájlt `.env` névre:
   ```bash
   cp .env.example .env
   ```
2. Nyisd meg a `.env` fájlt, és másold be az ingyenes [Google AI Studio API kulcsodat](https://aistudio.google.com/):
   ```
   GEMINI_API_KEY="AIzaSy..."
   ```

Jó túlélést és sikeres menekülést kívánunk a szigetről! 🌴⛵✈️
