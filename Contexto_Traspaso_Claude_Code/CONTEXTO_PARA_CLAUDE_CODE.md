# Contexto completo — Taller "La IA como copiloto de la gestión directiva"

> Este documento está pensado para pegarse en VS Code (como `CLAUDE.md` del proyecto o como primer mensaje a Claude Code) y que la ejecución técnica continúe ahí: creación de las Google Sheets, sitio React, deploy en GitHub Pages y generación de QR. Todo lo de aquí para abajo ya fue decidido con Alejo — no hace falta volver a preguntarlo, solo construirlo.

## 1. Qué es esto

Comité de Cafeteros de Caldas (área de educación) está haciendo un taller de capacitación para rectores de instituciones rurales (metodología Escuela Nueva) sobre cómo la IA ayuda en la gestión directiva. Tiene dos momentos independientes:

- **Momento 1**: una versión simplificada, propia, de la plataforma de resultados de pruebas "Geduka" (ver sección 3), para que cada rector vea los resultados de su institución comparados con el consolidado de Caldas, tome una captura de la gráfica más relevante y la use con un prompt de IA ya redactado (sección 6).
- **Momento 2**: una actividad ya diseñada e independiente ("La IA como copiloto del liderazgo: fortaleciendo la tríada familia–escuela–estudiante", adjunta como `ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx`), con sus propios prompts. Ya está totalmente integrada en la presentación (ver sección 7).

Todo el taller (los dos momentos, con introducción, juego, fundamentación y cierre) está narrado en una presentación web interactiva ya construida y publicada (sección 7). Lo que falta por construir es la **plataforma del Momento 1**: los 13 Google Sheets de datos y el sitio React que cada rector va a abrir desde su enlace.

## 2. Decisiones ya tomadas (no reabrir estas discusiones)

- Acceso por institución: **enlace único sin login**, sin usuario/contraseña ni PIN. Ruta: `/rector/:slug`.
- Datos y hosting: **GitHub Pages + Google Sheets**. Nada de Supabase ni Vercel en este proyecto puntual (si sirve de referencia, el proyecto hermano "Quiero Ser / Quiero Saber + Saber 11" usa el mismo patrón GitHub+Sheets sin login).
- Un **Google Sheet por institución** (13 en total: 12 instituciones + Caldas), nunca un solo Sheet compartido — así, si alguien encuentra la URL de un Sheet por error, solo ve los datos de esa institución, nunca los de las demás.
- Sin backend ni Apps Script para este alcance: el sitio estático lee cada Sheet directamente (API pública de Sheets o export CSV/gviz por pestaña).
- Carpeta de Drive del proyecto (ya creada): **"Capacitación rectores IA"** → https://drive.google.com/drive/folders/1FZCg3Evmt-Cak-BAgfDUzQztlheCKCZs
  - Subcarpeta **"Base de datos"** ya creada dentro de esa carpeta, vacía, lista para recibir los 13 Sheets: https://drive.google.com/drive/folders/1MfOGe6QeXNQO9nRxqOUyecFt8a8cef7s
  - **Importante**: a esa carpeta de Drive solo suben los archivos que la aplicación necesita en producción (los Sheets, `mapa_instituciones.json`, etc.) — nunca documentos de planificación, guías o borradores.
- El juego de apertura de la presentación ("¿Mito o verdad?") se juega preguntando **individualmente a un rector por tarjeta** (el facilitador lo llama por nombre o institución), no votando a mano alzada. Esto ya está reflejado en la presentación y en la guía del capacitador.
- La herramienta de diligenciamiento del Momento 2 (paso 1, donde el rector describe su situación) es **100% digital, nada en papel**. Aún no está construida — ver sección 8 para la recomendación y lo que falta decidir.
- Para pruebas y ejemplos mientras se completan los datos de las 12 instituciones, **usar el correlativo 1 (Giovanni Montini) como institución de ejemplo**, comparado contra Caldas (correlativo 100).

## 3. Plataforma de referencia: Geduka

Geduka es la plataforma existente que se está simplificando (no clonando 1:1 — se le quita gamificación, chatbot, "Plan de Mejora con Roberto" y PDF premium; se deja solo lo que un rector necesita leer en una sesión corta).

