// Test del parser: carga data.js y replica el flujo de resolución de app.js.
const fs = require('fs');
const vm = require('vm');

const src = fs.readFileSync(__dirname + '/data.js', 'utf8');
const ctx = { console };
vm.createContext(ctx);
// se exportan al global para poder usarlas desde node
vm.runInContext(src + '\n;globalThis.__api = { SEED_FOODS, norm, matchFood, estimateFood };', ctx);
const { SEED_FOODS, norm, matchFood, estimateFood } = ctx.__api;

const items = SEED_FOODS.map((f, id) => {
  const [name, kcal100, prot100, fib100, grams, unit, ...aliases] = f;
  return { id, name, kcal100, prot100, fib100, grams, unit, aliases, source: 'seed' };
});

const NUMW = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, medio: .5, media: .5 };
const UNITS_KG = { kg: 1000, kilo: 1000, kilos: 1000, kilogramo: 1000, kilogramos: 1000, l: 1000, litro: 1000, litros: 1000 };
const UNITS_G = ['g', 'gr', 'gramo', 'gramos', 'ml'];

function gramsFrom(chunk, item) {
  const q = norm(chunk);
  const mUnit = q.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilos?|kilogramos?|g|gr|gramos?|ml|cl|l|litros?|unidades?|uds?|lonchas?|rebanadas?|cucharadas?|cazos?|vasos?|tazas?|latas?)\b/);
  const mAny = q.match(/^(\d+(?:[.,]\d+)?)\b/);
  let n = null, unit = null;
  if (mUnit) { n = parseFloat(mUnit[1].replace(',', '.')); unit = mUnit[2]; }
  else if (mAny) { n = parseFloat(mAny[1].replace(',', '.')); }
  else { for (const w of q.split(' ')) if (NUMW[w] != null) { n = NUMW[w]; break; } }
  let grams = item.grams;
  if (n != null) {
    if (unit && UNITS_KG[unit]) grams = n * UNITS_KG[unit];
    else if (unit && UNITS_G.includes(unit)) grams = n;
    else if (n <= 12) grams = n * item.grams;
  }
  return Math.max(1, Math.round(grams));
}

function prop(hit, chunk) {
  return { how: 'base', name: hit.item.name, grams: gramsFrom(chunk, hit.item), kcal100: hit.item.kcal100 };
}
function est(chunk) {
  const e = estimateFood(chunk);
  return { how: 'est', name: e.name, grams: gramsFrom(chunk, { grams: e.unitGrams }), kcal100: e.kcal100 };
}

// misma lógica que resolveChunk() en app.js
function resolve(chunk) {
  const whole = matchFood(chunk, items);
  const compound = whole && norm(whole.item.name).includes(' con ');
  if (whole && !compound) {
    const p = chunk.split(/\s+con\s+/i);
    if (p.length === 2 && p[0].trim() && p[1].trim()) {
      const a = matchFood(p[0], items), b = matchFood(p[1], items);
      const okA = a && a.score >= 1.2, okB = b && b.score >= 1.2;
      if (okA && okB && a.item.id !== b.item.id) return [prop(a, p[0]), prop(b, p[1])];
      if (okA && !okB) return [prop(a, p[0]), est(p[1])];
      if (okB && !okA) return [prop(b, p[1]), est(p[0])];
    }
  }
  if (whole) return [prop(whole, chunk)];
  return [est(chunk)];
}

const tests = [
  '3 lonchas de jamón',
  'un café con leche y una tostada',
  '200 g de pollo y ensalada',
  'una ración de lentejas con chorizo',
  'medio aguacate',
  '2 huevos revueltos',
  'un yogur griego',
  '3 lonchas de jamón cocido',
  'una rebanada de pan de molde con mantequilla',
  'un puñado de pistachos',
  'una pizza familiar',
  'un zumo de naranja',
  '150 g de salmón a la plancha',
  'una magdalena',
  'un plato de sopa de verduras',
  'una onza de chocolate negro',
  'dos cañas de cerveza'
];

let sinKcal = 0;
for (const t of tests) {
  const parts = t.split(/\by\b|,/).map(s => s.trim()).filter(Boolean);
  const out = parts.flatMap(resolve);
  const kcal = out.reduce((a, r) => a + r.kcal100 * r.grams / 100, 0);
  for (const r of out) if (!r.kcal100) sinKcal++;
  console.log(`${t}\n   -> ` + out.map(r => `${r.name} ${r.grams}g [${r.how}] ${Math.round(r.kcal100 * r.grams / 100)} kcal`).join(' + ') + `\n   = ${Math.round(kcal)} kcal`);
}
console.log(sinKcal === 0 ? '\nOK: ninguna entrada sin kcal' : `\nFALLAN ${sinKcal}`);

/* ---- corrección del nombre dentro de la hoja (resolveName de app.js) ---- */
function resolveName(text) {
  const hit = matchFood(text, items);
  if (hit) return { name: hit.item.name, kcal100: hit.item.kcal100, unitGrams: hit.item.grams, est: false };
  const e = estimateFood(text);
  return { name: e.name || String(text).slice(0, 50), kcal100: e.kcal100, unitGrams: e.unitGrams, est: true };
}

const renames = [
  ['jamón', 'jamón cocido', 107],
  ['queso', 'queso curado', 400],
  ['tomate', 'tomate frito', 80],
  ['pan', 'pan de molde', 265],
  ['inventado', 'queso azul', 350],
  ['xxx', 'comida rara sin categoria', 180]
];
let bad = 0;
for (const [from, to, want] of renames) {
  const r = resolveName(to);
  const ok = r.kcal100 === want;
  if (!ok) bad++;
  console.log(`  "${from}" -> "${to}": ${r.name} ${r.kcal100} kcal/100 [${r.est ? 'est' : 'base'}] ${ok ? 'OK' : 'ESPERABA ' + want}`);
}
console.log(bad === 0 ? 'OK renombrado' : `FALLAN ${bad} renombrados`);

/* ---- no "secuestrar": frases concretas que antes caían en otro alimento ---- */
const mustNot = [
  ['una loncha de queso light', 'queso fresco'],
  ['loncha de queso light', 'queso fresco'],
  ['una tortilla de trigo', 'tortilla de patatas'],
  ['tortilla de trigo integral', 'tortilla de patatas'],
  ['queso light en lonchas', 'queso fresco']
];
let robos = 0;
for (const [t, malo] of mustNot) {
  const out = resolve(t);
  const nombres = out.map(o => o.name).join(' | ');
  const ok = !out.some(o => o.name === malo) && out.every(o => o.kcal100 > 0);
  if (!ok) robos++;
  console.log(`  "${t}" -> ${nombres} (${out.map(o => o.kcal100).join('/')} kcal/100) ${ok ? 'OK' : 'MAL: no debía ser ' + malo}`);
}
console.log(robos === 0 ? 'OK sin secuestros' : `FALLAN ${robos} secuestros`);
