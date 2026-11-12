/* Ración — IA gratuita (OpenRouter) con rotación + Open Food Facts. */

// Verificados el 2026-11-12 con la clave del proyecto, y re-verificados con el
// prompt real de alimentos: los dos primeros responden y respetan los nombres
// ("queso light", "tortilla de trigo"). ernie devuelve contenido VACÍO con este
// prompt (se gasta los tokens razonando) y los gemma están limitados por el
// proveedor, así que van al final como último recurso.
const AI_DEFAULT_MODELS = [
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'baidu/ernie-5.5-flash-preview:free'
];

const AI_TIMEOUT = 22000;      // el modelo bueno tarda hasta ~17 s en frases largas
const AI_MAX_TOKENS = 1200;
const AI_BUDGET = 45000;       // no dejar al usuario esperando más que esto
const AI_QUARANTINE = 10 * 60 * 1000;
let _winner = null, _winnerAt = 0;
const _bad = new Map();        // modelo -> momento en que falló

function aiLastModel() { return _winner; }

function aiKey() { return localStorage.getItem('racion_key') || ''; }
function aiModels() {
  try { const raw = localStorage.getItem('racion_models'); if (raw) { const m = JSON.parse(raw); if (Array.isArray(m) && m.length) return m; } } catch (e) {}
  return AI_DEFAULT_MODELS;
}

async function aiChat({ system, user, temperature = 0.2, json = true }) {
  const key = aiKey();
  if (!key) { const e = new Error('SIN_CLAVE'); e.code = 'SIN_CLAVE'; throw e; }
  const models = aiModels();
  // orden: ganador reciente, luego los que no están en cuarentena, luego el resto
  const now = Date.now();
  const fresh = models.filter(m => !_bad.has(m) || now - _bad.get(m) > AI_QUARANTINE);
  const ordered = (_winner && now - _winnerAt < 5 * 60 * 1000 && fresh.includes(_winner))
    ? [_winner, ...fresh.filter(m => m !== _winner), ...models.filter(m => !fresh.includes(m))]
    : [...fresh, ...models.filter(m => !fresh.includes(m))];

  const started = Date.now();
  const fails = [];
  for (const model of ordered) {
    if (Date.now() - started > AI_BUDGET) { fails.push('tiempo agotado'); break; }
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), AI_TIMEOUT);
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key,
          'HTTP-Referer': location.origin,
          'X-Title': 'Racion'
        },
        body: JSON.stringify({
          model,
          temperature,
          max_tokens: AI_MAX_TOKENS,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
          // sin response_format: varios modelos free devuelven contenido vacío si se les exige
        })
      });
      clearTimeout(t);
      if (!r.ok) {
        _bad.set(model, Date.now());
        fails.push(`${model.split('/')[0]} HTTP ${r.status}`);
        continue;
      }
      const data = await r.json();
      const choice = (data?.choices || [{}])[0];
      const txt = choice?.message?.content;
      if (!txt || !String(txt).trim()) {
        _bad.set(model, Date.now());
        fails.push(`${model.split('/')[0]} vacío${choice?.finish_reason === 'length' ? ' (tokens)' : ''}`);
        continue;
      }
      _winner = model; _winnerAt = Date.now();
      _bad.delete(model);
      return { text: txt, model };
    } catch (e) {
      clearTimeout(t);
      _bad.set(model, Date.now());
      fails.push(`${model.split('/')[0]} ${e.name === 'AbortError' ? 'lento' : 'error'}`);
    }
  }
  const e = new Error('IA_NO_DISPONIBLE');
  e.code = 'IA_NO_DISPONIBLE';
  e.detail = fails.slice(0, 3).join(' · ') || 'sin modelos';
  throw e;
}

/* Extrae el primer objeto/array JSON válido de un texto. */
function extractJson(txt) {
  let t = String(txt).trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (e) {}
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) {} }
  const c = t.indexOf('['), d = t.lastIndexOf(']');
  if (c >= 0 && d > c) { try { return JSON.parse(t.slice(c, d + 1)); } catch (e) {} }
  return null;
}

