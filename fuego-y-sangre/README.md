# Fuego y Sangre

Experiencia WebGL inmersiva inspirada en *House of the Dragon* / Casa Targaryen.
Three.js estático (sin build): escena oscura, castillo, dragón, partículas de ceniza,
OrbitControls y raycasting interactivo.

## Cómo ejecutar en local

Sirve la carpeta por HTTP (los módulos ES y el importmap no funcionan con `file://`):

```bash
# Opción A
npx serve .

# Opción B
python3 -m http.server 8080
```

Luego abre `http://localhost:3000` (serve) o `http://localhost:8080` en el navegador.

**Requisitos:** navegador moderno con WebGL. Conexión a internet la primera vez
(CDN de Three.js @0.160.0 vía unpkg + Google Fonts).

## Estructura

```
fuego-y-sangre/
├── index.html
├── css/styles.css
├── js/main.js
├── assets/models/
│   ├── README.md
│   ├── castle.glb   ← opcional (Blender)
│   └── dragon.glb   ← opcional (Blender)
└── README.md
```

## Dónde poner exports de Blender

Coloca:

- `assets/models/castle.glb`
- `assets/models/dragon.glb`

Si faltan, el código construye un **castillo de piedra volcánica** y un **dragón
procedural** automáticamente. Busca en `js/main.js`:

```js
// PLACEHOLDER: replace path with your Blender .gltf/.glb export
```

## Interacción

| Acción              | Efecto                                              |
|---------------------|-----------------------------------------------------|
| Arrastrar           | Orbitar cámara (límites polar / distancia)          |
| Clic en dragón      | Pulso emissive naranja/rojo (aliento de fuego)      |
| Clic en castillo    | Modal pergamino con lore «Fuego y Sangre»           |
| Escape / backdrop   | Cierra el modal                                     |

## Personalizar Raycaster / animaciones

En `js/main.js`, sección marcada:

```js
// RAYCASTER: modify interaction logic here
```

Ahí se decide qué hacer al hacer clic (`dragon` → fuego, `castle` → modal).

Para animaciones GLTF:

1. Exporta clips desde Blender (`idle`, `fire`, etc.).
2. El código crea un `AnimationMixer` si hay clips y reproduce el primero / idle.
3. Para el aliento de fuego, busca el comentario sobre el nombre del clip `fire`
   y cámbialo al nombre exacto de tu animación.

## Luces y atmósfera

- `DirectionalLight` cálida (naranja/rojo) + sombras
- Ambient + Hemisphere
- 3–4 `PointLight` tipo antorchas cerca del castillo
- Sistema de partículas de ceniza (`THREE.Points`)
- Fog y fondo rojo oscuro / ceniza

## Licencia / créditos

Proyecto demo educativo. Three.js (MIT). Tipografías: Cinzel & Cormorant Garamond
(Google Fonts). Inspirado en la atmósfera de *House of the Dragon*; no afiliado a HBO.
