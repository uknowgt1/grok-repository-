# Modelos 3D — Fuego y Sangre

Coloca aquí tus exportaciones de Blender:

| Archivo       | Descripción                          |
|---------------|--------------------------------------|
| `castle.glb`  | Castillo / fortaleza volcánica       |
| `dragon.glb`  | Dragón (idealmente con animaciones)  |

## Exportar desde Blender

1. Selecciona el objeto (y armatures/animaciones si aplica).
2. **File → Export → glTF 2.0 (.glb/.gltf)**
3. Formato: **glTF Binary (.glb)** recomendado.
4. Incluye: Materials, Animations (si hay), Apply Modifiers.
5. Guarda como `castle.glb` o `dragon.glb` en esta carpeta.

## Notas

- Si los archivos no existen, la escena usa **mallas procedurales** de respaldo.
- Rutas en código: `./assets/models/castle.glb` y `./assets/models/dragon.glb`
  (busca el comentario `// PLACEHOLDER:` en `js/main.js`).
- Para animaciones del dragón, nombra un clip `idle` o `fire` (o ajusta el nombre
  en `main.js` donde se indica).

Tamaño sugerido: escala el modelo en Blender para que el castillo ~15–30 unidades
y el dragón ~5–12 unidades en Three.js, o ajusta `scale` tras la carga.
