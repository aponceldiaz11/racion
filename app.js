/* Ración — app: estado, parser local, registro, memoria, semana, ajustes. */

const S = { profiles: [], pid: null, items: [], platos: [], log: [], tipo: null };
const MEALS = [['desayuno', 'Desayuno'], ['comida', 'Comida'], ['merienda', 'Merienda'], ['cena', 'Cena'], ['picoteo', 'Picoteo']];
const MEALNAME = Object.fromEntries(MEALS);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const pad = n => String(n).padStart(2, '0');
const dayKey = ts => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const hhmm = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const round = n => Math.round(n);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(window._toast);
  window._toast = setTimeout(() => t.classList.remove('on'), 2200);
}

function inferTipo(ts = Date.now()) {
  const h = new Date(ts).getHours();
  if (h < 11) return 'desayuno';
  if (h < 16) return 'comida';
  if (h < 19.5) return 'merienda';
  if (h < 23) return 'cena';
  return 'picoteo';
}

/* ================= arranque ================= */
async function boot() {
  await dbOpen();
  S.profiles = await db.all('profiles');
  if (!S.profiles.length) { $('#onbwrap').classList.add('on'); wireOnboarding(); return; }
  S.pid = Number(await db.meta('pid')) || S.profiles[0].id;
  if (!S.profiles.find(p => p.id === S.pid)) S.pid = S.profiles[0].id;
  await ensureSeed();
  await reload();
  wireUI();
  $('#onbwrap').classList.remove('on');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

async function ensureSeed() {
  const items = await db.all('items');
  // Aditivo: añade los alimentos nuevos de la base sin tocar los que ya existen
  // (así una actualización trae alimentos nuevos a un móvil que ya tiene diario).
  const known = new Set(items.map(i => norm(i.name)));
  for (const f of SEED_FOODS) {
    const [name, kcal100, prot100, fib100, grams, unit, ...aliases] = f;
    if (known.has(norm(name))) continue;
    await db.put('items', { name, kcal100, prot100, fib100, grams, unit, aliases, source: 'seed', times: 0, last: 0 });
  }
}

async function reload() {
  S.items = await db.all('items');
  S.platos = await db.all('platos');
  S.log = await db.all('log');
  renderAll();
}

/* ================= cálculos ================= */
const profile = () => S.profiles.find(p => p.id === S.pid);
function logOf(pid = S.pid, day = dayKey(Date.now())) {
  return S.log.filter(e => e.pid === pid && dayKey(e.ts) === day).sort((a, b) => a.ts - b.ts);
}
function totals(entries) {
  return entries.reduce((a, e) => {
    a.kcal += e.kcal; a.prot += e.prot; a.fib += e.fib; a.g += e.grams;
    return a;
  }, { kcal: 0, prot: 0, fib: 0, g: 0 });
}

/* ================= render ================= */
function renderAll() { renderProfiles(); renderHoy(); renderSemana(); renderMemoria(); renderAjustes(); }

function renderProfiles() {
  const box = $('#profiles');
  box.innerHTML = S.profiles.map(p =>
    `<button data-pid="${p.id}" class="${p.id === S.pid ? 'on' : ''}">${escapeHtml(p.name)}</button>`).join('');
  box.querySelectorAll('button').forEach(b => b.onclick = () => {
    S.pid = Number(b.dataset.pid); db.meta('pid', S.pid); renderAll();
  });
  const d = new Date();
  $('#topdate').textContent = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function renderHoy() {
  const p = profile(); if (!p) return;
  const entries = logOf();
  const t = totals(entries);
  const rest = round(p.kcalTarget - t.kcal);

  $('#rest').textContent = rest;
  $('#hObj').textContent = p.kcalTarget;
  $('#hEat').textContent = round(t.kcal);
  $('#hDens').textContent = t.kcal > 0 ? round(t.g / (t.kcal / 100)) : 0;
  const st = $('#hState');
  st.textContent = rest < 0 ? 'pasado' : rest < 250 ? 'justo' : 'en margen';
  st.style.background = rest < 0 ? 'var(--red-soft)' : rest < 250 ? 'var(--amber-soft)' : 'var(--green-soft)';
  st.style.color = rest < 0 ? 'var(--red)' : rest < 250 ? '#A8701B' : 'var(--green)';

  const arc = $('#arc'), C = 2 * Math.PI * 50;
  const frac = Math.min(1, t.kcal / p.kcalTarget);
  arc.setAttribute('stroke-dashoffset', C * (1 - frac));
  arc.setAttribute('stroke', rest < 0 ? 'var(--red)' : 'var(--amber)');

  $('#mProt').innerHTML = round(t.prot) + `<span class="mp">/${p.protTarget || 0} g</span>`;
  $('#mFib').innerHTML = round(t.fib) + `<span class="mp">/${p.fibTarget || 0} g</span>`;
  $('#mG').innerHTML = round(t.g) + `<span class="mp">g</span>`;
  $('#nLog').textContent = entries.length + (entries.length === 1 ? ' registro' : ' registros');

  // comidas
  const box = $('#meals');
  let html = '';
  for (const [key, label] of MEALS) {
    const list = entries.filter(e => e.tipo === key);
    if (!list.length) continue;
    const lt = totals(list);
    html += `<div class="meal">
      <div class="t">
        <div class="name" data-cpy="${list.map(e => e.id).join(',')}" title="Copiar esta comida a otro perfil"><span>${label} <i class="cp">⧉</i></span><span class="tm">${hhmm(list[0].ts)}</span></div>
      </div>
      <div class="k">${round(lt.kcal)}<span class="g">kcal</span></div>
      <button class="del" data-del="${list.map(e => e.id).join(',')}" title="Borrar toda la comida">×</button>
      <div class="erows">${list.map(e => `
        <button class="erow" data-e="${e.id}" title="Tocar para corregir o borrar">
          <span class="en">${escapeHtml(e.name)}</span>
          <span class="eg">${round(e.grams)} g</span>
          <span class="ek">${round(e.kcal)}</span>
        </button>`).join('')}</div>
    </div>`;
  }
  const pend = MEALS.find(([k]) => !entries.some(e => e.tipo === k));
  if (pend && rest > 0) {
    html += `<div class="meal pending"><div class="t"><div class="name">${pend[1]} · pendiente</div>
      <div class="items">te quedan <b>${rest}</b> kcal para cerrar el día</div></div><div class="k">—</div></div>`;
  }
  if (!entries.length) html += `<div class="empty">Aún no hay nada hoy.<br>Escribe o dicta lo primero — o toca un habitual.</div>`;
  box.innerHTML = html;
  box.querySelectorAll('.del').forEach(b => b.onclick = async () => {
    if (!confirm('¿Borrar esta comida entera?')) return;
    for (const id of b.dataset.del.split(',').map(Number)) await db.del('log', id);
    await reload(); toast('Borrado');
  });
  // cada alimento, por separado: tocar para editar o borrar solo ese
  box.querySelectorAll('[data-e]').forEach(b => b.onclick = () => openEntrySheet(Number(b.dataset.e)));
  // tocar el nombre de la comida: copiarla a otro perfil
  box.querySelectorAll('[data-cpy]').forEach(el => el.onclick = () => copyMealSheet(el.dataset.cpy.split(',').map(Number)));

  renderSuggest(rest);
  renderQuick();
}

function renderSuggest(rest) {
  const box = $('#suggest');
  if (rest <= 0) { box.hidden = true; return; }
  const plan = cenaPlan(rest);
  if (!plan) { box.hidden = true; return; }
  box.hidden = false;
  $('#sugTxt').textContent = plan.items.map(i => `${i.name} ${round(i.grams)} g`).join(' + ');
  $('#sugMeta').textContent = `${round(plan.kcal)} kcal · ${round(plan.g)} g de comida · ${round(plan.prot)} g proteína`;
  let btn = $('#sugAdd');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'sugAdd'; btn.className = 'btn'; btn.style.cssText = 'margin-top:10px;background:rgba(255,255,255,.18);color:#fff';
    box.appendChild(btn);
  }
  btn.textContent = '＋ Añadir esta cena';
  btn.onclick = () => addEntries(plan.items.map(i => ({
    name: i.name, grams: i.grams, kcal100: i.kcal100, prot100: i.prot100, fib100: i.fib100, source: 'mem'
  })), 'cena');
}

function findFood(name) {
  const n = norm(name);
  return S.items.find(i => norm(i.name) === n) || S.items.find(i => (i.aliases || []).some(a => norm(a) === n));
}

function cenaPlan(rest) {
  const pick = (n, g) => { const f = findFood(n); return f ? { name: f.name, grams: g, kcal100: f.kcal100, prot100: f.prot100, fib100: f.fib100 } : null; };
  const combos = [
    [['huevo entero', 110], ['ensalada mixta', 200], ['yogur griego 0%', 125], ['pan integral', 30]],
    [['merluza', 150], ['brócoli', 200], ['patata cocida', 120]],
    [['pechuga de pollo', 150], ['calabacín', 250], ['tomate', 120]],
    [['atún al natural', 60], ['ensalada mixta', 250], ['tostada integral', 16]],
    [['sopa de verduras', 300], ['tortilla de patatas', 100], ['yogur griego 0%', 125]]
  ];
  let best = null, bestScore = -1;
  for (const c of combos) {
    let items = c.map(([n, g]) => pick(n, g)).filter(Boolean);
    if (items.length < 2) continue;
    let kcal = items.reduce((a, i) => a + i.kcal100 * i.grams / 100, 0);
    let tries = 0;
    while (kcal > rest && tries < 6) { items.forEach(i => i.grams *= 0.85); kcal = items.reduce((a, i) => a + i.kcal100 * i.grams / 100, 0); tries++; }
    if (kcal > rest) continue;
    const g = items.reduce((a, i) => a + i.grams, 0);
    const prot = items.reduce((a, i) => a + i.prot100 * i.grams / 100, 0);
    const score = (g / Math.max(kcal, 1)) * 100 + prot * 0.4;
    if (score > bestScore) { bestScore = score; best = { items, kcal, g, prot }; }
  }
  return best;
}

function renderQuick() {
  const box = $('#quick');
  const type = S.tipo || inferTipo();
  const platos = S.platos.filter(p => p.pid === S.pid).sort((a, b) => b.times - a.times).slice(0, 3);
  const items = S.items.filter(i => i.times > 0).sort((a, b) => b.last - a.last).slice(0, 4);
  const chips = [
    ...platos.map(p => ({ kind: 'plato', o: p, label: p.name, kcal: p.kcal, g: p.grams })),
    ...items.map(i => ({ kind: 'item', o: i, label: i.name, kcal: round(i.kcal100 * i.grams / 100), g: i.grams }))
  ].slice(0, 6);
  if (!chips.length) { box.innerHTML = ''; return; }
  box.innerHTML = chips.map((c, ix) =>
    `<button class="qb" data-ix="${ix}"><span class="plus">＋</span>${escapeHtml(c.label)}</button>`).join('');
  box.querySelectorAll('.qb').forEach(b => b.onclick = () => {
    const c = chips[Number(b.dataset.ix)];
    if (c.kind === 'plato') {
      addEntries(c.o.parts.map(p => ({ ...p })), type).then(() => db.put('platos', { ...c.o, times: (c.o.times || 0) + 1, last: Date.now() }));
    } else {
      addEntries([{ name: c.o.name, grams: c.o.grams, kcal100: c.o.kcal100, prot100: c.o.prot100, fib100: c.o.fib100, source: 'mem' }], type);
    }
  });
}

function renderSemana() {
  const p = profile(); if (!p) return;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dayKey(d.getTime());
    const t = totals(S.log.filter(e => e.pid === S.pid && dayKey(e.ts) === key));
    days.push({ key, label: d.toLocaleDateString('es-ES', { weekday: 'narrow' }), k: round(t.kcal), g: round(t.g), today: i === 0 });
  }
  const target = p.kcalTarget;
  const max = Math.max(target, ...days.map(d => d.k)) || target;
  $('#weekSub').textContent = `kcal por día · objetivo ${target}`;
  $('#bars').innerHTML = days.map(d => {
    const h = Math.max(2, round(d.k / max * 100));
    return `<div class="bar ${d.k > target ? 'over' : ''} ${d.today ? 'today' : ''}">
      <div class="kv">${d.k || ''}</div>
      <div class="fill" style="height:${h}%"></div>
      <div class="cap">${d.label}</div></div>`;
  }).join('') + `<div class="goalline" style="bottom:${round(target / max * 100)}%"><b>${target}</b></div>`;

  const logged = days.filter(d => d.k > 0);
  const inGoal = logged.filter(d => d.k <= target * 1.02).length;
  const avg = logged.length ? round(logged.reduce((a, d) => a + d.k, 0) / logged.length) : 0;
  const balance = logged.reduce((a, d) => a + d.k - target, 0);
  const density = logged.length ? round(logged.reduce((a, d) => a + d.g, 0) / Math.max(1, logged.reduce((a, d) => a + d.k, 0) / 100)) : 0;

  $('#weekKpis').innerHTML = `
    <div class="kpi ${inGoal >= 5 ? 'good' : ''}"><b>${inGoal}/${logged.length || 0}</b><i>días en objetivo</i></div>
    <div class="kpi"><b>${avg || '—'}</b><i>media kcal/día</i></div>
    <div class="kpi ${balance > 0 ? 'bad' : 'good'}"><b>${balance > 0 ? '+' : ''}${balance}</b><i>balance semana</i></div>
    <div class="kpi"><b>${density || '—'}</b><i>g/100 kcal</i></div>`;

  let note = '';
  if (!logged.length) note = 'Sin datos esta semana. Registra un par de días para ver la tendencia.';
  else if (balance > 0) note = `Vas ${balance} kcal por encima del objetivo acumulado. Un día más ajustado y la semana queda neutra.`;
  else note = `La semana cierra ${Math.abs(balance)} kcal por debajo del objetivo. Con ${avg} kcal de media, el déficit es sostenido.`;
  $('#weekNote').textContent = note;
}

