# Ración — diario de kcal con memoria

> Decisión de producto · 12 nov 2026 · Laura (fundadora) + PM
> Estado: **MVP definido, no implementado**. El código no existe todavía; este documento es el contrato.

## 1. Problema

Laura sigue una dieta **hipocalórica de volumen**: quiere comer mucho (gramos, saciedad) gastando poco (kcal). Los contadores de kcal normales miden lo que sobra en el día, no si la comida era saciante. Además, registrar es la fricción: teclear alimentos cada día mata la adherencia a la semana 2.

**Sesión objetivo:** 4-6 registros/día de 5-10 s cada uno, más una mirada de 10 s a la noche para decidir la cena. Se usa **de pie, en la cocina, con una mano**.

**Métrica de éxito:** ≤10 s por registro y **≥70 % de los registros resueltos por memoria o voz, sin teclear kcal a mano** a partir de la semana 2.

## 2. Promesa (1 línea)

"Dime qué has comido —hablando— y en 5 segundos sé qué te queda para cenar, con memoria de lo que sueles comer."

## 3. Decisiones cerradas (12 nov 2026)

| # | Decisión | Por qué |
|---|---|---|
| D1 | **App nueva e independiente**. No extiende `menu_semanal`, no arrastra login/hogar/Supabase. | El bucle diario debe abrir en <1,5 s. Login + hogar + sync lo hacen pesado y frágil. |
| D2 | **PWA primero** (navegador + icono en pantalla de inicio), **APK después** si los recordatorios lo piden. | Cero instalación, cero firma, cero tienda, se actualiza sola. Flutter está disponible en `~/dev/flutter` si luego se quiere APK. |
| D3 | **Local-first, sin cuenta.** IndexedDB/SQLite en el dispositivo. Export CSV/JSON manual. Sin backend. | Es un diario personal de comida y peso: dato sensible. Sin nube no hay fuga, ni coste, ni mantenimiento. |
| D4 | **Voz = dictado del teclado del móvil**, no micrófono propio. | Gboard/SwiftKey ya transcriben offline gratis y con calidad. Evita depender de una API de STT y de permisos. Micrófono in-app con Web Speech API solo si sobra tiempo. |
| D5 | **La IA nunca es el único camino.** Todo registro tiene ruta manual + base local. | Los modelos free se caen (ver `menu_semanal`: `gemini 2.0 404 → gemma-4`). Sin IA se sigue pudiendo registrar. |
| D6 | **Código de barras con Open Food Facts** (gratis, sin API key). Producto escaneado → kcal/100 g reales, con marca. | Verificado 12-nov: barcode `8480000213587` → *Griego Ligero Natural, Mercadona, 60 kcal/100 g*. Cubre supermercado español. |
| D7 | **Dos perfiles locales** (Laura + pareja), cada uno con su objetivo. Sin cuentas ni invitaciones. | Petición explícita: dos dietas hipocalóricas distintas en el mismo móvil. |
| D8 | Home = **kcal restantes + barra del día**, a lo grande. Proteína, fibra y densidad **secundarios**, en una línea. | Lo que se mira a las 20:00 es "¿cuánto me queda?". El resto informa, no protagoniza. |
| D9 | **Sin monetización de ningún tipo.** No es producto comercial. | Uso personal/familiar. |

## 4. El cerebro: memoria en 3 capas

Es lo que diferencia esta app de una hoja de cálculo. Sin esto, no hay producto.

1. **Alimento** (átomo): nombre normalizado, kcal/100 g, proteína, fibra, gramos por ración típica, origen (`ia` | `off` | `manual`), y `confianza`.
2. **Comida guardada / plato** (agregado): "desayuno de siempre" = café con leche + tostada + pavo → una entrada con kcal y gramos totales, editable. Se registra con **un toque**.
3. **Diario** (eventos): fecha + hora + perfil + ítems + gramos. Nunca se reescribe: es el histórico del que se aprende.

Capas transversales:
- **Alias**: "el batido" → plato concreto. Se crea al corregir, no pidiéndolo.
- **Patrones por hora**: si a las 8:00 registras siempre lo mismo, esa comida aparece como chip nº1 a esa hora.
- **Correcciones = aprendizaje**: si corriges 200 g → 250 g, la próxima vez la ración por defecto pasa a ser 250 g. La app mejora sola sin pantallas de configuración.

