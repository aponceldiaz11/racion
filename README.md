# Ración — diario de kcal con memoria

App personal para llevar una **dieta hipocalórica de volumen**: comer mucho (gramos, saciedad) gastando poco (kcal). Se registra **dictando** lo que has comido y la app **aprende tus habituales** para que cada vez cueste menos.

- **PWA**: se abre en el navegador y se instala en la pantalla de inicio. Sin tienda, sin APK, se actualiza sola.
- **Local-first**: sin cuenta y sin nube. Los datos viven en el navegador del móvil. Export CSV/JSON y borrado total en Ajustes.
- **IA opcional**: si pegas una clave gratuita de OpenRouter en Ajustes, entiende frases libres ("una ración de lentejas del bar"). Sin clave funciona igual: memoria, código de barras y entrada manual.
- **Código de barras**: consulta Open Food Facts (gratis, sin clave) y usa las kcal reales del producto.

## Usar en el móvil

1. Abre la URL en Chrome (Android) o Safari (iOS).
2. Menú → **Añadir a pantalla de inicio**. Se abre a pantalla completa.
3. Onboarding: nombre, sexo, edad, altura, peso → objetivo calculado. Puedes añadir una segunda persona.
4. Para dictar: toca el campo de texto y usa **el micrófono del teclado** (Gboard / dictado de iOS). Es gratis, rápido y a veces sin conexión.

## Estructura

```
index.html            pantallas (hoy, semana, memoria, ajustes)
styles.css            diseño
data.js               base local de ~95 alimentos + IndexedDB + matcher
ai.js                 OpenRouter free con rotación + Open Food Facts
app.js                estado, parser de frases, registro, semana, export
sw.js                 service worker (abre sin red)
manifest.webmanifest  instalación
docs/PRODUCT.md       spec: decisiones, alcance, criterios de aceptación
mockup.html           mockup navegable previo (referencia visual)
```

## Publicar

El repo es **privado**. GitHub Pages no sirve repos privados en el plan gratuito, así que el sitio se publica con un hosting estático que sube la carpeta tal cual:

```bash
# Vercel (gratis, y el repo sigue privado)
npx vercel login          # una vez
npx vercel --prod         # devuelve la URL fija del proyecto

# o Cloudflare Pages
npx wrangler pages deploy . --project-name racion
```

Al desplegar, copia la URL resultante en el móvil y añádela a la pantalla de inicio.

## Privacidad

No hay backend. Nada de lo que registras sale del dispositivo, salvo el texto que envías al modelo cuando usas la IA (solo si has puesto tu clave), y el código de barras que consultas a Open Food Facts. La clave de OpenRouter se guarda en el `localStorage` de tu navegador.

## Modelos de IA

La lista por defecto está verificada con fecha y se edita **desde Ajustes** sin tocar código. Los modelos `:free` caducan; si uno falla, el router pasa al siguiente y, si todos fallan, la app pide el registro a mano.
