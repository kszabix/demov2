export interface CraftingRecipe {
  id: string;
  name: string;
  nameHu: string;
  category: 'tool' | 'medicine' | 'survival' | 'base' | 'vehicle';
  tier: 1 | 2 | 3 | 4;
  descriptionHu: string;
  cost: Record<string, number>;
  outputItem?: { id: string; count: number };
  baseUpgrade?: string;
  vehicleUpgrade?: { type: 'raft' | 'airplane'; phase: number; points: number };
}

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // Tier 1 - Organic & Survival
  {
    id: 'crude_spear',
    name: 'Crude Bamboo Spear',
    nameHu: 'Bambusz lándzsa',
    category: 'tool',
    tier: 1,
    descriptionHu: 'Alapvető vadász- és önvédelmi fegyver a dzsungelben.',
    cost: { driftwood: 2, flint_shard: 1, vine_rope: 1 },
    outputItem: { id: 'crude_spear', count: 1 },
  },
  {
    id: 'herbal_bandage',
    name: 'Herbal Bandage',
    nameHu: 'Gyógynövényes kötés',
    category: 'medicine',
    tier: 1,
    descriptionHu: 'Elállítja a vérzést és megelőzi a nyílt sebek elfertőződését.',
    cost: { palm_leaves: 2, medicinal_herb: 2 },
    outputItem: { id: 'herbal_bandage', count: 1 },
  },
  {
    id: 'splint',
    name: 'Wooden Splint',
    nameHu: 'Favázas sín',
    category: 'medicine',
    tier: 1,
    descriptionHu: 'Rögzíti a törött végtagot (csonttörés gyógyítása).',
    cost: { driftwood: 3, vine_rope: 2 },
    outputItem: { id: 'splint', count: 1 },
  },
  {
    id: 'clean_water',
    name: 'Purified Water',
    nameHu: 'Forralt tiszta víz',
    category: 'survival',
    tier: 1,
    descriptionHu: 'Forralással csíramentesített tiszta ivóvíz.',
    cost: { fresh_water_flask: 1, driftwood: 1 },
    outputItem: { id: 'clean_water', count: 1 },
  },
  {
    id: 'roasted_coconut',
    name: 'Roasted Coconut & Crab',
    nameHu: 'Sült kókusz és tengeri rák',
    category: 'survival',
    tier: 1,
    descriptionHu: 'Tápláló, fehérjedús meleg étel a tábortűznél.',
    cost: { coconut: 2, driftwood: 1 },
    outputItem: { id: 'roasted_meal', count: 1 },
  },

  // Tier 2 - Stone, Clay & Furnace
  {
    id: 'stone_axe',
    name: 'Flint Stone Axe',
    nameHu: 'Pattintott kőbalta',
    category: 'tool',
    tier: 2,
    descriptionHu: 'Gyorsabb favágást tesz lehetővé vastag rönkökhöz és felszállópályához.',
    cost: { driftwood: 4, flint_shard: 3, vine_rope: 2 },
    outputItem: { id: 'stone_axe', count: 1 },
  },
  {
    id: 'fever_tea',
    name: 'Quinine Orchid Tea',
    nameHu: 'Mocsári malária elleni tea',
    category: 'medicine',
    tier: 2,
    descriptionHu: 'Csillapítja a trópusi lázat és meggyógyítja a maláriát.',
    cost: { medicinal_herb: 3, clean_water: 1 },
    outputItem: { id: 'fever_tea', count: 1 },
  },
  {
    id: 'clay_furnace',
    name: 'Clay Furnace',
    nameHu: 'Agyagkemence',
    category: 'base',
    tier: 2,
    descriptionHu: 'Magas hőmérsékletű égetőmű agyagtéglákhoz és fémérc olvasztásához.',
    cost: { river_clay: 6, basalt_stone: 4, driftwood: 5 },
    baseUpgrade: 'clayFurnaceBuilt',
  },
  {
    id: 'stilt_upgrade_2',
    name: 'Reinforced Timber Stilt Foundation',
    nameHu: 'Megerősített gerenda cölöpalap',
    category: 'base',
    tier: 2,
    descriptionHu: 'Védelem a trópusi árapály és monszuneső áradásai ellen.',
    cost: { driftwood: 10, vine_rope: 6, basalt_stone: 4 },
    baseUpgrade: 'stiltFoundation_2',
  },

  // Tier 3 - Iron, Forge & Distillery
  {
    id: 'iron_forge',
    name: 'Iron Anvil & Forge',
    nameHu: 'Vaskohó és üllő',
    category: 'base',
    tier: 3,
    descriptionHu: 'Fémlemezek, szegek és precíziós szerszámok kovácsolása.',
    cost: { iron_ore: 8, sulfur: 3, basalt_stone: 6 },
    baseUpgrade: 'ironForgeBuilt',
  },
  {
    id: 'fuel_still',
    name: 'Bio-Ethanol Distillery',
    nameHu: 'Bio-etanol lepárló torony',
    category: 'base',
    tier: 3,
    descriptionHu: 'Magas oktánszámú bio-üzemanyag desztillálása erjesztett gyümölcsből.',
    cost: { scrap_metal: 5, river_clay: 4, iron_ore: 4 },
    baseUpgrade: 'fuelDistilleryBuilt',
  },
  {
    id: 'metal_machete',
    name: 'Forged Scrap Machete',
    nameHu: 'Kovácsolt bozótvágó',
    category: 'tool',
    tier: 3,
    descriptionHu: 'Elengedhetetlen a dzsungel sűrűjének és a kifutópálya fáinak irtásához.',
    cost: { scrap_metal: 3, driftwood: 2, vine_rope: 1 },
    outputItem: { id: 'metal_machete', count: 1 },
  },

  // Escape Route Upgrades
  {
    id: 'raft_p1_logs',
    name: 'Assemble Raft Keel & Barrels',
    nameHu: 'Tutaj váz és hordók összeszerelése',
    category: 'vehicle',
    tier: 1,
    descriptionHu: 'Kéttörzsű tutaj gerendaváz és partra vetődött üres fémhordók rögzítése.',
    cost: { driftwood: 8, vine_rope: 4, scrap_metal: 2 },
    vehicleUpgrade: { type: 'raft', phase: 1, points: 25 },
  },
  {
    id: 'raft_p2_pitch',
    name: 'Waterproof Resin Sealing',
    nameHu: 'Vízzáró fenyőgyanta és tömítés',
    category: 'vehicle',
    tier: 2,
    descriptionHu: 'A rések kitöltése forró szurokkal a tengeri elsüllyedés ellen.',
    cost: { medicinal_herb: 4, driftwood: 4, river_clay: 3 },
    vehicleUpgrade: { type: 'raft', phase: 2, points: 25 },
  },
  {
    id: 'raft_p3_canvas_sail',
    name: 'Woven Sail & Steering Rudder',
    nameHu: 'Szövött vitorla és kormánylapát',
    category: 'vehicle',
    tier: 2,
    descriptionHu: 'Irányítható vitorla készítése erős indákból és szőtt vászonból.',
    cost: { palm_leaves: 12, vine_rope: 6, driftwood: 6 },
    vehicleUpgrade: { type: 'raft', phase: 3, points: 25 },
  },
  {
    id: 'raft_p4_nav_supplies',
    name: 'Compass & Ocean Rations',
    nameHu: 'Tájoló és tengeri túlélő készlet',
    category: 'vehicle',
    tier: 3,
    descriptionHu: 'Mágneses iránytű, 40 liter ivóvíz és 30 napra elegendő száraz élelem.',
    cost: { clean_water: 5, roasted_meal: 5, scrap_metal: 2 },
    vehicleUpgrade: { type: 'raft', phase: 4, points: 25 },
  },

  // Airplane Upgrades
  {
    id: 'plane_p1_clear_runway',
    name: 'Clear Jungle Runway',
    nameHu: 'Felszállópálya irtása és szintezése',
    category: 'vehicle',
    tier: 2,
    descriptionHu: 'A lezuhant gép előtti fák kivágása és a sziklák elsimítása.',
    cost: { driftwood: 10, flint_shard: 4 },
    vehicleUpgrade: { type: 'airplane', phase: 1, points: 25 },
  },
  {
    id: 'plane_p2_patch_wings',
    name: 'Aircraft Aluminum Riveting',
    nameHu: 'Szárnyak és törzs foltozása',
    category: 'vehicle',
    tier: 3,
    descriptionHu: 'A sérült sárkányszerkezet megerősítése repülőgép-alumíniummal és szegekkel.',
    cost: { scrap_metal: 8, iron_ore: 6, basalt_stone: 4 },
    vehicleUpgrade: { type: 'airplane', phase: 2, points: 25 },
  },
  {
    id: 'plane_p3_biofuel_engine',
    name: 'Bio-Ethanol Fuel & Engine Overhaul',
    nameHu: 'Bio-etanol üzemanyag és motorfelújítás',
    category: 'vehicle',
    tier: 3,
    descriptionHu: 'Gyújtógyertyák megtisztítása és 60L bio-etanol üzemanyag betöltése.',
    cost: { coconut: 8, clean_water: 4, scrap_metal: 4 },
    vehicleUpgrade: { type: 'airplane', phase: 3, points: 25 },
  },
  {
    id: 'plane_p4_trim_balance',
    name: 'Avionics, Trim & Weight Balance',
    nameHu: 'Súlypont beállítása és magassági kormány',
    category: 'vehicle',
    tier: 4,
    descriptionHu: 'A gép tehermentesítése a szirtnél való átesés megelőzésére.',
    cost: { vine_rope: 6, scrap_metal: 4 },
    vehicleUpgrade: { type: 'airplane', phase: 4, points: 25 },
  },
];

