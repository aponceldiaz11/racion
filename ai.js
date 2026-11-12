/* Ración — IA gratuita (OpenRouter) con rotación + Open Food Facts. */

// Verificados el 2026-11-12 con la clave del proyecto (2,7 s / 4,8 s / 9,2 s).
// Las listas :free caducan: si todo falla, se edita en Ajustes sin tocar código.
const AI_DEFAULT_MODELS = [
  'baidu/ernie-5.5-flash-preview:free',
  'cohere/north-mini-code:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free'
];

const AI_TIMEOUT = 14000;
let _winner = null, _winnerAt = 0;

function aiKey() { return localStorage.getItem('racion_key') || ''; }
function aiModels() {
  try { const raw = localStorage.getItem('racion_models'); if (raw) { const m = JSON.parse(raw); if (Array.isArray(m) && m.length) return m; } } catch (e) {}
  return AI_DEFAULT_MODELS;
}

async function aiChat({ system, user, temperature = 0.2, json = true }) {
  const key = aiKey();
  if (!key) { const e = new Error('SIN_CLAVE'); e.code = 'SIN_CLAVE'; throw e; }
  const models = aiModels();
  const order = (_winner && Date.now() - _winnerAt < 5 * 60 * 1000 && models.includes(_winner))
    ? [_winner, ...models.filter(m => m !== _winner)] : models;
  let lastErr = null;
  for (const model of order) {
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
          max_tokens: 900,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }]
          // sin response_format: varios modelos free devuelven contenido vacío si se les exige
        })
      });
      clearTimeout(t);
      if (!r.ok) { lastErr = new Error('HTTP ' + r.status); continue; }
      const data = await r.json();
      const txt = data?.choices?.[0]?.message?.content;
      if (!txt) { lastErr = new Error('respuesta vacía'); continue; }
      _winner = model; _winnerAt = Date.now();
      return { text: txt, model };
    } catch (e) {
      clearTimeout(t);
      lastErr = e;
    }
  }
  const e = new Error('IA_NO_DISPONIBLE');
  e.code = 'IA_NO_DISPONIBLE';
  e.cause = lastErr;
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
- Máximo 8 items. No añadas texto fuera del JSON. Si no entiendes algo, estima con sentido común.`;

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