**Ranking de resolución** (el orden importa, es lo que hace que vaya rápido):

1. Match exacto en alias/plato → **1 toque, 0 IA**
2. Match difuso contra alimentos ya conocidos (fuzzy, sin red) → propuesta con kcal de la base local, confirmar
3. Código de barras si hay cámara disponible
4. IA (texto libre → JSON de ítems) → se guarda como `origen: ia`, `confianza: media`, corregible
5. Manual (kcal y gramos a mano)

Objetivo medible: en 3 semanas, **≥70 % de registros caen en los pasos 1-2**.

## 5. Alcance MVP (v1) y fuera de alcance

**Entra:**
- Onboarding 45 s: nombre, sexo, edad, altura, peso, objetivo (calculado con déficit o fijado a mano). Segundo perfil opcional.
- Home: anillo/barra de kcal restantes, 4 comidas (desayuno, comida, merienda, cena), lista de lo comido con kcal y gramos.
- Registro: barra de texto con dictado del teclado + chips de habituales + un toque para repetir.
- "Qué me queda": sugerencia de cena ajustada a las kcal restantes (IA opcional; si falla, 3 ideas locales).
- Semana: kcal por día vs objetivo, adherencia (días en objetivo), media.
- Memoria: lista de habituales con veces usadas y porción por defecto; editar/borrar.
- Escaneo de código de barras (Open Food Facts).
- Export CSV/JSON y borrado total de datos (RGPD básico, sin preguntas).

**No entra (post-MVP, en este orden):**
1. Peso y tendencia (7/30 días) — se registró interés, pero no es el bucle diario.
2. Foto del plato (visión) — caro, lento, peor precisión que texto; solo cuando el resto esté sólido.
3. Rachas/streaks y recordatorios push (necesitan PWA instalada + service worker).
4. APK Android firmado.
5. Recetas propias con ingredientes (eso ya lo hace `menu_semanal`).
6. Compartir entre dispositivos.

## 6. Criterios de aceptación (se validan en build, no en documento)

| CA | Criterio | Cómo se valida |
|---|---|---|
| CA1 | Abrir la app y ver kcal restantes en ≤1,5 s en frío | DevTools / Lighthouse PWA |
| CA2 | Registrar un habitual en **1 toque** y ver el restante actualizado en ≤100 ms | Manual cronometrado, 10 repeticiones |
| CA3 | Nota de voz → registro completo en ≤6 s con red; texto manual posible **sin red** | Modo avión + prueba con red |
| CA4 | Un código de barras real (Mercadona) devuelve kcal/100 g correctas | Escanear 3 productos distintos |
| CA5 | Cerrar el navegador y reabrir: el diario del día sigue ahí | Persistencia local real |
| CA6 | Cambiar de perfil no mezcla diarios ni objetivos | Prueba con 2 perfiles |
| CA7 | Si la IA falla, la UI dice qué hacer y permite registrar a mano (sin pantalla en blanco ni bloqueo) | Forzar fallo de API |
| CA8 | Export CSV abre en Numbers/Excel con cabeceras legibles | Abrir el archivo exportado |

## 7. Stack propuesto

- **Front estático**: HTML + CSS + JS sin build (o Vite si crece). Sin framework: el MVP son 4 pantallas.
- **Datos**: IndexedDB (Dexie) — local, con export.
- **IA**: OpenRouter free, reutilizando el patrón de `menu_semanal/docs/api-ia.md` (`ai_models.json` con rotación + `cachedWinner` + degradación). Modelo de salida: **JSON estricto** de ítems.
- **Productos**: Open Food Facts v2 (`/api/v2/product/{barcode}.json`), sin key.
- **PWA**: manifest + service worker para abrir offline. Instalable en Android/iOS.

## 8. Riesgos reales

| Riesgo | Mitigación |
|---|---|
| La IA estima kcal de forma inventada y el diario deja de ser fiable | Marcar cada ítem con origen y confianza; los productos con código de barras mandan sobre la IA; corregir en 1 toque y la base local gana |
| Dictado del teclado falla o no está disponible | Campo de texto normal siempre visible; los chips cubren el 70 % de los casos |
| PWA en iOS: instalación menos obvia y almacenamiento purgable | Export automático semanal a archivo; valorar APK si molesta |
| Se convierte en cuadro de mando con 12 métricas | Regla dura: máximo 3 números secundarios en el home |