function renderMemoria() {
  const box = $('#habits');
  const platos = S.platos.filter(p => p.pid === S.pid).sort((a, b) => (b.times || 0) - (a.times || 0));
  $('#memCount').textContent = platos.length ? platos.length + ' guardados' : '';
  box.innerHTML = platos.length ? platos.map(p => `
    <div class="habit">
      <div class="nm"><b>${escapeHtml(p.name)}</b><i>${p.parts.map(x => escapeHtml(x.name)).join(' · ')} · ${p.times || 0} veces</i></div>
      <div class="kcal">${round(p.kcal)}</div>
      <button class="add" data-plato="${p.id}">＋</button>
    </div>`).join('') : `<div class="empty">Aún no hay platos. Cuando añadas una comida con 2 o más alimentos, la app te ofrecerá guardarla.</div>`;
  box.querySelectorAll('[data-plato]').forEach(b => b.onclick = async () => {
    const pl = S.platos.find(x => x.id === Number(b.dataset.plato));
    await addEntries(pl.parts.map(p => ({ ...p })), S.tipo || inferTipo());
    await db.put('platos', { ...pl, times: (pl.times || 0) + 1, last: Date.now() });
    await reload(); toast('Añadido · ' + round(pl.kcal) + ' kcal');
  });

  const known = S.items.filter(i => i.times > 0 || i.source === 'off')
    .sort((a, b) => (b.times || 0) - (a.times || 0));
  $('#foodCount').textContent = known.length + ' alimentos';
  $('#foodsKnown').innerHTML = known.length ? known.map(i => `
    <div class="habit">
      <div class="nm"><b>${escapeHtml(i.name)} <span class="src ${i.source === 'off' ? 'off' : i.source === 'ia' ? 'ia' : 'mem'}">${i.source === 'off' ? 'OFF' : i.source === 'ia' ? 'IA' : 'MÍO'}</span></b>
        <i>${i.kcal100} kcal/100 g · ración ${round(i.grams)} g${i.brand ? ' · ' + escapeHtml(i.brand) : ''}</i></div>
      <div class="kcal">${round(i.kcal100 * i.grams / 100)}</div>
      <button class="add" data-food="${i.id}">＋</button>
    </div>`).join('') : `<div class="empty">Todo lo que registres y los productos que escanees aparecerán aquí.</div>`;
  $('#foodsKnown').querySelectorAll('[data-food]').forEach(b => b.onclick = async () => {
    const it = S.items.find(x => x.id === Number(b.dataset.food));
    await addEntries([{ name: it.name, grams: it.grams, kcal100: it.kcal100, prot100: it.prot100, fib100: it.fib100, source: it.source }], S.tipo || inferTipo());
    await db.put('items', { ...it, times: (it.times || 0) + 1, last: Date.now() });
    await reload(); toast('Añadido');
  });

  const q = $('#memSearch').value.trim();
  if (q) {
    const res = S.items.filter(i => norm(i.name).includes(norm(q)) || (i.aliases || []).some(a => norm(a).includes(norm(q)))).slice(0, 8);
    $('#memResults').innerHTML = res.length ? res.map(i => `
      <div class="habit"><div class="nm"><b>${escapeHtml(i.name)}</b><i>${i.kcal100} kcal/100 g · ración ${round(i.grams)} g</i></div>
      <div class="kcal">${round(i.kcal100 * i.grams / 100)}</div><button class="add" data-srch="${i.id}">＋</button></div>`).join('')
      : `<div class="empty">Nada con «${escapeHtml(q)}».</div>`;
    $('#memResults').querySelectorAll('[data-srch]').forEach(b => b.onclick = () => {
      const it = S.items.find(x => x.id === Number(b.dataset.srch));
      addProposalSheet([{ name: it.name, grams: it.grams, kcal100: it.kcal100, prot100: it.prot100, fib100: it.fib100, source: it.source }]);
    });
  } else $('#memResults').innerHTML = '';
}