- Enlace: https://gedukaangularstorage.z5.web.core.windows.net/#/profesor
- Usuario/contraseña de prueba: `GED_PROF01` / `GED_PROF01` (esta cuenta corresponde al **correlativo 1**, es decir Giovanni Montini)
- Dentro de esa cuenta hay un botón especial en la barra lateral (el ícono redondo, marca "Luker" — patrocinador, no tiene relación funcional con el nombre) que abre un **"Panel Comité de Cafeteros"** con 6 reportes: Acierto Preguntas, Nivel de desempeño, Puntaje Global, Comparativo por Colegios, Promedio Departamental, Reporte Pruebas. Estos son los reportes más parecidos a lo que necesitamos construir.
- Capturas de referencia incluidas en `screenshots/` (todas del panel accedido con GED_PROF01):
  - `geduka_01_inicio_dificultad_pregunta.jpg` — vista base de filtros (grado/materia/ronda).
  - `geduka_02_comparacion_resultados_tarjetas.jpg` — tarjetas por materia con comparación R1→R2 (estilo de tarjeta por color de materia, útil como referencia de layout).
  - `geduka_03_panel_comite_puntaje_global_dist.jpg` — distribución de puntaje global entre colegios (vista Comité, no es la vista por institución individual, pero sirve de referencia de tono visual).
  - `geduka_04_panel_comite_nivel_desempeno_caldas.jpg` — **la más relevante**: barras apiladas de nivel de desempeño (insuficiente/mínimo/satisfactorio/avanzado) por materia, para Correlativo 100 (Caldas). Es exactamente el tipo de gráfico que necesitamos para "Niveles de desempeño por área" en nuestra página.
  - `geduka_05_panel_comite_comparativo_por_materia.jpg` — tarjetas de comparación por materia, una barra por materia con el valor de Caldas.
  - `geduka_06_panel_comite_acierto_preguntas_correlativo1.jpg` y `geduka_08_acierto_preguntas_hover_tooltip.png` — gráfico de acierto por pregunta (MT1...MT25) en verde/amarillo/rojo según dificultad, para el correlativo 1, con tooltip al pasar el mouse (muestra el código de pregunta y su valor). Esta vista es más granular que lo que vamos a mostrar (nosotros resumimos esto en la pestaña calculada "Competencias Débiles", sección 4), pero sirve como referencia del código de colores por dificultad.
  - `geduka_07_detalle_pregunta_competencia_afirmacion_evidencia.png` (pregunta MT21, acierto bajo → tarjeta roja) y `geduka_09_detalle_pregunta_score_alto_verde.png` (pregunta MT1, acierto alto → tarjeta verde) — **referencia directa para el componente "Lo que más pesa mejorar"**: al hacer clic en una barra del gráfico de acierto, Geduka abre una tarjeta "Detalle" con una barra de progreso (score/100) y tres columnas — COMPETENCIA, AFIRMACIÓN, EVIDENCIA — con un color de acento que cambia según el nivel de acierto (rojo si es bajo, verde si es alto). Este es exactamente el patrón visual a replicar para mostrar cada una de las 3 competencias débiles en nuestra página `/rector/:slug`: una tarjeta con acento de color por severidad, más las mismas tres etiquetas (competencia / afirmación / evidencia) que ya trae la pestaña `Competencias Débiles`.

**No replicar**: el asistente "Bot IA", la sección "Premium", el ícono de "PDF Global" con marca de agua, ni el mono/avatar animado — todo eso se excluye de nuestra versión simplificada.

## 4. Fuente de datos original y estado actual

Carpeta `Info_Comite/` (incluida en este paquete): 12 archivos por institución (`COR_1_GIOVANNI_MONTINI.xlsx` … `COR_12_SERAFICO.xlsx`) + 1 archivo consolidado `COR_100_CALDAS.xlsx` (línea base departamental, no es una institución real).

**Estado real ahora mismo: solo se cuenta con 2 de los 13 archivos** — `COR_1_GIOVANNI_MONTINI.xlsx` y `COR_100_CALDAS.xlsx` (ambos incluidos en `Info_Comite/` dentro de este paquete). Los otros 10 (Granada, José Antonio Galán, La Cabaña, La Linda, La Trinidad, La Violeta, Maltería, María Goretti, Miguel Antonio Caro, San Peregrino, Seráfico) **hay que pedírselos a Alejo** antes de poder completar la migración de todas las instituciones. Mientras tanto, construir y probar todo el pipeline y el sitio usando **Giovanni Montini (correlativo 1) vs. Caldas (correlativo 100)** como caso de ejemplo real — no inventar datos de las otras 10 instituciones.

Cada archivo Excel trae 4 hojas, mismas columnas en todos:

| Hoja | Contenido |
|---|---|
| `Resultados por Materia` | 1 fila: puntaje promedio por área (MT, LC, CS, NT, IN) + puntaje global |
| `Estadísticas Preguntas` | 1 fila por pregunta (~120): distribución de respuestas A-E, % de acierto, competencia, afirmación y evidencia evaluada |
| `NV DESEMPEÑO` | Conteo de estudiantes por nivel (insuficiente/mínimo/satisfactorio/avanzado) por área |
| `Detalle Estudiantes (ref)` | 1 fila por estudiante: puntaje y nivel por área + puntaje global |

