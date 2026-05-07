# Numaris — Sitio Web

Sitio web de **Numaris** (tecnocontrolv.com), empresa líder en telemática y rastreo satelital en México.

## Stack
- HTML estático + Tailwind CSS (CDN)
- Vercel para deploy
- GitHub: github.com/Numaris-marketing/sitio-web
- Rama de producción: `main` → tecnocontrolv.com

## Estructura del proyecto
```
public/
  numaris-home.html          ← Página principal
  contacto/index.html        ← Página de contacto
  soluciones/
    seguridad-patrimonial/
      rastreo-satelital/index.html
  logos/                     ← Logos de clientes (SVG)
  *.svg                      ← Animaciones e íconos
  *.mp4                      ← Videos
vercel.json                  ← Rutas y configuración de deploy
```

## Paleta de colores
- Azul marino: `#012750`
- Azul medio: `#245FA5`
- Azul claro: `#4B8FD4`
- Fondo oscuro: `#040D1A`
- Fondo secundario: `#05101E`
- Verde acento: `#10B981`

## Tipografía
- Inter (Google Fonts)
- Títulos: font-weight 700, tracking-tight
- Body: font-weight 400-500, color rgba(255,255,255,.55)

---

## 👤 Si eres Libni (Redacción y Copy)

**Tu rama:** `libni/cambios`

Al inicio de cada sesión ejecuta:
```
git checkout libni/cambios 2>/dev/null || git checkout -b libni/cambios
git pull origin libni/cambios 2>/dev/null || true
```

**Tu trabajo:** Editar textos, headlines, descripciones, CTAs y copy de todas las páginas.

**Puedes modificar:**
- Textos dentro de etiquetas `<h1>`, `<h2>`, `<h3>`, `<p>`, `<span>`, `<a>`
- Meta titles y descripciones en el `<head>`
- Cualquier copy visible en el sitio

**No toques:**
- Estilos CSS (`style="..."`)
- Clases de Tailwind (`class="..."`)
- Scripts (`<script>`)
- Estructura HTML (divs, sections, etc.)

**Para subir tus cambios:**
```
git add -A && git commit -m "copy: [describe el cambio]" && git push origin libni/cambios
```

Vercel publicará automáticamente en tu URL de preview. Comparte esa URL con Patricio para aprobación.

---

## 🎨 Si eres Andrea (Diseño UI/UX)

**Tu rama:** `andrea/diseno`

Al inicio de cada sesión ejecuta:
```
git checkout andrea/diseno 2>/dev/null || git checkout -b andrea/diseno
git pull origin andrea/diseno 2>/dev/null || true
```

**Tu trabajo:** Implementar cambios visuales basados en referencias, mockups o indicaciones de diseño.

**Puedes modificar:**
- Estilos CSS y clases de Tailwind
- Colores, tipografía, espaciados, layouts
- Animaciones y transiciones
- Estructura visual de componentes

**No toques:**
- Lógica de formularios ni integraciones
- Configuración de Vercel (vercel.json)
- Archivos de API

**Para subir tus cambios:**
```
git add -A && git commit -m "design: [describe el cambio]" && git push origin andrea/diseno
```

---

## 📁 Si eres Angela (Assets y Multimedia)

**Tu rama:** `angela/assets`

Al inicio de cada sesión ejecuta:
```
git checkout angela/assets 2>/dev/null || git checkout -b angela/assets
git pull origin angela/assets 2>/dev/null || true
```

**Tu trabajo:** Subir, optimizar e integrar imágenes, videos, logos y otros archivos multimedia.

**Puedes modificar:**
- Archivos en `public/logos/`
- Videos en `public/`
- Imágenes SVG y WebP
- Referencias a archivos multimedia en el HTML

**Formatos aceptados:**
- Logos: SVG con fondo transparente
- Imágenes: WebP o JPG, máximo 300KB
- Videos: MP4, máximo 10MB

**Para subir tus cambios:**
```
git add -A && git commit -m "assets: [describe el cambio]" && git push origin angela/assets
```

---

## 🚀 Si eres Patricio (Tech Lead / PO)

Tienes acceso total. Trabajas directo en `main` o creas ramas por feature.

Para aprobar y publicar los cambios del equipo:
```
git checkout main
git merge libni/cambios    # o andrea/diseno o angela/assets
git push origin main
```

tecnocontrolv.com se actualiza automáticamente en ~30 segundos.

---

## Páginas por construir (18 URLs)

| Estado | Página |
|--------|--------|
| ✅ Lista | Home (/) |
| ✅ Lista | /contacto |
| ✅ Lista | /soluciones/seguridad-patrimonial/rastreo-satelital |
| 🔲 Pendiente | /nosotros |
| 🔲 Pendiente | /blog |
| 🔲 Pendiente | /historias-de-exito |
| 🔲 Pendiente | /soluciones/monitoreo-inteligente |
| 🔲 Pendiente | /soluciones/monitoreo-de-licencia |
| 🔲 Pendiente | /soluciones/videotelemetria-ia |
| 🔲 Pendiente | /soluciones/control-de-combustible |
| 🔲 Pendiente | /soluciones/telemetria-avanzada |
| 🔲 Pendiente | /soluciones/remolques-inteligentes |
| 🔲 Pendiente | /soluciones/gestion-de-flotas |
| 🔲 Pendiente | /soluciones/administracion-mantenimiento |
| 🔲 Pendiente | /sectores/transporte-pesado |
| 🔲 Pendiente | /sectores/distribucion-logistica |
| 🔲 Pendiente | /sectores/movilidad |
| 🔲 Pendiente | /sectores/servicios-financieros |