function renderAjustes() {
  const p = profile(); if (!p) return;
  $('#setProfName').textContent = p.name;
  $('#setTarget').value = p.kcalTarget;
  $('#setProt').value = p.protTarget || 0;
  $('#setFib').value = p.fibTarget || 0;
  $('#setKey').value = aiKey();
  $('#setModels').value = aiModels().join('\n');
}

/* ================= registro ================= */
async function addEntries(items, tipo, pid = S.pid) {
  const ts = Date.now();
  for (const it of items) {
    const kcal = it.kcal100 * it.grams / 100;
    await db.put('log', {
      pid, ts, tipo, name: it.name, grams: round(it.grams),
      kcal: round(kcal), prot: round(it.prot100 * it.grams / 100 * 10) / 10,
      fib: round(it.fib100 * it.grams / 100 * 10) / 10, source: it.source || 'manual'
    });
    await learnFood(it);
  }
  await reload();
  const t = totals(items.map(i => ({ kcal: i.kcal100 * i.grams / 100, grams: i.grams })));
  toast(`＋ ${round(t.kcal)} kcal · +${round(t.grams)} g${pid !== S.pid ? ' (otro perfil)' : ''}`);
}

async function learnFood(it) {
  const n = norm(it.name);
  if (!n) return;
  const found = S.items.find(i => norm(i.name) === n || (i.aliases || []).some(a => norm(a) === n));
  if (found) {
    await db.put('items', {
      ...found, times: (found.times || 0) + 1, last: Date.now(),
      grams: round(it.grams) || found.grams,
      kcal100: found.source === 'off' ? found.kcal100 : (it.kcal100 || found.kcal100),
      prot100: it.prot100 || found.prot100, fib100: it.fib100 || found.fib100
    });
  } else {
    await db.put('items', {
      name: it.name.slice(0, 60), kcal100: round(it.kcal100), prot100: it.prot100 || 0, fib100: it.fib100 || 0,
      grams: round(it.grams), unit: 'ración', aliases: [], source: it.source || 'manual', times: 1, last: Date.now()
    });
  }
}

