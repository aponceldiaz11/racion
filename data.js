/* Ración — datos: base local de alimentos + IndexedDB. Sin dependencias. */

// [nombre, kcal100, prot100, fib100, ración_g, unidad, ...alias]
const SEED_FOODS = [
  ['huevo entero', 143, 12.6, 0, 55, 'huevo', 'huevo', 'huevos'],
  ['clara de huevo', 52, 10.9, 0, 100, 'clara', 'claras', 'clara de huevo'],
  ['pechuga de pollo', 165, 31, 0, 150, 'ración', 'pollo', 'pechuga', 'pollo a la plancha'],
  ['muslo de pollo', 209, 26, 0, 120, 'ración', 'muslo', 'pollo'],
  ['fiambre de pavo', 100, 18, 0, 40, 'loncha', 'pavo', 'pavo fiambre'],
  ['ternera magra', 187, 26, 0, 120, 'ración', 'ternera', 'carne'],
  ['lomo de cerdo', 143, 21, 0, 120, 'ración', 'cerdo', 'lomo'],
  ['merluza', 90, 17, 0, 150, 'ración', 'pescado', 'merluza'],
  ['salmón', 208, 20, 0, 120, 'ración', 'salmón', 'salmon'],
  ['atún al natural', 116, 26, 0, 60, 'lata', 'atun', 'atún', 'atun natural'],
  ['atún en aceite', 190, 25, 0, 60, 'lata', 'atun aceite'],
  ['gambas', 99, 24, 0, 100, 'ración', 'gambas', 'langostinos'],
  ['yogur griego 0%', 57, 10, 0, 125, 'yogur', 'griego', 'yogur griego', 'griego 0'],
  ['yogur natural', 61, 3.5, 0, 125, 'yogur', 'yogur', 'yogures'],
  ['yogur griego azucarado', 129, 6, 0, 125, 'yogur', 'griego azucarado'],
  ['skyr', 60, 11, 0, 150, 'yogur', 'skyr'],
  ['leche semidesnatada', 46, 3.2, 0, 200, 'vaso', 'leche'],
  ['leche desnatada', 34, 3.4, 0, 200, 'vaso', 'leche desnatada'],
  ['queso batido 0%', 47, 7.5, 0, 50, 'cucharada', 'queso batido', 'queso fresco batido'],
  ['queso fresco', 98, 7, 0, 60, 'ración', 'queso', 'queso fresco'],
  ['arroz blanco cocido', 130, 2.7, 0.4, 100, 'ración', 'arroz'],
  ['arroz integral cocido', 123, 2.6, 1.8, 100, 'ración', 'arroz integral'],
  ['pasta cocida', 158, 5.8, 1.8, 100, 'ración', 'pasta', 'macarrones', 'espaguetis'],
  ['pan integral', 230, 9, 6, 30, 'rebanada', 'pan', 'pan integral'],
  ['pan blanco', 265, 8, 2.5, 30, 'rebanada', 'pan blanco'],
  ['tostada integral', 380, 12, 7, 8, 'tostada', 'tostada', 'tostadas', 'biscote'],
  ['avena', 380, 13, 10, 40, 'ración', 'avena', 'copos de avena'],
  ['maíz dulce', 86, 3.2, 2.7, 80, 'ración', 'maiz'],
  ['patata cocida', 87, 2, 2, 150, 'ración', 'patata', 'patatas'],
  ['boniato', 86, 1.6, 3, 150, 'ración', 'boniato', 'batata'],
  ['lentejas cocidas', 116, 9, 8, 150, 'plato', 'lentejas'],
  ['garbanzos cocidos', 164, 9, 8, 150, 'plato', 'garbanzos'],
  ['alubias cocidas', 127, 8.6, 6, 150, 'plato', 'alubias', 'judías blancas'],
  ['quinoa cocida', 120, 4.4, 2.8, 120, 'ración', 'quinoa'],
  ['tomate', 18, 0.9, 1.2, 120, 'unidad', 'tomate', 'tomates'],
  ['tomate cherry', 18, 0.9, 1.2, 100, 'ración', 'cherry', 'tomates cherry'],
  ['lechuga', 15, 1.4, 1.3, 80, 'ración', 'lechuga'],
  ['espinacas', 23, 2.9, 2.2, 100, 'ración', 'espinacas'],
  ['brócoli', 34, 2.8, 2.6, 150, 'ración', 'brocoli', 'brócoli'],
  ['coliflor', 25, 1.9, 2, 150, 'ración', 'coliflor'],
  ['calabacín', 17, 1.2, 1, 150, 'ración', 'calabacin', 'calabacín'],
  ['berenjena', 25, 1, 3, 150, 'ración', 'berenjena'],
  ['pepino', 15, 0.7, 0.5, 100, 'ración', 'pepino'],
  ['pimiento', 31, 1, 2.1, 100, 'ración', 'pimiento', 'pimientos'],
  ['zanahoria', 41, 0.9, 2.8, 100, 'unidad', 'zanahoria', 'zanahorias'],
  ['cebolla', 40, 1.1, 1.7, 80, 'unidad', 'cebolla'],
  ['champiñones', 22, 3.1, 1, 100, 'ración', 'champiñones', 'champinones'],
  ['judías verdes', 31, 1.8, 2.7, 150, 'ración', 'judias verdes'],
  ['alcachofa', 47, 3.3, 5.4, 120, 'unidad', 'alcachofa', 'alcachofas'],
  ['espárragos', 20, 2.2, 2, 100, 'ración', 'esparragos'],
  ['ensalada mixta', 30, 1.2, 1.5, 200, 'plato', 'ensalada', 'ensalada grande', 'ensalada mixta'],
  ['aguacate', 160, 2, 6.7, 50, 'medio', 'aguacate'],
  ['aceite de oliva', 884, 0, 0, 10, 'cucharada', 'aceite', 'aove'],
  ['almendras', 579, 21, 12.5, 20, 'puñado', 'almendras', 'frutos secos'],
  ['nueces', 654, 15, 6.7, 20, 'puñado', 'nueces'],
  ['crema de cacahuete', 588, 25, 6, 15, 'cucharada', 'cacahuete', 'crema de cacahuete'],
  ['manzana', 52, 0.3, 2.4, 180, 'manzana', 'manzana', 'manzanas'],
  ['plátano', 89, 1.1, 2.6, 120, 'plátano', 'platano', 'plátanos', 'banana'],
  ['naranja', 47, 0.9, 2.4, 180, 'naranja', 'naranja', 'naranjas'],
  ['fresas', 32, 0.7, 2, 150, 'ración', 'fresas', 'fresa'],
  ['arándanos', 57, 0.7, 2.4, 100, 'ración', 'arandanos'],
  ['kiwi', 61, 1.1, 3, 90, 'kiwi', 'kiwi', 'kivis'],
  ['pera', 57, 0.4, 3.1, 170, 'pera', 'pera', 'peras'],
  ['sandía', 30, 0.6, 0.4, 250, 'ración', 'sandia'],
  ['melón', 34, 0.8, 0.9, 250, 'ración', 'melon'],
  ['piña', 50, 0.5, 1.4, 150, 'ración', 'piña'],
  ['uvas', 69, 0.7, 0.9, 120, 'ración', 'uvas'],
  ['café con leche', 20, 1.2, 0, 200, 'taza', 'cafe con leche', 'café', 'cafe'],
  ['café solo', 2, 0.1, 0, 50, 'taza', 'cafe solo', 'espresso'],
  ['infusión', 1, 0, 0, 200, 'taza', 'infusion', 'te', 'té'],
  ['cacao 0%', 350, 20, 33, 10, 'cucharada', 'cacao', 'colacao 0'],
  ['miel', 304, 0.3, 0, 10, 'cucharada', 'miel'],
  ['azúcar', 400, 0, 0, 5, 'cucharada', 'azucar'],
  ['tortitas de maíz', 385, 8, 3, 10, 'tortita', 'tortitas', 'tortitas de maiz'],
  ['kétchup', 100, 1.3, 0.3, 15, 'cucharada', 'ketchup', 'kétchup'],
  ['mayonesa', 700, 1, 0, 15, 'cucharada', 'mayonesa'],
  ['chocolate negro 85%', 592, 10, 11, 10, 'onza', 'chocolate', 'chocolate negro'],
  ['galletas', 480, 7, 3, 25, 'ración', 'galletas', 'galleta'],
  ['croissant', 406, 8, 2, 60, 'unidad', 'croissant', 'cruasan'],
  ['pizza', 266, 11, 2, 200, 'ración', 'pizza'],
  ['hamburguesa', 250, 15, 1, 180, 'unidad', 'hamburguesa', 'burger'],
  ['tortilla de patatas', 190, 7, 1.5, 150, 'ración', 'tortilla de patatas', 'tortilla'],
  ['paella', 156, 7, 1, 300, 'plato', 'paella'],
  ['gazpacho', 40, 1, 1, 250, 'vaso', 'gazpacho'],
  ['sopa de verduras', 30, 1.5, 1.5, 300, 'plato', 'sopa', 'sopa de verduras'],
  ['crema de calabacín', 45, 1.5, 1.2, 300, 'plato', 'crema', 'crema de calabacin'],
  ['hummus', 166, 8, 6, 50, 'ración', 'hummus'],
  ['guacamole', 155, 2, 6, 50, 'ración', 'guacamole'],
  ['kefir', 45, 3.5, 0, 200, 'vaso', 'kefir'],
  ['requesón', 98, 11, 0, 100, 'ración', 'requeson'],
  ['tofu', 76, 8, 1, 150, 'ración', 'tofu'],
  ['tempeh', 192, 20, 6, 100, 'ración', 'tempeh'],
  ['seitán', 120, 25, 0, 100, 'ración', 'seitan'],
  ['proteína whey', 380, 78, 0, 30, 'cazo', 'whey', 'proteina', 'batido de proteina'],
  ['batido de leche y cacao', 60, 4, 0.5, 300, 'vaso', 'batido', 'batido de cacao'],
  ['cerveza', 43, 0.5, 0, 330, 'caña', 'cerveza', 'birra'],
  ['vino', 83, 0.1, 0, 150, 'copa', 'vino'],
  ['refresco zero', 0.3, 0, 0, 330, 'lata', 'refresco', 'coca cola zero', 'zero'],
  ['agua', 0, 0, 0, 250, 'vaso', 'agua']
];