⚠️ **Cuidado con el archivo de Caldas**: su pestaña `Detalle Estudiantes (ref)` trae el detalle de **todos los estudiantes de todas las instituciones** (con una columna `Colegio`). Esa pestaña **nunca debe copiarse al Sheet de Caldas que se sube a producción** — expondría estudiantes de todas las instituciones en un Sheet que se comparte más abierto. El script de migración (sección 5) ya maneja esto con la bandera `--caldas`.

### Instituciones y slugs para la URL

| Correlativo | Nombre | Slug |
|---|---|---|
| 1 | Giovanni Montini | `giovanni-montini` |
| 2 | Granada | `granada` |
| 3 | José Antonio Galán | `jose-antonio-galan` |
| 4 | La Cabaña | `la-cabana` |
| 5 | La Linda | `la-linda` |
| 6 | La Trinidad | `la-trinidad` |
| 7 | La Violeta | `la-violeta` |
| 8 | Maltería | `malteria` |
| 9 | María Goretti | `maria-goretti` |
| 10 | Miguel Antonio Caro | `miguel-antonio-caro` |
| 11 | San Peregrino | `san-peregrino` |
| 12 | Seráfico | `serafico` |
| 100 | Caldas (consolidado, no es un rector) | — (baseline, no tiene página propia) |

Cada rector recibe únicamente el enlace de su institución: `https://<usuario>.github.io/<repo>/rector/giovanni-montini`, etc.

## 5. Migración a Google Sheets (script ya validado)

`scripts/migrar_institucion_a_sheet.py` (incluido en este paquete) ya está probado end-to-end contra los dos archivos disponibles. Genera un `.xlsx` con las pestañas exactas que necesita cada Sheet de producción:

| Pestaña destino | Origen |
|---|---|
| `Resultados por Materia` | Copia directa |
| `NV Desempeño` | Copia directa |
| `Estadísticas Preguntas` | Copia directa (respaldo completo) |
| `Competencias Débiles` *(nueva, calculada)* | Agrupa `Estadísticas Preguntas` por competencia, promedia `% acierto`, se queda con las 3 más bajas |
| `Detalle Estudiantes` | Copia directa — **excluir siempre en el Sheet de Caldas** (`--caldas`) |

Uso:
```bash
pip install openpyxl
python3 scripts/migrar_institucion_a_sheet.py Info_Comite/COR_1_GIOVANNI_MONTINI.xlsx "Giovanni Montini.xlsx"
python3 scripts/migrar_institucion_a_sheet.py Info_Comite/COR_100_CALDAS.xlsx "Caldas (consolidado).xlsx" --caldas
```

Pasos completos de migración (a ejecutar en Drive, vía API o manualmente):
1. Para cada institución disponible, correr el script y subir el `.xlsx` resultante a `Base de datos/` dentro de "Capacitación rectores IA", convirtiéndolo a Google Sheets nativo.
2. Compartir cada Sheet como **"cualquiera con el enlace: lector"**.
3. Generar `mapa_instituciones.json` con `slug → id del Google Sheet` para los 13 (o los que ya estén listos).
4. Repetir cuando lleguen los 10 archivos restantes.

## 6. Arquitectura del sitio (Momento 1)

- **Frontend estático en React + Vite**, publicado con GitHub Pages (no Vercel para este proyecto).
- Ruta única dinámica `/rector/:slug` (HashRouter, o configurar bien el `404.html` de GitHub Pages para que no falle al recargar). Si el slug no existe en `mapa_instituciones.json`, mostrar "enlace no válido, verifica con el equipo del Comité".
- Página raíz `/`: bienvenida institucional mínima (identidad Comité de Cafeteros de Caldas), sin listar instituciones ni enlaces.
- `<meta name="robots" content="noindex, nofollow">` en las páginas `/rector/:slug`.
- El sitio lee cada Sheet vía la API pública de Google Sheets (API key) o exportación `gviz`/CSV por pestaña — sin backend ni Apps Script.

### Diseño de la página `/rector/:slug`