/* ------- parser local ------- */
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
    else if (unit === 'cl') grams = n * 10;
    else if (n <= 12) grams = n * item.grams;   // "2 huevos", "3 lonchas", "un yogur"
  }
  return Math.max(1, round(grams));
}

const toProposal = (hit, chunk) => ({
  name: hit.item.name, grams: gramsFrom(chunk, hit.item),
  kcal100: hit.item.kcal100, prot100: hit.item.prot100, fib100: hit.item.fib100,
  unitGrams: hit.item.grams,
  source: hit.item.source === 'off' ? 'off' : 'mem'
});

function resolveChunk(chunk) {
  const whole = matchFood(chunk, S.items);
  // un nombre que ya contiene "con" es un compuesto (café con leche): no se parte
  const compoundName = whole && norm(whole.item.name).includes(' con ');
  if (whole && !compoundName) {
    const parts = chunk.split(/\s+con\s+/i);
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      const a = matchFood(parts[0], S.items), b = matchFood(parts[1], S.items);
      const okA = a && a.score >= 1.2, okB = b && b.score >= 1.2;
      if (okA && okB && a.item.id !== b.item.id) return [toProposal(a, parts[0]), toProposal(b, parts[1])];
      // si solo una de las dos se reconoce, la otra se estima (nunca se pierde)
      if (okA && !okB) return [toProposal(a, parts[0]), estProposal(parts[1])];
      if (okB && !okA) return [toProposal(b, parts[1]), estProposal(parts[0])];
    }
  }
  if (whole) return [toProposal(whole, chunk)];
  return [estProposal(chunk)];
}

function unknownPart(chunk) {
  return {
    name: norm(chunk).replace(/^\d+\s*\w*\s*(de\s*)?/, '').slice(0, 50) || String(chunk).slice(0, 50),
    grams: 100, kcal100: 0, prot100: 0, fib100: 0, source: 'manual', unknown: true
  };
}

/* Resuelve un nombre escrito a mano en la hoja: base de datos primero, estimación después. */
function resolveName(text) {
  const hit = matchFood(text, S.items);
  if (hit) {
    return {
      name: hit.item.name, kcal100: hit.item.kcal100, prot100: hit.item.prot100,
      fib100: hit.item.fib100, unitGrams: hit.item.grams,
      source: hit.item.source === 'off' ? 'off' : 'mem', est: false, unknown: false
    };
  }
  const e = estimateFood(text);
  return {
    name: e.name || String(text).slice(0, 50), kcal100: e.kcal100, prot100: e.prot100,
    fib100: e.fib100, unitGrams: e.unitGrams, source: 'est', est: true, unknown: false
  };
}

/* Nunca dejar un alimento sin kcal: si no está en la base, se estima por categoría. */
function estProposal(chunk) {
  const e = estimateFood(chunk);
  return {
    name: e.name || 'alimento',
    grams: gramsFrom(chunk, { grams: e.unitGrams || 100 }),
    kcal100: e.kcal100, prot100: e.prot100, fib100: e.fib100,
    unitGrams: e.unitGrams,
    source: 'est', est: true
  };
}

function parseLocal(text) {
  const chunks = text.split(/[,;+]|\by\b|\bmás\b/i).map(c => c.trim()).filter(c => c.length >= 3);
  return chunks.flatMap(resolveChunk);
}

function looksLikeBarcode(t) { return /^\d{8,14}$/.test(t.replace(/\s/g, '')); }

/* ------- indicador de espera ------- */
let _thinkTimer = null, _thinkStart = 0, _busy = false;