const DB_NAME = 'racion';
const DB_VER = 1;
let _db = null;

function dbOpen() {
  if (_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('profiles')) db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('items')) {
        const s = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
        s.createIndex('name', 'name');
        s.createIndex('barcode', 'barcode');
      }
      if (!db.objectStoreNames.contains('platos')) db.createObjectStore('platos', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('log')) {
        const s = db.createObjectStore('log', { keyPath: 'id', autoIncrement: true });
        s.createIndex('pid', 'pid');
        s.createIndex('ts', 'ts');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'k' });
    };
    req.onsuccess = e => { _db = e.target.result; res(_db); };
    req.onerror = () => rej(req.error);
  });
}

function tx(store, mode = 'readonly') {
  return dbOpen().then(db => db.transaction(store, mode).objectStore(store));
}

const db = {
  async all(store) {
    const s = await tx(store);
    return new Promise((res, rej) => { const r = s.getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); });
  },
  async get(store, key) {
    const s = await tx(store);
    return new Promise((res, rej) => { const r = s.get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  },
  async put(store, val) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => { const r = s.put(val); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  },
  async del(store, key) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => { const r = s.delete(key); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
  },
  async clear(store) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => { const r = s.clear(); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
  },
  async meta(k, v) {
    if (v === undefined) { const r = await this.get('meta', k); return r ? r.v : null; }
    await this.put('meta', { k, v }); return v;
  }
};

/* ---------- utilidades de texto ---------- */
const norm = s => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9%\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Busca el mejor alimento de una lista por solapamiento de tokens (con stemming simple).
const stem = w => (w.length > 4 ? w.replace(/(es|s)$/, '') : w);
const tokens = s => norm(s).split(' ').filter(Boolean).map(stem);

function matchFood(query, items) {
  const qTok = tokens(query);
  if (!qTok.length) return null;
  const qStr = ' ' + qTok.join(' ') + ' ';
  let best = null, bestScore = 0;
  for (const it of items) {
    const names = [it.name, ...(it.aliases || [])];
    for (const n of names) {
      const nTok = tokens(n);
      if (!nTok.length) continue;
      const sig = nTok.filter(t => t.length >= 3);
      let score = 0, hits = 0;
      for (const t of sig) {
        if (qTok.includes(t)) { score += 2; hits++; }
        else if (qStr.includes(t)) { score += 1; hits++; }
      }
      if (!hits) continue;
      const coverage = hits / sig.length;
      score = (score + coverage * 3) / Math.sqrt(nTok.length + 1);
      if (score > bestScore) { bestScore = score; best = it; }
    }
  }
  return bestScore >= 1.2 ? { item: best, score: bestScore } : null;
}