const AI_SYSTEM = `Eres un asistente nutricional para una dieta hipocalórica de volumen (España).
Convierte lo que ha comido una persona a alimentos estructurados, usando valores realistas de composición por 100 g.
Devuelve SOLO JSON con esta forma exacta:
{"items":[{"name":"nombre en español","grams":150,"kcal100":165,"prot100":31,"fib100":0}]}
Reglas:
- "grams" son los gramos de la ración consumida (si dice "un yogur", 125; "una lata de atún", 60).
- kcal100/prot100/fib100 son por 100 g del alimento en crudo o tal cual se come (cocido si lo dice).
- Si es un plato compuesto (paella, lentejas con chorizo, pizza), estima el conjunto como un solo item.
- Si menciona aceite, pan o bebidas, inclúyelos como items propios.
- Máximo 8 items. No añadas texto fuera del JSON. Si no entiendes algo, estima con sentido común.
MUY IMPORTANTE, el nombre manda:
- Usa el nombre EXACTO que dice la persona. No lo sustituyas por otro alimento parecido.
  "queso light" NO es "queso fresco"; "tortilla de trigo" es un wrap, NO una tortilla de patatas;
  "pan de centeno" NO es "pan integral".
- Los modificadores cambian el valor: light / 0% / desnatado, integral, de trigo o de maíz,
  frito o a la plancha, con o sin azúcar. Aplícalos al valor por 100 g.
- Si el alimento no existe en ninguna tabla, estímalo con valores reales de su categoría,
  pero conserva el nombre que ha dicho la persona.
- Ante la duda entre dos alimentos distintos, elige el que la persona ha nombrado, no el más común.`;

async function aiParseMeals(text, profileName) {
  const { text: out, model } = await aiChat({
    system: AI_SYSTEM,
    user: `Persona: ${profileName || 'adulta'}. Texto: "${text}"`
  });
  const j = extractJson(out);
  if (!j) throw new Error('JSON inválido del modelo');
  let items = j.items || j.alimentos || (Array.isArray(j) ? j : null);
  if (!items || !Array.isArray(items)) throw new Error('sin items');
  return items.map(it => ({
    name: String(it.name || it.nombre || 'alimento').slice(0, 60),
    grams: Math.max(1, Math.round(Number(it.grams ?? it.gramos ?? 100) || 100)),
    kcal100: Math.max(0, Number(it.kcal100 ?? it.kcal_100g ?? 0) || 0),
    prot100: Math.max(0, Number(it.prot100 ?? it.proteinas ?? 0) || 0),
    fib100: Math.max(0, Number(it.fib100 ?? it.fibra ?? 0) || 0)
  })).filter(x => x.kcal100 > 0 || x.grams > 0).slice(0, 8);
}

/* ---------- Open Food Facts ---------- */
async function offLookup(barcode) {
  const code = String(barcode).replace(/\D/g, '');
  if (code.length < 8) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,image_small_url`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('OFF HTTP ' + r.status);
  const d = await r.json();
  if (!d || d.status === 0 || !d.product) return null;
  const p = d.product, n = p.nutriments || {};
  let kcal = Number(n['energy-kcal_100g']);
  if (!kcal && n['energy_100g']) kcal = Number(n['energy_100g']) / 4.184;
  return {
    barcode: code,
    name: (p.product_name || 'Producto sin nombre').slice(0, 60),
    brand: (p.brands || '').split(',')[0].trim(),
    kcal100: kcal > 0 ? Math.round(kcal) : 0,
    prot100: Number(n.proteins_100g) || 0,
    fib100: Number(n.fiber_100g) || 0,
    serving: Number(p.serving_quantity) || 0
  };
}

async function offSearch(term) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=5&fields=code,product_name,brands,nutriments,serving_quantity`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('OFF HTTP ' + r.status);
  const d = await r.json();
  return (d.products || []).map(p => {
    const n = p.nutriments || {};
    let kcal = Number(n['energy-kcal_100g']);
    if (!kcal && n['energy_100g']) kcal = Number(n['energy_100g']) / 4.184;
    return {
      barcode: p.code, name: (p.product_name || '').slice(0, 60),
      brand: (p.brands || '').split(',')[0].trim(),
      kcal100: kcal > 0 ? Math.round(kcal) : 0,
      prot100: Number(n.proteins_100g) || 0,
      fib100: Number(n.fiber_100g) || 0,
      serving: Number(p.serving_quantity) || 0
    };
  }).filter(p => p.name && p.kcal100 > 0);
}