function showThinking(label) {
  const box = $('#think'), t = $('#tsec'), l = $('#thinkTxt'), go = $('#go');
  if (!box) return;
  _thinkStart = Date.now();
  if (l) l.textContent = label || 'Pensando';
  box.hidden = false;
  const tick = () => { if (t) t.textContent = Math.round((Date.now() - _thinkStart) / 1000) + ' s'; };
  tick();
  clearInterval(_thinkTimer);
  _thinkTimer = setInterval(tick, 250);
  if (go) go.disabled = true;
}

function hideThinking() {
  clearInterval(_thinkTimer); _thinkTimer = null;
  const box = $('#think'); if (box) box.hidden = true;
  const go = $('#go'); if (go) go.disabled = false;
}

/* ------- flujo principal: enviar texto ------- */
async function submitText(raw) {
  const text = raw.trim();
  if (!text) return;
  if (looksLikeBarcode(text)) return addByBarcode(text);
  if (_busy) return;
  _busy = true;

  // Con clave de IA manda la IA: entiende modificadores ("light", "de trigo", una
  // marca) y alimentos que no están en la base. La base local es el respaldo.
  if (aiKey()) {
    showThinking('Pensando qué has comido');
    try {
      const ai = await aiParseMeals(text, profile()?.name);
      if (!ai.length) throw new Error('vacío');
      hideThinking(); _busy = false;
      $('#inp').value = '';
      return addProposalSheet(ai.map(x => ({ ...x, source: 'ia', unitGrams: x.grams })));
    } catch (e) {
      hideThinking(); _busy = false;
      $('#inp').value = text;   // no se pierde lo que has escrito
      toast(e.code === 'SIN_CLAVE' ? 'Falta la clave en Ajustes' : `IA: ${e.detail || 'no disponible'} · uso la base`);
      return addProposalSheet(parseLocal(text));
    }
  }

  _busy = false;
  addProposalSheet(parseLocal(text));
}

/* ------- hoja de confirmación ------- */
let sheetItems = [];
function addProposalSheet(items) {
  sheetItems = items.map(i => ({ ...i }));
  S.tipo = S.tipo || inferTipo();
  const wrap = $('#sheetwrap');
  const sheet = $('#sheet');
  sheet.innerHTML = `
    <h3>Confirmar</h3>
    <p class="hint">Corrige el nombre si no es ese alimento, o los gramos. Lo corregido se aprende para la próxima.</p>
    <div class="type" id="typeRow">${MEALS.map(([k, l]) => `<button data-type="${k}" class="${k === S.tipo ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${S.profiles.length > 1 ? `<div class="who" id="whoRow"><span class="whoLbl">Para</span>${S.profiles.map(p => `<button data-who="${p.id}" class="${p.id === S.pid ? 'on' : ''}">${escapeHtml(p.name)}</button>`).join('')}</div>` : ''}
    <div id="sheetItems"></div>
    <input class="search" id="platoName" placeholder="Guardar como plato (opcional: «desayuno de siempre»)" autocomplete="off">
    <div class="row"><button class="btn ghost" id="sheetCancel">Cancelar</button><button class="btn" id="sheetOk">Añadir</button></div>`;
  const badgeFor = i => i.source === 'ia' ? ' <span class="src ia">IA</span>'
    : i.source === 'off' ? ' <span class="src off">OFF</span>'
    : i.est ? ' <span class="src est">≈ est</span>' : '';
  const unitOf = i => Math.round((i.unitGrams && i.unitGrams > 0) ? i.unitGrams : i.grams) || 1;
  const multOf = i => {
    if (!i.unitGrams) return '';
    const n = i.grams / i.unitGrams;
    if (n >= 1.999 && Math.abs(n - Math.round(n)) < 0.03) return '×' + Math.round(n);
    return '';
  };
  const paint = () => {
    $('#sheetItems').innerHTML = sheetItems.map((i, ix) => `
      <div class="itm">
        <div class="nm">
          <input class="nmEdit" data-n="${ix}" value="${escapeHtml(i.name)}" autocomplete="off" spellcheck="false">
          <div><span class="u" data-u="${ix}">${i.kcal100 ? i.kcal100 + ' kcal/100 g' : 'sin datos — pon kcal'}</span><span data-b="${ix}">${badgeFor(i)}</span><span class="mult" data-m="${ix}">${multOf(i)}</span></div>
        </div>
        <div class="qty">
          <button class="step" data-minus="${ix}" aria-label="quitar una ración">−</button>
          <input type="number" inputmode="numeric" value="${round(i.grams)}" data-g="${ix}">
          <button class="step" data-plus="${ix}" aria-label="añadir una ración">+</button>
        </div>
        <span class="u">g</span>
        <button class="del" data-rm="${ix}" style="border:0;background:transparent;color:#C3BCAF;font-size:16px">×</button>
      </div>`).join('');
    const syncRow = ix => {
      const i = sheetItems[ix];
      const g = $(`#sheetItems [data-g="${ix}"]`);
      if (g) g.value = round(i.grams);
      const m = $(`#sheetItems [data-m="${ix}"]`);
      if (m) m.textContent = multOf(i);
    };
    $('#sheetItems').querySelectorAll('[data-g]').forEach(inp => inp.onchange = () => {
      const ix = Number(inp.dataset.g);
      sheetItems[ix].grams = Math.max(1, Number(inp.value) || 1);
      syncRow(ix);
    });
    // una ración más / menos por toque: "dos burritos" en un toque
    $('#sheetItems').querySelectorAll('[data-plus]').forEach(b => b.onclick = () => {
      const ix = Number(b.dataset.plus);
      sheetItems[ix].grams = Math.max(1, round(sheetItems[ix].grams + unitOf(sheetItems[ix])));
      syncRow(ix);
    });
    $('#sheetItems').querySelectorAll('[data-minus]').forEach(b => b.onclick = () => {
      const ix = Number(b.dataset.minus);
      const i = sheetItems[ix];
      const u = unitOf(i);
      i.grams = i.grams - u >= 1 ? round(i.grams - u) : Math.max(1, round(i.grams / 2));
      syncRow(ix);
    });
    // Corregir el nombre de un alimento sin salir de la hoja
    $('#sheetItems').querySelectorAll('[data-n]').forEach(inp => {
      inp.onchange = () => {
        const ix = Number(inp.dataset.n);
        const txt = inp.value.trim();
        if (!txt) { inp.value = sheetItems[ix].name; return; }
        const old = sheetItems[ix];
        const r = resolveName(txt);
        // si el gramaje era "una unidad" del alimento anterior, se ajusta a la unidad nueva
        const wasOneUnit = old.unitGrams && Math.abs(old.grams - old.unitGrams) < 1;
        Object.assign(old, r);
        if (wasOneUnit) {
          old.grams = r.unitGrams || old.grams;
          const gInp = $(`#sheetItems [data-g="${ix}"]`);
          if (gInp) gInp.value = round(old.grams);
        }
        inp.value = old.name;
        const u = $(`#sheetItems [data-u="${ix}"]`);
        if (u) u.textContent = old.kcal100 ? old.kcal100 + ' kcal/100 g' : 'sin datos — pon kcal';
        const b = $(`#sheetItems [data-b="${ix}"]`);
        if (b) b.innerHTML = badgeFor(old);
        const mm = $(`#sheetItems [data-m="${ix}"]`);
        if (mm) mm.textContent = multOf(old);
      };
    });
    $('#sheetItems').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => {
      sheetItems.splice(Number(b.dataset.rm), 1);
      if (!sheetItems.length) closeSheet(); else paint();
    });
  };
  paint();
  $('#typeRow').querySelectorAll('button').forEach(b => b.onclick = () => {
    S.tipo = b.dataset.type;
    $('#typeRow').querySelectorAll('button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
  });
  // a quién se le apunta: yo por defecto, los demás se marcan
  const who = $('#whoRow');
  if (who) who.querySelectorAll('[data-who]').forEach(b => b.onclick = () => b.classList.toggle('on'));
  $('#sheetCancel').onclick = closeSheet;
  $('#sheetOk').onclick = async () => {
    const tipo = S.tipo;
    const name = $('#platoName').value.trim();
    const items = sheetItems.filter(i => i.grams > 0);
    if (!items.length) return closeSheet();
    const marked = [...document.querySelectorAll('#whoRow [data-who].on')].map(b => Number(b.dataset.who));
    const targets = marked.length ? marked : [S.pid];
    for (const pid of targets) await addEntries(items, tipo, pid);
    if (targets.length > 1) toast(`Añadido a ${targets.length} perfiles`);
    if (items.length >= 2 || name) {
      const t = totals(items.map(i => ({ kcal: i.kcal100 * i.grams / 100, grams: i.grams, prot: i.prot100 * i.grams / 100, fib: i.fib100 * i.grams / 100 })));
      await db.put('platos', {
        pid: S.pid, name: name || `${MEALNAME[tipo]} (${items.map(i => i.name).slice(0, 2).join(' + ')})`,
        parts: items.map(i => ({ name: i.name, grams: round(i.grams), kcal100: i.kcal100, prot100: i.prot100, fib100: i.fib100, source: i.source })),
        kcal: round(t.kcal), grams: round(t.grams), prot: round(t.prot), times: 1, last: Date.now()
      });
      toast('Guardado como plato · la próxima es un toque');
    }
    closeSheet();
  };
  wrap.classList.add('on');
}

