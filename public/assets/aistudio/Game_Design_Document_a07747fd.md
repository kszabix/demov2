# 📄 GAME DESIGN DOCUMENT (GDD)
**Projekt Munkacím:** Project Isle  
**Engine:** Unreal Engine 5 (Nanite, Lumen, Chaos Physics)  
**Célplattform:** PC / Konzol  
**Műfaj:** Fotorealisztikus, sandbox, nyílt világú túlélőjáték (Survival Craft)  
**Kameranézet:** Hibrid (TPS alapértelmezett, FPS célozáskor és precíziós feladatoknál)  

---

## 1. Általános Koncepció és Áttekintés

A *Project Isle* egy fotorealisztikus, természetközeli túlélőjáték, amely egy modern óceánjáró katasztrófája után játszódik. A főhős egyedüli túlélőként ér partra egy trópusi, vulkanikus szigeten. A játék a puszta túlélésről, a környezet felfedezéséről, a bázisépítésről, valamint a szigetről való kijutásról szól.

### Fő Tervezési Pillérek:
1. **Fotorealizmus és Természetközeli Élmény:** A környezet, az időjárás, a fauna és a fizikai kölcsönhatások nyersek, reálisak és megbocsátást nem ismerőek.
2. **Két Eltérő Menekülési Útvonal:** Sandboxing és fokozatos építkezés útján a játékos dönthet úgy, hogy egy tengerálló tutajt/hajót épít, vagy helyreállít egy lezuhant repülőgépet.
3. **Dinamikus AI NPC Társ Rendszer:** Fejlett, LLM-alapú AI társak önálló akarattal, emlékezettel, mély pszichológiai skálával, rabszolgasor-lehetőséggel, vagy akár romantikus kapcsolattal.
4. **Irányított Térkép és Láthatatlan Falak Hiánya:** A játékost nem mesterséges falak, hanem természetes ragadozók (cápák, áramlatok) tartják a sziget közelében.
5. **Kíméletlen Permadeath a Társaknál:** Nincs kézfogás vagy UI figyelmeztetés. Ha a társ meghal, az végleges, és az emberi odafigyelés hiányát bünteti.

---

## 2. Világépítés és Térkép (10–20 km²)

A sziget területe kb. 10–20 km², ami gyalogosan bejárva jelentős méretű, de nem válik kihalttá vagy üressé. A térkép 60-70%-a bejárható, gyorsutazás és hátasok nélkül.

### Topográfia és Zónabeosztás:

| Zóna Neve | Területi Arány | Domborzat & Bióm | Egyedi Erőforrások & Veszélyek |
| :--- | :--- | :--- | :--- |
| **1. Partvidék & Sekély Vizek** | 20% | Homokos tengerpartok, sziklás öblök, zátonyok. | Kókusz, kagylók, partra sodródott roncsok, rákok. *Veszély:* Cápák a mélyebb részeken, kiszáradás. |
| **2. Trópusi Esőerdő (Középső zóna)** | 35% | Sűrű dzsungel, hatalmas fák, kisebb patakok, tiszta vizű vízesések. | Puha- és keményfa, indák, gyógynövények, bogyók, édesvíz. *Veszély:* Vadkanok, mérges kígyók, monszun. |
| **3. Mocsárvidék (Délkelet / Mélyföld)** | 15% | Iszapos, állóvizes terület, sűrű gyökérzet, állandó köd és párásság. | Ritka gyógynövények, speciális agyag, tőzeg. *Veszély:* Krokodilok, mérgező gázok, fertőzött sebek, malária/láz. |
| **4. Kihűlt Vulkán & Magaslat (Észak)** | 15% | Sziklás, meredek emelkedők, vulkáni kráter, barlangrendszerek. | Basalt, fémércek, ritka ásványok, kén. *Veszély:* Zuhanásveszély, szélsőséges hőmérséklet-ingadozás, ragadozó madarak. |
| **5. Ősi Romok (Rejtett Belső Zónák)** | 10% | Dzsungel által benőtt kőtemplomok, földalatti katakombák. | Ötvözetek, ősi eszközök, fejtörő-összetevők. *Veszély:* Csapdák, szűkös tér, pszichológiai feszültség/misztikum. |
| **6. Nem Bejárható / Sziklafalak** | 5-10% | Függőleges szirtfalak, omlásveszélyes kanyonok. | Természetes határként szolgálnak a zónák között. |

### Nyílt Víz és Vízalatti Részek Korlátozása:
* A játékos kizárólag a part közelében (kb. 50–100 méteres sávban) halászhat vagy haladhat kistutajjal.
* Nyílt víz felé kanyarodva az erős tengeráramlatok visszasodorják a tutajt, vagy a mélyvízi ragadozó rajok (cápák) pillanatok alatt elpusztítják a járművet és a játékost.

---

## 3. Túlélési, Harci és Kraftolási Mechanikák

### A) Fizikai és Mentális Egészség
* **Fizikai mutatók:** Éhség, Szomjúság, Hőmérséklet (hősokk / kihűlés), Sérülések (csonttörés, nyílt sebek), Betegségek (fertőzések, láz, malária).
* **Mentális állapota (Sanity / Morál):** A tartós egyedüllét, sötétség és szorongás rontja a teljesítményt és hallucinációkat vált ki. A bázis kényelme és az NPC társakkal való pozitív interakció regenerálja.