1. Encabezado: nombre de la institución + "Resultados frente al consolidado de Caldas".
2. Puntaje global: institución vs. Caldas (número grande + indicador arriba/abajo del promedio).
3. Resultados por área (MT, LC, CS, NT, IN): barras agrupadas, institución vs. Caldas.
4. Niveles de desempeño por área: barras apiladas al 100% (ver `geduka_04...jpg` como referencia visual directa de este componente), institución vs. Caldas.
5. "Lo que más pesa mejorar": tarjetas con las 3 competencias más débiles (pestaña `Competencias Débiles`) — nombre de la competencia + afirmación en lenguaje claro, sin el % crudo como protagonista.
6. Detalle por estudiante: sección colapsada, oculta por defecto.
7. Cierre — CTA del taller: instrucciones + botón "📋 Copiar prompt para IA" (prompt completo en sección 8 del plan de arquitectura, o directamente en la presentación web publicada).

Paleta: "gris pizarra + turquesa" (misma dirección ya validada en el proyecto hermano de resultados de pruebas — reutilizar para consistencia visual entre las herramientas internas del Comité). Tipografías sugeridas: Fraunces (títulos), Work Sans (texto), JetBrains Mono (prompts).

## 7. Presentación del taller (ya construida y publicada)

La presentación completa del taller — bienvenida, juego, fundamentación, fórmula del prompt, demo y práctica del Momento 1, y los 4 pasos del Momento 2 — ya está construida como página web interactiva y publicada: **"Copiloto Directivo"**.

- Duración total del taller: **140 minutos (2 h 20)**.
- Ya incluye el prompt completo del Momento 1 y los 3 prompts del Momento 2, con botón de copiar.
- Pendiente en la presentación: la pantalla de códigos QR (una por institución) hoy tiene placeholders "QR pendiente" — hay que generarlos con los enlaces reales una vez el sitio esté publicado, y reemplazarlos.
- También pendiente: agregar a esa misma pantalla (o a la del Momento 2 · Paso 1) el enlace/QR de la herramienta digital del Momento 2 (ver sección 8).

## 8. Pendiente de definir: herramienta digital del Momento 2 (paso 1)

Alejo confirmó que esta herramienta (donde el rector describe su situación real y formula su "desafío de liderazgo") debe ser **100% digital, sin nada en papel**. Como el resto del proyecto ya usa Google Sheets sin backend, la opción más simple y consistente es un **Google Form** cuyas respuestas caigan automáticamente en un Google Sheet — no requiere Apps Script ni backend nuevo. Preguntas sugeridas para el Form (del guion ya definido):

1. Institución / nombre del rector.
2. Situación elegida (o campo abierto): baja participación de familias, deserción, desmotivación, bajo acompañamiento familiar, conflictos, poca participación estudiantil, etc.
3. ¿Qué está ocurriendo?
4. ¿A quién afecta?
5. ¿Qué estamos haciendo actualmente?
6. ¿Qué no está funcionando?
7. ¿Qué necesitaríamos cambiar?
8. Su desafío de liderazgo: "¿Cómo podría transformar ______ para lograr que ______?"

Falta: crear el Form real (2 minutos en forms.google.com), y agregar su enlace/QR a la presentación (pantalla de Momento 2 · Paso 1).

## 9. Archivos incluidos en este paquete

- `Info_Comite/` — los 2 archivos Excel de origen disponibles (Giovanni Montini y Caldas).
- `scripts/migrar_institucion_a_sheet.py` — script de migración ya validado.
- `screenshots/` — 6 capturas de referencia de Geduka (sección 3).
- `ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx` — diseño original completo del Momento 2.
- `Plan_Momento1_Plataforma_Resultados.md` — plan de arquitectura detallado (versión previa de este mismo contexto, con más detalle narrativo).
- `Guia_Capacitador_Taller_IA_Rectores.docx` — guía paso a paso para quien facilite el taller.
- `presentacion_index.html` — código fuente de la presentación web ya publicada ("Copiloto Directivo"), por si se necesita seguir editándola desde VS Code en vez de aquí.

## 10. Próximos pasos, en orden

1. Correr el script de migración contra Giovanni Montini y Caldas, subir esos 2 Sheets a `Base de datos/` en Drive, compartirlos como lector, y generar un `mapa_instituciones.json` inicial con esos 2.
2. Pedirle a Alejo los 10 archivos Excel restantes; repetir la migración para cada uno a medida que lleguen.
3. Scaffoldear el sitio React + Vite con la ruta `/rector/:slug`, usando Giovanni Montini como caso de prueba real contra Caldas.
4. Publicar con GitHub Pages; generar los 12 enlaces reales.
5. Generar los 12 códigos QR y reemplazar los placeholders en la pantalla 8 de la presentación (republicar el artifact con `presentacion_index.html` actualizado).
6. Crear el Google Form del Momento 2 · Paso 1 (sección 8) y agregar su enlace/QR a la presentación.