/* ------- corregir / borrar un alimento ya registrado ------- */
function openEntrySheet(id) {
  const e = S.log.find(x => x.id === id);
  if (!e) return;
  const sheet = $('#sheet');
  sheet.innerHTML = `
    <h3>Corregir alimento</h3>
    <p class="hint">Cambia el nombre o los gramos y se recalcula. «Borrar» quita solo este alimento.</p>
    <div class="form">
      <label>Alimento<input id="edName" value="${escapeHtml(e.name)}" autocomplete="off" spellcheck="false"></label>
      <label>Gramos<input type="number" inputmode="numeric" id="edG" value="${round(e.grams)}" min="1"></label>
      <div class="two">
        <button class="btn ghost" id="edHalf" type="button">÷ 2</button>
        <button class="btn ghost" id="edDouble" type="button">× 2</button>
      </div>
    </div>
    <p class="hint" id="edPrev"></p>
    <div class="row">
      <button class="btn ghost" id="edCancel">Cancelar</button>
      <button class="btn ghost" id="edDel" style="color:#B4462F">Borrar</button>
      <button class="btn" id="edSave">Guardar</button>
    </div>`;
  const preview = () => {
    const r = resolveName($('#edName').value.trim() || e.name);
    const g = Math.max(1, Number($('#edG').value) || e.grams);
    $('#edPrev').textContent = `${r.name} · ${round(r.kcal100 * g / 100)} kcal · ${r.est ? 'valor estimado' : 'valor de la base'}`;
  };
  $('#edName').oninput = preview;
  $('#edG').oninput = preview;
  $('#edDouble').onclick = () => { const g = $('#edG'); g.value = Math.max(1, round((Number(g.value) || e.grams) * 2)); preview(); };
  $('#edHalf').onclick = () => { const g = $('#edG'); g.value = Math.max(1, round((Number(g.value) || e.grams) / 2)); preview(); };
  preview();
  $('#edCancel').onclick = closeSheet;
  $('#edDel').onclick = async () => {
    if (!confirm(`¿Borrar "${e.name}"?`)) return;
    await db.del('log', e.id); await reload(); closeSheet(); toast('Borrado');
  };
  $('#edSave').onclick = async () => {
    const r = resolveName($('#edName').value.trim() || e.name);
    const g = Math.max(1, Number($('#edG').value) || e.grams);
    await db.put('log', {
      ...e, name: r.name, grams: round(g),
      kcal: round(r.kcal100 * g / 100),
      prot: round(r.prot100 * g / 100 * 10) / 10,
      fib: round(r.fib100 * g / 100 * 10) / 10,
      source: r.source
    });
    await reload(); closeSheet(); toast('Corregido');
  };
  $('#sheetwrap').classList.add('on');
}

