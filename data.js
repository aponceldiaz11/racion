/* Ración — datos: base local de alimentos + IndexedDB. Sin dependencias. */

// [nombre, kcal100, prot100, fib100, ración_g, unidad, ...alias]
const SEED_FOODS = [
  ['huevo entero', 143, 12.6, 0, 55, 'huevo', 'huevo', 'huevos'],
  ['clara de huevo', 52, 10.9, 0, 100, 'clara', 'claras', 'clara de huevo'],
  ['pechuga de pollo', 165, 31, 0, 150, 'ración', 'pollo', 'pechuga', 'pollo a la plancha'],
  ['muslo de pollo', 209, 26, 0, 120, 'ración', 'muslo', 'pollo'],
  ['fiambre de pavo', 100, 18, 0, 40, 'loncha', 'pavo', 'pavo fiambre'],
  ['jamón serrano', 241, 31, 0, 22, 'loncha', 'jamon', 'jamón', 'jamon serrano'],
  ['jamón cocido', 107, 18, 0, 25, 'loncha', 'jamon cocido', 'jamon york', 'jamon dulce'],
  ['jamón ibérico', 375, 25, 0, 22, 'loncha', 'iberico', 'jamon iberico'],
  ['chorizo', 455, 24, 0, 20, 'loncha', 'chorizo'],
  ['salchichón', 400, 22, 0, 20, 'loncha', 'salchichon'],
  ['queso curado', 400, 26, 0, 30, 'loncha', 'queso curado', 'manchego'],
  ['queso semicurado', 350, 23, 0, 30, 'porción', 'queso semicurado', 'gouda', 'emmental'],
  ['queso azul', 350, 21, 0, 30, 'porción', 'queso azul', 'roquefort', 'cabrales', 'azul'],
  ['queso rallado', 380, 25, 0, 20, 'cucharada', 'queso rallado', 'rallado'],
  ['queso de untar', 250, 6, 0, 15, 'cucharada', 'queso untar', 'filadelfia'],
  ['queso light', 180, 22, 0, 20, 'loncha', 'queso light', 'queso desnatado', 'queso 0'],
  ['tortilla de trigo', 300, 8, 2, 60, 'unidad', 'tortilla de trigo', 'wrap', 'fajita', 'tortilla de maiz'],
  ['burrito', 220, 12, 3, 200, 'unidad', 'burrito', 'burritos'],
  ['mantequilla', 717, 0.9, 0, 10, 'porción', 'mantequilla'],
  ['mermelada', 250, 0.4, 1, 20, 'cucharada', 'mermelada', 'confitura'],
  ['cereales de desayuno', 380, 8, 4, 40, 'ración', 'cereales', 'corn flakes', 'muesli', 'granola'],
  ['pan de molde', 265, 9, 2.5, 28, 'rebanada', 'pan de molde', 'pan bimbo'],
  ['tortilla francesa', 190, 12, 0, 120, 'ración', 'tortilla francesa'],
  ['leche entera', 61, 3.2, 0, 200, 'vaso', 'leche entera'],
  ['zumo de naranja', 45, 0.7, 0.2, 200, 'vaso', 'zumo', 'zumo de naranja'],
  ['magdalenas', 450, 6, 1, 30, 'unidad', 'magdalena', 'magdalenas', 'bizcocho'],
  ['aceitunas', 145, 1, 3, 30, 'ración', 'aceitunas', 'olivas'],
  ['tomate frito', 80, 1.5, 1, 30, 'cucharada', 'tomate frito'],
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
  ['tostada integral', 265, 9, 6, 30, 'rebanada', 'tostada', 'tostadas', 'pan tostado'],
  ['biscote', 380, 12, 7, 8, 'biscote', 'biscotes'],
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
  ['aguacate', 160, 2, 6.7, 150, 'unidad', 'aguacate'],
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

/* Palabras que no identifican el alimento: cantidad, unidad, cocina o relleno.
   Se excluyen al medir si un alimento de la base "cubre" lo que ha escrito el usuario. */
const NO_KEYWORDS = new Set([
  'loncha', 'lonchas', 'rebanada', 'rebanadas', 'cucharada', 'cucharadas', 'cuchara',
  'vaso', 'vasos', 'taza', 'tazas', 'lata', 'latas', 'punado', 'punados', 'racion',
  'raciones', 'plato', 'platos', 'unidad', 'unidades', 'gr', 'gramo', 'gramos', 'kg',
  'ml', 'porcion', 'porciones', 'cazo', 'cazos',
  'plancha', 'horno', 'asado', 'asada', 'frito', 'frita', 'cocido', 'cocida', 'hervido',
  'revuelto', 'revueltos', 'natural', 'crudo', 'casero', 'pack',
  // números y artículos: no identifican el alimento
  'un', 'una', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho',
  'nueve', 'diez', 'once', 'doce', 'medio', 'media', 'par', 'docena'
]);

const qKeywords = qTok => {
  const ks = qTok.filter(t => t.length >= 3 && !NO_KEYWORDS.has(t));
  return ks.length ? ks : qTok.filter(t => t.length >= 3);
};

function matchFood(query, items) {
  const qTok = tokens(query);
  if (!qTok.length) return null;
  const qStr = ' ' + qTok.join(' ') + ' ';
  const qKey = qKeywords(qTok);          // lo que de verdad define el alimento
  let best = null, bestScore = 0, bestItemToks = null;
  for (const it of items) {
    const names = [it.name, ...(it.aliases || [])];
    const itemToks = new Set(names.flatMap(n => tokens(n)));
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
      // si el nombre completo del alimento aparece tal cual en el texto, es ESE
      // (evita que un alias genérico como "pan" gane a "pan de molde")
      if (n === it.name && qStr.includes(' ' + nTok.join(' ') + ' ')) score += 4;
      if (score > bestScore) { bestScore = score; best = it; bestItemToks = itemToks; }
    }
  }
  if (bestScore < 1.2 || !best) return null;
  // Rechazo por especificidad: si el usuario dijo más cosas de las que el alimento
  // explica ("queso light" vs "queso fresco", "tortilla de trigo" vs "de patatas"),
  // el parecido es una trampa y es mejor estimarlo que colar otro alimento.
  if (qKey.length >= 2) {
    const covered = qKey.filter(t => bestItemToks.has(t)).length / qKey.length;
    if (covered < 0.6) return null;
  }
  return { item: best, score: bestScore };
}