export interface ZoneData {
  id: string;
  nameHu: string;
  nameEn: string;
  ratio: string;
  descriptionHu: string;
  resources: Array<{ id: string; nameHu: string; chance: number; amount: [number, number] }>;
  hazards: string[];
  ambientSound: string;
}

export const ISLAND_ZONES: Record<string, ZoneData> = {
  coast: {
    id: 'coast',
    nameHu: '1. Partvidék & Sekély Zátonyok (0m – +15m | -30m mélység)',
    nameEn: 'Coastline & Coral Reefs (0m - 15m, -30m depth)',
    ratio: '20%',
    descriptionHu: 'A 10 km²-es szigetet körbeölelő homokos tengerpartok, dűnék, pálmaligetek és a sekély korallzátony, amely hirtelen szakad le a -30 méter mély óceáni árokba.',
    resources: [
      { id: 'driftwood', nameHu: 'Uszadékfa', chance: 0.9, amount: [2, 5] },
      { id: 'coconut', nameHu: 'Kókuszdió', chance: 0.7, amount: [1, 3] },
      { id: 'palm_leaves', nameHu: 'Pálmalevél', chance: 0.85, amount: [2, 4] },
      { id: 'scrap_metal', nameHu: 'Roncsfém', chance: 0.45, amount: [1, 2] },
    ],
    hazards: ['Mélyvízi cáparajok (-30m-es zónában)', 'Kiszáradás a tűző trópusi napon', 'Árapály vízszintemelkedés'],
    ambientSound: 'ocean_waves',
  },
  rainforest: {
    id: 'rainforest',
    nameHu: '2. Sűrű Trópusi Esőerdő (+25m – +150m)',
    nameEn: 'Dense Tropical Rainforest (+25m - +150m)',
    ratio: '35%',
    descriptionHu: 'A sziget nyugati és középső részét borító hatalmas őserdő, kanyargó hegyi folyóval és a dombháton lezuhant teherszállító repülőgép roncsával.',
    resources: [
      { id: 'driftwood', nameHu: 'Keményfa törzsek', chance: 0.85, amount: [3, 6] },
      { id: 'vine_rope', nameHu: 'Erős lián', chance: 0.8, amount: [2, 5] },
      { id: 'medicinal_herb', nameHu: 'Gyógynövények', chance: 0.65, amount: [1, 3] },
      { id: 'fresh_water_flask', nameHu: 'Friss patakvíz', chance: 0.7, amount: [2, 3] },
    ],
    hazards: ['Vadkanok és mérges kígyók', 'Hirtelen lezúduló monszun viharok', 'Tájékozódási nehézség a sűrűben'],
    ambientSound: 'jungle_birds',
  },
  swamp: {
    id: 'swamp',
    nameHu: '3. Mocsárvidék & Iszapmező (+2m – +25m)',
    nameEn: 'Swamp & Mudflats (+2m - +25m)',
    ratio: '15%',
    descriptionHu: 'Délkeleti iszapos mélyföld, mangrove mocsár, állandó ködpára és meleg kénes források. Kiváló fazekas agyag- és kininlelőhely.',
    resources: [
      { id: 'river_clay', nameHu: 'Folyami agyag', chance: 0.8, amount: [2, 5] },
      { id: 'medicinal_herb', nameHu: 'Kinin orchidea (malária ellen)', chance: 0.7, amount: [2, 4] },
      { id: 'basalt_stone', nameHu: 'Mocsári kő', chance: 0.5, amount: [1, 3] },
    ],
    hazards: ['Sós vízi krokodilok', 'Maláriát terjesztő szúnyograjok', 'Mérgező spórafelhők'],
    ambientSound: 'swamp_croak',
  },
  volcano: {
    id: 'volcano',
    nameHu: '4. Kihűlt Vulkán & Csúcs (+200m – +850m)',
    nameEn: 'Extinct Volcano & Summit Peak (+200m - +850m)',
    ratio: '15%',
    descriptionHu: 'Meredek bazaltszirt, fémérc erek és a sziget legmagasabb pontja (+850m). A kráterperemen kilátó és rádióállomás található, ahonnan a teljes 10 km²-es sziget belátható.',
    resources: [
      { id: 'iron_ore', nameHu: 'Vasérc', chance: 0.75, amount: [2, 4] },
      { id: 'sulfur', nameHu: 'Kénkristályok', chance: 0.6, amount: [1, 3] },
      { id: 'flint_shard', nameHu: 'Tűzkő és bazalt', chance: 0.85, amount: [2, 4] },
      { id: 'basalt_stone', nameHu: 'Bazaltkő', chance: 0.8, amount: [2, 5] },
    ],
    hazards: ['Zuhanásveszély a függőleges sziklafalaknál', 'Kihűlés (alacsony hegyi éjszakai hőmérséklet)', 'Kénes kigőzölgések'],
    ambientSound: 'mountain_wind',
  },
  ruins: {
    id: 'ruins',
    nameHu: '5. Ősi Romok & Templomhegy (+160m – +340m)',
    nameEn: 'Ancient Ruins & Temple Mountain (+160m - +340m)',
    ratio: '15%',
    descriptionHu: 'Északkeleti teraszos kőplató indákkal benőtt monolitkapuval, rejtélyes obeliszkekkel, víznyomásos zsilipekkel és titánötvözet puzzle mechanizmusokkal.',
    resources: [
      { id: 'ancient_alloy', nameHu: 'Ősi titánium ötvözet', chance: 0.4, amount: [1, 2] },
      { id: 'scrap_metal', nameHu: 'Precíziós fémalkatrészek', chance: 0.7, amount: [2, 4] },
      { id: 'flint_shard', nameHu: 'Csiszolt prizma kristály', chance: 0.5, amount: [1, 2] },
    ],
    hazards: ['Pszichoaktív barlangi gázok / hallucinációk alacsony Sanity esetén', 'Rejtett kőcsapdák', 'Szűk, omlásveszélyes folyosók'],
    ambientSound: 'ruins_echo',
  },
};