function closeSheet() { $('#sheetwrap').classList.remove('on'); }

/* ------- copiar una comida entera a otro perfil ------- */
function copyMealSheet(ids) {
  const list = S.log.filter(e => ids.includes(e.id));
  const others = S.profiles.filter(p => p.id !== S.pid);
  if (!list.length) return;
  if (!others.length) { toast('Solo hay un perfil configurado'); return; }
  const t = totals(list);
  const sheet = $('#sheet');
  sheet.innerHTML = `
    <h3>Copiar comida</h3>
    <p class="hint">${list.length} alimento${list.length === 1 ? '' : 's'} · ${round(t.kcal)} kcal. Marca a quién se lo apunto también.</p>
    <div class="who" id="cpyWho">${others.map(p => `<button data-cp="${p.id}">${escapeHtml(p.name)}</button>`).join('')}</div>
    <div class="row"><button class="btn ghost" id="cpyCancel">Cancelar</button><button class="btn" id="cpyOk">Copiar</button></div>`;
  $('#cpyWho').querySelectorAll('[data-cp]').forEach(b => b.onclick = () => b.classList.toggle('on'));
  $('#cpyCancel').onclick = closeSheet;
  $('#cpyOk').onclick = async () => {
    const pids = [...$('#cpyWho').querySelectorAll('.on')].map(b => Number(b.dataset.cp));
    if (!pids.length) { toast('Marca al menos un perfil'); return; }
    for (const pid of pids) {
      for (const e of list) {
        const { id, ...rest } = e;   // sin id: se crea una fila nueva
        await db.put('log', { ...rest, pid });
      }
    }
    await reload(); closeSheet();
    toast(`Copiada a ${pids.map(p => (S.profiles.find(x => x.id === p) || {}).name).join(', ')}`);
  };
  $('#sheetwrap').classList.add('on');
}

/* ------- código de barras ------- */
async function addByBarcode(code) {
  showThinking('Buscando el código');
  try {
    const p = await offLookup(code);
    if (!p) { toast('Ese código no está en Open Food Facts · añádelo a mano'); return; }
    if (!p.kcal100) { toast('El producto no trae kcal · a mano'); return; }
    const serving = (p.serving && p.serving >= 20 && p.serving <= 150) ? p.serving : 100;
    addProposalSheet([{ name: p.brand ? `${p.name} (${p.brand})` : p.name, grams: serving, kcal100: p.kcal100, prot100: p.prot100, fib100: p.fib100, source: 'off', barcode: p.barcode }]);
  } catch (e) { toast('Sin conexión con Open Food Facts'); }
  finally { hideThinking(); }
}

async function openScanner() {
  const sheet = $('#sheet'), wrap = $('#sheetwrap');
  sheet.innerHTML = `
    <h3>Escanear código</h3>
    <p class="hint">Apunta al código de barras. Si la cámara no va, escribe los números.</p>
    <video id="cam" playsinline muted style="width:100%;border-radius:16px;background:#000;max-height:46dvh;object-fit:cover"></video>
    <input class="search" id="codeIn" inputmode="numeric" placeholder="O escribe el código (8-13 dígitos)" style="margin-top:10px">
    <div class="row"><button class="btn ghost" id="camCancel">Cerrar</button><button class="btn" id="codeGo">Buscar</button></div>`;
  wrap.classList.add('on');
  $('#camCancel').onclick = () => { stopCam(); closeSheet(); };
  $('#codeGo').onclick = () => { const v = $('#codeIn').value.trim(); if (v) { stopCam(); closeSheet(); addByBarcode(v); } };
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices) {
    $('#cam').style.display = 'none';
    $('#cam').insertAdjacentHTML('afterend', '<p class="note">Este navegador no lee códigos con la cámara: escribe el número.</p>');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const v = $('#cam'); v.srcObject = stream; await v.play(); window._stream = stream;
    const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
    const loop = async () => {
      if (!window._stream) return;
      try {
        const codes = await det.detect(v);
        if (codes.length) { stopCam(); closeSheet(); addByBarcode(codes[0].rawValue); return; }
      } catch (e) {}
      requestAnimationFrame(loop);
    };
    loop();
  } catch (e) {
    $('#cam').style.display = 'none';
    toast('Cámara no disponible · escribe el código');
  }
}
function stopCam() { if (window._stream) { window._stream.getTracks().forEach(t => t.stop()); window._stream = null; } }

