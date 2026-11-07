# Game Design Document: Trópusi Sziget Építési Rendszer

## 1. Összefoglaló és Építési Logika

A játék építési rendszere egy moduláris, rács- és csatolási pont alapú (**grid & snapping**) túlélő-bázisépítő mechanika. A rendszer célja, hogy a trópusi szigeten tartózkodó játékos számára menedéket, komfortot és az időjárási viszontagságok elleni védelmet biztosítson a megmenekülésig/kijutásig.

### Rács- és Dimenziórendszer
* **Alapvető modulméret:** $2 \times 2\text{ m}$ alapterület, $2\text{ m}$ falmagasság, $1\text{ m}$ alapmagasság.
* **Falvastagság:** $20\text{--}30\text{ cm}$.
* **Alap (Foundation) elhelyezése:** 
  * Szabadon süllyeszthető vagy kiemelhető a terepviszonyokhoz mérten az első elem lehelyezésekor.
  * A következő alapok automatikusan rátapadnak (snap) a meglévő alapok oldalaihoz.

---

## 2. Építőanyag Szintek (Tier-Rendszer)

A rendszer 3 egymásra épülő anyagszintet tartalmaz. A fém tier tudatosan kikerült a koncepcióból, illeszkedve a trópusi sziget szituációjához.

```
[1. Szalma (Thatch)] ──► [2. Fa (Wood)] ──► [3. Kő (Stone)]
```

| Anyagszint (Tier) | Jellemzők & Szerep | Elérhető Elemek |
| :--- | :--- | :--- |
| **1. Szalma (Thatch)** | Kezdő menedék. Gyorsan felhúzható, alapvető árnyékot ad, de a viharok károsíthatják és hőszigetelése gyenge. | Alap, Falak, Ajtó/Ablak keretek és betétek, Födém, Ferde tetők, Oromfalak. |
| **2. Fa (Wood)** | A bázisépítés gerince. Szerkezetileg stabil, viharálló, megnyitja a vertikális közlekedést. | Minden Szalma elem + Alaplépcső (1m), Emeleti lépcső (2m). |
| **3. Kő (Stone)** | A legmagasabb szintű, időjárásálló trópusi erődítmény. Kiváló védelem hurrikán ellen. | Minden Fa elem + Csapóajtós födém (Hatchframe), Csigalépcső, Létra, Tetőablak frame. |

---

## 3. Moduláris Építőelemek és Nyílászárók

### A. Alapok és Födémek
* **Alap (Foundation):** $2 \times 2 \times 1\text{ m}$. Zárja a terepet, 100%-os stabilitási pontot biztosít.
* **Födém / Mennyezet (Ceiling):** $2 \times 2\text{ m}$-es vékony lap. 
  * *Alap feletti lefedés:* Ha alatta alap fut (akár egy $10 \times 10$-es területen), köztes tartóoszlopok nélkül is lefedhető a tér.
  * *Konzolos kinyúlás:* Alap szélétől max. 1 egységet ($2\text{ m}$) nyúlhat ki a levegőbe.
* **Csapóajtós Födém (Hatchframe - Kő Tier):** $2 \times 2\text{ m}$-es födém $100 \times 100\text{ cm}$-es belső kivágással, amelybe külön legyártható felnyitható csapóajtó illeszthető.

### B. Falak és Moduláris Nyílászárók
A falak lehelyezés előtt választató variációi ($2 \times 2\text{ m}$ külső dimenzió):

```
+-----------------+   +-----------------+   +-----------------+
|                 |   |     +-----+     |   |    +-------+    |
|                 |   |     |     |     |   |    |120x120|    |
|    Sima Fal     |   |     |100x |     |   |    +-------+    |
|     (Wall)      |   |     | 190 |     |   | Ablakkeret      |
|                 |   |     |     |     |   | (Windowframe)   |
+-----------------+   +-----+-----+-----+   +-----------------+
                        Ajtókeret (Doorframe)
```

* **Sima Fal:** Tömör lezárás.
* **Ajtókeret:** $100 \times 190\text{ cm}$-es középső kivágás $\to$ Befogadja a külön gyártott ajtó modult.
* **Ablakkeret:** $120 \times 120\text{ cm}$-es középső kivágás $\to$ Befogadja a külön gyártott ablak modult.