/* ---------- estimador: nunca decir "no sé" ----------
   Cuando un alimento no está en la base, se infiere por categoría con valores
   medios de composición y una ración típica. Devuelve `est: true` para que la UI
   lo marque como estimado (y el usuario pueda corregir gramos, que se aprende).
   El orden importa: lo más específico primero. */
const EST_RULES = [
  [/jamon (serrano|iberico)|iberico/, 'jamón serrano', 250, 30, 0, 22, 'loncha'],
  [/jamon (cocido|york|dulce)/, 'jamón cocido', 107, 18, 0, 25, 'loncha'],
  [/jamon/, 'jamón', 160, 25, 0, 25, 'loncha'],
  [/chorizo|salchichon|fuet|sobrasada|morcilla|embutido|cecina|lomo embuchado/, 'embutido', 420, 22, 0, 20, 'loncha'],
  [/mortadela|salchicha|butifarra|burger meat/, 'embutido', 300, 15, 0, 25, 'loncha'],
  [/pate|foie/, 'paté', 320, 12, 0, 20, 'porción'],
  [/queso (curado|manchego|viejo|parmesano)/, 'queso curado', 400, 26, 0, 30, 'loncha'],
  [/queso (rallado|semicurado|gouda|emmental|azul|roquefort)/, 'queso semicurado', 350, 23, 0, 30, 'porción'],
  [/queso (light|desnatado|0 ?%)/, 'queso light', 180, 22, 0, 20, 'loncha'],
  [/queso (untar|crema|philadelphia|batido)/, 'queso de untar', 250, 6, 0, 15, 'cucharada'],
  [/queso/, 'queso', 300, 20, 0, 40, 'porción'],
  [/mantequilla|margarina/, 'mantequilla', 717, 1, 0, 10, 'porción'],
  [/mermelada|confitura|miel|sirope|azucar|sacarina/, 'mermelada', 260, 0.5, 1, 20, 'cucharada'],
  [/cereal|copos de maiz|corn flakes|muesli|granola|avena/, 'cereales', 380, 8, 4, 40, 'ración'],
  [/magdalena|bizcocho|bollo|dona|donut|tarta|pastel|galleta|croissant|cruasan|napolitana/, 'bollería', 430, 6, 1, 40, 'unidad'],
  [/burrito/, 'burrito', 220, 12, 3, 200, 'unidad'],
  [/tortilla de trigo|tortilla de maiz|wrap|fajita/, 'tortilla de trigo', 300, 8, 2, 60, 'unidad'],
  [/tortilla francesa/, 'tortilla francesa', 190, 12, 0, 120, 'ración'],
  [/tortilla/, 'tortilla de patatas', 190, 7, 1.5, 150, 'ración'],
  [/patatas? fritas|chips/, 'patatas fritas', 500, 6, 4, 30, 'ración'],
  [/pizza/, 'pizza', 266, 11, 2, 200, 'ración'],
  [/hamburguesa|burger|san ?jacobo|bocadillo/, 'hamburguesa', 250, 15, 1, 180, 'unidad'],
  [/pasta|macarron|espagueti|fideo|noquis|lasana|canelones/, 'pasta', 158, 6, 2, 180, 'plato'],
  [/arroz|paella|risotto|cous ?cous/, 'arroz', 140, 3, 1, 180, 'plato'],
  [/lenteja|garbanzo|alubia|judia blanca|legumbre|potaje|cocido|fabada/, 'legumbres', 130, 8, 7, 200, 'plato'],
  [/sopa|crema|caldo|gazpacho|pure/, 'sopa', 45, 1.5, 1.5, 300, 'plato'],
  [/pollo|pavo|pechuga/, 'pollo', 165, 31, 0, 150, 'ración'],
  [/ternera|vacuno|buey|cerdo|lomo|chuleta|costilla|carne|conejo|pato|cordero/, 'carne', 220, 24, 0, 130, 'ración'],
  [/salmon|merluza|atun|pescado|bacalao|dorada|lubina|gamba|marisco|calamar|pulpo|sardina/, 'pescado', 150, 20, 0, 140, 'ración'],
  [/huevo/, 'huevo', 143, 13, 0, 55, 'unidad'],
  [/yogur|skyr|kefir|requeson|cuajada/, 'yogur', 70, 6, 0, 125, 'unidad'],
  [/leche|batido/, 'leche', 50, 3.2, 0, 200, 'vaso'],
  [/zumo/, 'zumo', 45, 0.5, 0.2, 200, 'vaso'],
  [/refresco|cola|cerveza|birra|vino|copa|cana|alcohol|gin|whisky|ron/, 'bebida', 45, 0.5, 0, 330, 'unidad'],
  [/frutos secos|nueces|almendras|pistacho|avellana|cacahuete|anacardo/, 'frutos secos', 600, 20, 9, 25, 'puñado'],
  [/fruta|manzana|platano|naranja|pera|uvas|melocoton|fresa|kiwi|sandia|melon|pina|mandarina|arandano|ciruela|higo/, 'fruta', 55, 0.8, 2, 150, 'ración'],
  [/ensalada|verdura|verduras|brocoli|calabacin|judia verde|esparrago|lechuga|tomate|pimiento|zanahoria|cebolla|champinon|berenjena/, 'verdura', 30, 1.5, 2, 150, 'ración'],
  [/salsa|mayonesa|ketchup|alioli|mostaza|vinagreta/, 'salsa', 300, 1, 0, 15, 'cucharada'],
  [/aceite|aove|oliva/, 'aceite', 884, 0, 0, 10, 'cucharada'],
  [/chocolate|cacao|bombon|helado|dulce|flan|natilla/, 'dulce', 500, 6, 3, 20, 'porción'],
  [/pan|tostada|biscote/, 'pan', 250, 9, 3, 40, 'ración']
];
const EST_FALLBACK = ['alimento', 180, 8, 1, 120, 'ración'];

function estimateFood(chunk) {
  const q = norm(chunk);
  let rule = null;
  for (const r of EST_RULES) { if (r[0].test(q)) { rule = r; break; } }
  const [, label, kcal, prot, fib, unitG, unit] = rule || [null, ...EST_FALLBACK];
  // nombre: quitar cantidad, unidad y "de" (conservando tildes para mostrarlo)
  const clean = String(chunk).toLowerCase()
    .replace(/\b\d+([.,]\d+)?\b/g, ' ')
    .replace(/\b(un|una|uno|dos|tres|cuatro|cinco|seis|siete|medio|media)\b/gi, ' ')
    .replace(/\b(kg|kilos?|kilogramos?|g|gr|gramos?|ml|cl|l|litros?|unidades?|uds?|lonchas?|rebanadas?|cucharadas?|cazos?|vasos?|tazas?|latas?|porciones?|puñados?|puñado)\b/gi, ' ')
    .replace(/\bde\b/gi, ' ').replace(/\s+/g, ' ').trim();
  return {
    name: (clean || label).slice(0, 50), kcal100: kcal, prot100: prot, fib100: fib,
    unitGrams: unitG, unit, est: true
  };
}