### B) Nyersanyag Hierarchia
* **Tier 1 (Organikus):** Bambusz, pálmalevél, indák, puhafa, kagyló. (Menedék, gyenge kötelek, tüzek).
* **Tier 2 (Kő & Agyag):** Flint, bazalt, folyami agyag, keményfa. (Masszív falak, kemence, tartós szerszámok).
* **Tier 3 (Fém & Ötvözet):** Vasérc, kén, roncsfémek. (Megerősített szerkezetek, szegek, fém szerszámok, járműalkatrészek).
* **Tier 4 (Különleges):** Ősi ötvözetek, kompozit műanyagok, repülőgép-alumínium. (Végleges járművek, speciális eszközök).

### C) Moduláris Bázisépítés (Structural Stability)
* **Cölöpös Alapozás (Stilt Foundation):** Kötelező a tengerparton és a mocsárban az árapály és víz elöntése ellen.
* **Fizikai terhelhetőség:** Súly- és statikai ellenőrzés (UE5 Chaos physics). A trópusi viharok megrongálhatják a gyenge szerkezeteket.

---

## 4. AI-Vezérelt NPC Társ Rendszer

Az NPC-k nem statikus szkriptek, hanem LLM-alapú (Large Language Model) intelligenciával rendelkező karakterek.

### Architektúra:
1. **Személyiség & Memória:** Egyedi háttértörténet, fóbiák, képességek. Vektoros memóriatár (emlékezik a játékos jó és rossz tetteire).
2. **Dinamikus Utasítás-kinyerés (Function Calling):** A játékos szabad szöveggel/hanggal beszélhet hozzá. Az LLM kinyeri a szándékot (pl. *"hozz fát és gyújts tüzet"*), és elküldi az UE5 Behavior Tree-nek.
3. **Limit:** Maximum 2–3 aktív túlélő a szigeten a számítási kapacitás és a magány-érzet megőrzése érdekében. Az első megtalált túlélő a főhős ellentétes nemű társa.

### Kapcsolati Skála és Intimitás:
```
[ 1. Ellenséges ] ──▶ [ 2. Kizsákmányolt ] ──▶ [ 3. Semleges ] ──▶ [ 4. Együttműködő ] ──▶ [ 5. Hűséges Társ ] ──▶ [ 6. ROMANTIKUS TÁRS ]
```
* **Kizsákmányolás/Szolgasor:** Ha a játékos rosszul bánik az NPC-vel, az éjszaka meglophatja a tábort és elszökhet, külön tábort verve a szigeten.
* **Romantikus Státusz:** Mély odafigyeléssel és kommunikációval érhető el. Filmes, Cyberpunk 2077 stílusú átvezető jeleneteket vált ki (csók, ölelés, intimitás), és maximális hűséget, valamint Sanity-regenerációt biztosít.

### Permanens Halál (Permadeath) és Az "Emberi Odafigyelés" Teszt:
* **Nincs UI figyelmeztetés:** A játékosnak a társ reakcióiból (nyögés, sántítás, viselkedés) kell észrevennie a bajt.
* **Végleges halál:** Ha a társ meghal, végleg eltűnik a játékból.
* **Új túlélő:** Napokkal/hetekkel később egy új túlélő érkezhet a szigetre, teljesen új személyiséggel, nullázott kapcsolati skálával és memóriával.

---

## 5. Menekülési Útvonalak és A Bukási Ciklus

### A) 1. Útvonal: Nyílt Tengeri Tutaj / Hajó
* **Építési fázisok:** 1. Váz & Felhajtóerő (rönkök/hordók) ➔ 2. Szerkezeti merevítés & Vízzáró gyantázás ➔ 3. Vitorlázat & Kormánymű ➔ 4. Navigáció & Élelem-készletek.
* **Katasztrófa okok:** Gyenge kötelek (szétesik a hullámokban), szigetelés hiánya (elsüllyed), kevés élelem/víz/kompassz hiánya (céltalan sodródás).

### B) 2. Útvonal: Lezuhant Repülőgép Helyreállítása
* **Építési fázisok:** 1. Felszállópálya irtása és elsimítása a dzsungelben ➔ 2. Sárkányszerkezet és szárnyak foltozása alumíniummal ➔ 3. Motor alkatrészek & Bio-üzemanyag lepárlás ➔ 4. Súlycsökkentés és egyensúlyozás.
* **Katasztrófa okok:** Rövid/egyenetlen pálya (fáknak csapódás), rossz súlypont/túlnehezedés (átesés a sziklaszirtnél), nem megfelelő oktánszámú üzemanyag (motorleállás a tenger felett).

### C) A Bukás Utáni Újraindulási (Rogue-lite) Ciklus
1. A játékos az elhamarkodott indítás utáni **katasztrófa-animációt** követően a kezdő tengerparton ébred (sérülten).
2. **A Bázis, a tárolt tárgyak és a térkép MEGMARADNAK.**
3. **A Jármű megsemmisül:** Újra kell építeni a nulláról vagy jelentősen javítani kell.
4. **Az NPC Társak morálja és bizalma lezuhan** a katasztrófa átélése miatt.

---

## 6. Ősi Romok és Misztikum

* **A Lore:** Egy évszázadokkal ezelőtt élt, fejlett mérnöki tudással rendelkező nép maradványai. Bukásukat a sziget barlangjaiból kibocsátott pszichoaktív spórák/gázok okozták.
* **A "Misztikum" Alapja:** Nem varázslat, hanem gázok és spórák okozta hallucinációk, amelyek alacsony Sanity esetén fenyegető árnyakká válnak.
* **Fejtörők:** Fény- és tükör-mechanizmusok, hidraulikus víznyomás-rendszerek, növényi füstölős gáz-semlegesítések.
* **Előny a játékban:** Nem kötelező, de kiváló minőségű ősi ötvözeteket, öntőmintákat és repülési/hajózási alkatrészeket biztosít, amik drasztikusan csökkentik a menekülés kockázatát.
```

eof