/* ================= ajustes / export ================= */
async function exportCsv() {
  const rows = [['fecha', 'hora', 'perfil', 'tipo', 'alimento', 'gramos', 'kcal', 'proteina_g', 'fibra_g', 'origen']];
  for (const e of S.log.slice().sort((a, b) => a.ts - b.ts)) {
    const p = S.profiles.find(x => x.id === e.pid);
    rows.push([dayKey(e.ts), hhmm(e.ts), p ? p.name : '', e.tipo, e.name, e.grams, e.kcal, e.prot, e.fib, e.source]);
  }
  download('racion.csv', rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
}
async function exportJson() {
  const dump = { exported: new Date().toISOString(), profiles: S.profiles, items: S.items, platos: S.platos, log: S.log };
  download('racion.json', JSON.stringify(dump, null, 1), 'application/json');
}
function download(name, content, mime) {
  const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: mime + ';charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* ================= onboarding ================= */
function calcTarget({ sex, age, height, weight }) {
  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
  const tdee = bmr * 1.35;
  return Math.max(1200, round((tdee - 450) / 10) * 10);
}

function wireOnboarding() {
  const form = $('#onbForm');
  const recalc = () => {
    const sex = $('#onbSex').value, age = +$('#onbAge').value, height = +$('#onbHeight').value, weight = +$('#onbWeight').value;
    if (age && height && weight) {
      const t = calcTarget({ sex, age, height, weight });
      $('#onbTarget').value = t;
      $('#onbHint').textContent = `Mantenimiento ≈ ${round(t * 1.25)} kcal. Te propongo ${t} con déficit moderado.`;
    }
  };
  ['onbSex', 'onbAge', 'onbHeight', 'onbWeight'].forEach(id => $('#' + id).oninput = recalc);
  $('#onbGo').onclick = async () => {
    const name = $('#onbName').value.trim() || 'Yo';
    const sex = $('#onbSex').value, age = +$('#onbAge').value || 35, height = +$('#onbHeight').value || 168, weight = +$('#onbWeight').value || 70;
    let target = +$('#onbTarget').value || calcTarget({ sex, age, height, weight });
    const id = await db.put('profiles', {
      name, sex, age, height, weight, kcalTarget: target,
      protTarget: round(weight * 1.8), fibTarget: 30, createdAt: Date.now()
    });
    await db.meta('pid', id);
    $('#onbwrap').classList.remove('on');
    await boot();
    toast('Listo. Escribe, dicta o escanea.');
  };
}

/* ================= eventos ================= */
function wireUI() {
  $('#go').onclick = () => { const v = $('#inp').value; $('#inp').value = ''; submitText(v); };
  $('#inp').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#go').click(); } };

  $$('#tabs button').forEach(b => b.onclick = () => {
    $$('#tabs button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    $$('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === b.dataset.tab));
    $('#composer').style.display = b.dataset.tab === 'hoy' ? 'block' : 'none';
    $('#main').scrollTop = 0;
    if (b.dataset.tab === 'memoria') renderMemoria();
  });

  $('#memSearch').oninput = renderMemoria;

  // voz: dictado nativo si existe; si no, aviso claro
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  $('#mic').onclick = () => {
    if (!SR) {
      $('#inp').focus();
      toast('Toca el micrófono del teclado para dictar');
      return;
    }
    if (window._rec) { window._rec.stop(); return; }
    const rec = new SR();
    rec.lang = 'es-ES'; rec.interimResults = false; rec.maxAlternatives = 1;
    window._rec = rec;
    $('#mic').classList.add('rec');
    rec.onresult = ev => {
      const t = ev.results[0][0].transcript;
      $('#inp').value = t;
      submitText(t);
    };
    rec.onerror = () => toast('No te he oído · usa el micrófono del teclado');
    rec.onend = () => { $('#mic').classList.remove('rec'); window._rec = null; };
    rec.start();
  };

  $('#saveProfile').onclick = async () => {
    const p = profile();
    await db.put('profiles', { ...p, kcalTarget: +$('#setTarget').value || p.kcalTarget, protTarget: +$('#setProt').value || p.protTarget, fibTarget: +$('#setFib').value || p.fibTarget });
    await reload(); toast('Guardado');
  };
  $('#addProfile').onclick = () => addProfileSheet();
  $('#saveKey').onclick = () => {
    localStorage.setItem('racion_key', $('#setKey').value.trim());
    const models = $('#setModels').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (models.length) localStorage.setItem('racion_models', JSON.stringify(models));
    toast('Ajustes de IA guardados');
  };
  $('#testKey').onclick = async () => {
    toast('Probando de verdad…');
    try {
      // prueba real: el mismo prompt que se usa al registrar, no un "ok" de mentira
      const items = await aiParseMeals('200 g de pollo y ensalada', profile()?.name || 'prueba');
      toast(`IA OK · ${items.length} alimento(s) · ${items[0]?.name || ''} (${aiLastModel().split('/')[0]})`);
    } catch (e) {
      toast(e.code === 'SIN_CLAVE' ? 'Falta la clave' : `Falla: ${e.detail || e.message}`);
    }
  };
  $('#exportCsv').onclick = exportCsv;
  $('#exportJson').onclick = exportJson;
  $('#wipe').onclick = async () => {
    if (!confirm('¿Borrar todos los datos de este dispositivo? No hay copia en la nube.')) return;
    for (const s of ['profiles', 'items', 'platos', 'log', 'meta']) await db.clear(s);
    location.reload();
  };
}

function addProfileSheet() {
  const sheet = $('#sheet'), wrap = $('#sheetwrap');
  sheet.innerHTML = `
    <h3>Otra persona</h3>
    <p class="hint">Mismo móvil, diario y objetivo separados.</p>
    <div class="form">
      <label>Nombre<input id="npName" placeholder="Marta"></label>
      <div class="two">
        <label>Sexo<select id="npSex"><option value="f">Mujer</option><option value="m">Hombre</option></select></label>
        <label>Edad<input type="number" id="npAge" inputmode="numeric" placeholder="36"></label>
      </div>
      <div class="two">
        <label>Altura (cm)<input type="number" id="npHeight" inputmode="numeric" placeholder="165"></label>
        <label>Peso (kg)<input type="number" id="npWeight" inputmode="numeric" placeholder="64"></label>
      </div>
    </div>
    <div class="row"><button class="btn ghost" id="npCancel">Cancelar</button><button class="btn" id="npOk">Crear</button></div>`;
  wrap.classList.add('on');
  $('#npCancel').onclick = closeSheet;
  $('#npOk').onclick = async () => {
    const name = $('#npName').value.trim(); if (!name) return toast('Ponle nombre');
    const sex = $('#npSex').value, age = +$('#npAge').value || 35, height = +$('#npHeight').value || 165, weight = +$('#npWeight').value || 65;
    await db.put('profiles', { name, sex, age, height, weight, kcalTarget: calcTarget({ sex, age, height, weight }), protTarget: round(weight * 1.8), fibTarget: 30, createdAt: Date.now() });
    closeSheet(); await boot(); toast('Perfil creado · cambia arriba');
  };
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

document.addEventListener('DOMContentLoaded', boot);