### C. Tetőelemek és Oromfalak
* **Ferde Tető (Sloped Roof):** $2 \times 2\text{ m}$-es alapterületű, $45^\circ$-os lejtésű lap ($2\text{ m}$ magasságkülönbség az élek között).
* **Oromfalak (Gables):** Háromszög alakú záróelemek a ferde tetők oldalsó lezárásához (Balos, Jobbos és Nyereg-oromfal).
* **Tetőgerinc (Ridge Cap):** Szembeállított ferde tetők csatlakozási élét takaró profil.

### D. Közlekedő Elemek (Stairs & Vertical)
* **Alaplépcső / Rámpa (1m):** Szintáthidalás a terep és az alap, vagy eltérő alapmagasságok között.
* **Emeleti Lépcső (2m):** Szintáthidalás a földszint és az emeleti födém között. Felette nyitott födémegység szükséges a szabad áthaladáshoz.
* **Csigalépcső / Létra:** $1 \times 1\text{ m}$-es alapterületű, vertikális elem, amely közvetlenül a Hatchframe alá rögzíthető.

---

## 4. Stabilitás és Terhelési Rendszer (Structural Integrity)

A rendszer megelőzi a lebegő építmények létrejöttét és meghatározza az összeomlás logikáját.

### Stabilitási Pontok (SI: 0% – 100%)
1. **Alap (Foundation):** $100\%$ stabilitást ad (horgony).
2. **Vertikális Terjedés (Falak):** Minden egymásra épített fal egységenként **-10%** stabilitást veszít.
3. **Horizontális Terjedés (Konzolok):** 
   * Alapon álló fal oldalára **1 kinyúló elem** tehető (alap nélkül).
   * A **2. kinyúló elemnél** az SI értéke $0\%$-ra esne, ezért a rendszer **lebegő állapotként észleli és megtiltja a lerakást**.

### Rombolási Láncreakció (Cascading Collapse)
Ha egy alsó tartóelem (alap vagy fal) megsemmisül, a rendszer azonnal újraszámolja a ráépülő elemek stabilitási útvonalát. Ha egy elem nem talál érvényes útvonalat egy $100\%$-os alap felé, azonnal **összeomlik**, ami dominóeffektusszerű láncreakciót indít el.

---

## 5. Fal-Kiegészítések (Szigetelés & Színezés)

A játékos felületkezelő eszközzel (pl. simító/ecset) kiegészítő rétegeket vihet fel az építőelemekre.

```
[ KÜLSŐ FELÜLET ]  ──►  [ ALAP FALKERET ]  ──►  [ BELSŐ FELÜLET ]
(Szigetelés / Máz)      (Szalma / Fa / Kő)     (Dekor / Színezés)
```

* **Külső Szigetelő Réteg (Insulation Layer):**
  * *Szalma/Fa:* Agyag-, sár- vagy pálmalevél-tapasztás.
  * *Kő:* Mész- vagy agyagvakolat.
  * *Funkció:* Megtartja a belső hőmérsékletet és növeli az elem ellenállását a viharokkal szemben.
* **Külső & Belső Színezés (Stain/Paint):** Természetes pigmentekből kikevert festék a bázis egyedi esztétikai megjelenítéséhez.

---

## 6. Időjárás, Hőmérséklet és Komfort Mechanika

A mikromanagelt korrózió/korhadás helyett az időjárás a **játékos komfortjára és a szélsőséges viharokra** hat.

### Zárt Tér és Klíma Szabályok
* **Szél- és Esővédelem:** Ha az épület teljesen zárt (Falak + Födém + Beillesztett Ajtó/Ablak), a belső nedvesség $0\%$-ra csökken (megelőzi az "Ázott" debuffot).
* **Hőszabályozás (Trópusi klíma):**
  * **Nappali hőség ($38^\circ\text{C}$):** A szigetelt bázis árnyékos belső tere $24\text{--}26^\circ\text{C}$-os hőmérsékletet tart fenn, megelőzve a kiszáradást és a napszúrást.
  * **Éjszakai vihar ($15^\circ\text{C}$):** A zárt épületben lévő fáklya/kályha melege bent marad a szigetelésnek köszönhetően.
* **Trópusi Hurrikán Mechanika:**
  * A nem szigetelt Szalma elemeket a trópusi vihar lebonthatja.
  * A Fa és Kő elemek teljesen viharállók, így nincs szükség folyamatos javítási mikromanagementre.