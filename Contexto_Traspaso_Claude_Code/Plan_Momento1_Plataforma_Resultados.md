# Taller "La IA como copiloto de la gestión directiva" — Momento 1
## Plan y arquitectura: plataforma de resultados por institución

> **Estado: en estructuración.** Este documento es solo planificación — no se ha creado ningún Google Sheet, ni repositorio de GitHub, ni deploy. Se ejecuta únicamente cuando Alejo lo confirme.

Documento de planificación para pasar a implementación en VS Code + Claude Code. Cubre: modelo de acceso, estructura de datos, arquitectura técnica, diseño de la página por institución, el prompt de IA para los rectores, y la presentación interactiva del taller (ya construida y publicada).

**Decisiones tomadas con Alejo:**
- Acceso por institución: **enlace único sin login** (sin usuario/contraseña, sin PIN).
- Datos y hosting: **GitHub (Pages) + Google Sheets** — sin Supabase ni Vercel para este proyecto puntual (distinto de tu stack estándar, igual que en el proyecto hermano de Quiero Ser/Quiero Saber + Saber 11).
- Toda la información del proyecto se aloja en esta carpeta de Drive: **"Capacitación rectores IA"** — https://drive.google.com/drive/folders/1FZCg3Evmt-Cak-BAgfDUzQztlheCKCZs (carpeta nueva, vacía por ahora).
- Presentación de apoyo: **página web interactiva construida con código** (no slides clásicas ni .pptx) — ya publicada, ver sección 6.
- El taller se extiende a **~2 h 20** (no 2 h exactas) para dar espacio al juego de apertura, la fundamentación sobre IA y la lección de prompt que se agregaron al inicio.
- Los documentos de planificación (este plan y la guía del capacitador) **no se suben a la carpeta de Drive** — esa carpeta es solo para lo que la aplicación necesita en producción (Sheets, mapa de instituciones, etc.).
- Alcance de esta entrega: **plan y arquitectura**, más la presentación del taller ya construida (estructura de datos, diseño de páginas/flujo, prompt de IA ya redactado, y presentación interactiva).

---

## 1. Fuente de datos original

Carpeta local `Info_Comite/`: 12 archivos por institución (`COR_1_GIOVANNI_MONTINI.xlsx` … `COR_12_SERAFICO.xlsx`) + 1 archivo consolidado `COR_100_CALDAS.xlsx` que sirve como **línea base de comparación** (no es una institución real, es el agregado departamental).

Cada archivo trae 4 hojas, mismas columnas en todos:

| Hoja | Contenido |
|---|---|
| `Resultados por Materia` | 1 fila: puntaje promedio por área (MT, LC, CS, NT, IN) + puntaje global |
| `Estadísticas Preguntas` | 1 fila por pregunta: distribución de respuestas (A-E), % de acierto, competencia, afirmación y evidencia evaluada |
| `NV DESEMPEÑO` | Conteo de estudiantes por nivel (insuficiente/mínimo/satisfactorio/avanzado) por área |
| `Detalle Estudiantes (ref)` | 1 fila por estudiante: puntaje y nivel por área + puntaje global |

Áreas: MT=Matemáticas, LC=Lectura Crítica, CS=Sociales, NT=Naturales, IN=Inglés.

### Instituciones y slugs propuestos (para la URL en GitHub Pages)

| Correlativo | Nombre | Slug de URL |
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
| 100 | Caldas (consolidado, no es un rector) | — (hoja/archivo aparte, solo como baseline) |

Cada rector recibe únicamente el enlace de su institución: `https://<usuario>.github.io/<repo>/rector/giovanni-montini`, etc.

---

## 2. Arquitectura de datos: Google Sheets

### 2.1 Por qué un Sheet por institución (y no uno solo con todo)

Si toda la información viviera en **un único** Google Sheet compartido "cualquiera con el enlace", cualquier rector que abra las herramientas de desarrollador del navegador podría encontrar la URL de ese Sheet y ver los datos — incluyendo nombres de estudiantes — **de todas las demás instituciones**, no solo la suya. Eso rompe el requisito de "cada institución ve solo su información".

Por eso la estructura recomendada es: **un Google Sheet independiente por institución** (13 en total: 12 instituciones + Caldas), igual que ya están separados los Excel de origen. Así, aunque alguien encuentre la URL de un Sheet, solo verá los datos de esa institución puntual — el mismo nivel de exposición que ya se acepta con el enlace único sin login.

El Sheet de `Caldas` (consolidado) no tiene nombres de estudiantes, así que es el único que se puede referenciar de forma un poco más abierta si hiciera falta (por ejemplo, para mostrar el promedio departamental en varias páginas).

### 2.2 Estructura dentro de la carpeta de Drive

```
Capacitación rectores IA/               (carpeta ya creada)
  Base de datos/
    Giovanni Montini.xlsx  → convertido a Google Sheet
    Granada.xlsx           → convertido a Google Sheet
    ... (una hoja de cálculo por institución)
    Caldas (consolidado).xlsx → convertido a Google Sheet
  mapa_instituciones.xlsx (o .gsheet)   # slug, nombre, correlativo, ID del Sheet correspondiente
```

### 2.3 Pestañas dentro de cada Google Sheet de institución

Migración casi 1:1 de las hojas del Excel original, más una pestaña nueva ya calculada para no repetir lógica en el frontend:

| Pestaña | Contenido | Origen |
|---|---|---|
| `Resultados por Materia` | Igual al Excel original | Copia directa |
| `NV Desempeño` | Igual al Excel original | Copia directa |
| `Estadísticas Preguntas` | Igual al Excel original (se conserva completa por si se necesita a futuro) | Copia directa |
| `Competencias Débiles` *(nueva)* | 3 filas: materia, competencia, % acierto promedio, afirmación, evidencia — las 3 competencias con menor acierto | Calculada al migrar |
| `Detalle Estudiantes` | Igual al Excel original | Copia directa (solo existe en los Sheets de institución, **no** en el de Caldas) |

`Competencias Débiles` se calcula agrupando las ~120 filas de `Estadísticas Preguntas` por `competencia`, promediando `% acierto`, y quedándose con las 3 más bajas. Esto reemplaza la vista pregunta-por-pregunta de Geduka (demasiado técnica para una sesión de 15-20 minutos con rectores) sin perder el detalle original en la pestaña de respaldo.

### 2.4 Cómo lee los datos el sitio (GitHub Pages)

- El repo en GitHub guarda un archivo `mapa_instituciones.json` (generado desde `mapa_instituciones.xlsx`) con `slug → id del Google Sheet`.
- Cada Sheet se comparte como "cualquiera con el enlace: lector".
- La página `/rector/:slug` del sitio estático:
  1. Busca el `slug` en `mapa_instituciones.json`.
  2. Pide las pestañas necesarias del Sheet correspondiente vía la API pública de Google Sheets (lectura con API key, o exportación `gviz`/CSV por pestaña — a decidir en la implementación, ambas sirven sin backend).
  3. Hace lo mismo con el Sheet de `Caldas` para las comparaciones.
- **No hace falta backend ni Apps Script** para este alcance (13 vistas de solo lectura, sin panel interno consolidado). Si más adelante el Comité quiere un panel general que cruce las 12 instituciones a la vez (como sí existe en el proyecto de Quiero Ser/Quiero Saber + Saber 11), ahí sí conviene copiar ese patrón de Apps Script con token maestro — se deja anotado como posible fase 2, no es necesario ahora.

### 2.5 Migración Excel → Google Sheets

Pasos (se ejecutan solo cuando confirmes):
1. Subir los 13 Excel de `Info_Comite/` a la subcarpeta `Base de datos/` dentro de "Capacitación rectores IA" en Drive.
2. Convertir cada uno a Google Sheets nativo (Drive lo hace directamente, o vía API al subirlos).
3. Añadir la pestaña `Competencias Débiles` calculada en cada uno (script único que recorre los 13 archivos).
4. Compartir cada Sheet como "cualquiera con el enlace: lector".
5. Generar `mapa_instituciones.json` con los 13 IDs de Sheet.

---

## 3. Arquitectura técnica del sitio

- **Frontend estático en React + Vite**, publicado con **GitHub Pages** (no Vercel para este proyecto).
- **Ruteo**: una sola ruta dinámica `/rector/:slug` (con `HashRouter` o configurando bien el 404.html de GitHub Pages para que las rutas no den error al recargar).
  - Si el slug no existe en `mapa_instituciones.json`, pantalla de "enlace no válido, verifica con el equipo del Comité".
- **Sin autenticación**: el control de acceso es el enlace mismo (no listado, no indexado) + el hecho de que cada Sheet solo contiene su propia institución. Suficiente para un taller puntual y cerrado.
- **Página raíz `/`**: pantalla mínima de bienvenida institucional (identidad Comité de Cafeteros de Caldas) por si alguien entra sin slug — no debe listar ahí las instituciones ni sus enlaces.
- **`<meta name="robots" content="noindex, nofollow">`** en las páginas `/rector/:slug`, para que no queden rastreables por buscadores aunque el repo/sitio sea público.

---

## 4. Diseño de la página por institución (`/rector/:slug`)

Simplificada respecto a Geduka: se elimina la gamificación (mascotas, "Plan de Mejora con Roberto", chatbot, PDF premium) y se deja solo lo que un rector necesita leer en una sesión corta, siempre comparado con Caldas.

1. **Encabezado**: nombre de la institución + "Resultados frente al consolidado de Caldas". Identidad visual propia del Comité (no la de Geduka).
2. **Puntaje global**: institución vs. Caldas, como número grande + indicador simple (arriba/abajo del promedio).
3. **Resultados por área** (MT, LC, CS, NT, IN): gráfico de barras agrupadas, institución vs. Caldas — más legible para este público que un radar.
4. **Niveles de desempeño por área**: barras apiladas al 100% (insuficiente/mínimo/satisfactorio/avanzado), institución vs. Caldas, una fila por área.
5. **Lo que más pesa mejorar**: tarjetas con las 3 competencias más débiles (`Competencias Débiles`) — nombre de la competencia + afirmación en lenguaje claro, sin el % crudo de acierto como protagonista.
6. **Detalle por estudiante**: sección colapsada ("Ver detalle por estudiante ▾"), oculta por defecto.
7. **Cierre de la vista — CTA del taller**: recuadro con las instrucciones y el botón "📋 Copiar prompt para IA" (ver sección 5).

Paleta sugerida: la misma dirección "gris pizarra + turquesa" que ya validaste para el panel de Quiero Ser/Quiero Saber y Saber 11 — mantiene una identidad visual consistente entre tus herramientas internas y ya pasó por tu revisión de diseño. Se puede ajustar sin tocar la arquitectura.

---

## 5. El prompt de IA para los rectores

Instrucción en pantalla antes del prompt:

> 1. Tomen una captura de pantalla de la gráfica o tarjeta que más les llame la atención (positiva o negativamente).
> 2. Copien el siguiente prompt con el botón de abajo.
> 3. Péguenlo junto con la imagen en su IA de preferencia (ChatGPT, Claude, Gemini, Copilot...).
> 4. Lean la respuesta y coméntenla con la persona de al lado antes de la puesta en común.

Prompt (texto completo, listo para el botón "copiar"):

```
Actúa como un asesor experto en gestión directiva educativa y uso pedagógico de resultados de pruebas estandarizadas, con experiencia en instituciones educativas rurales que trabajan bajo el modelo Escuela Nueva.

Te voy a compartir una captura de pantalla con resultados de pruebas de mi institución educativa (puede ser un puntaje por área, un nivel de desempeño, o una comparación con el promedio del departamento). Yo soy el rector o la rectora de esta institución.

Antes de darme una solución, ayúdame a leer e interpretar la información paso a paso:

1. Describe, en un lenguaje claro y sin tecnicismos estadísticos, qué muestra exactamente la imagen: qué área o competencia se evalúa, cómo se compara mi institución frente al promedio de referencia, y qué tan grande es esa diferencia.
2. Identifica las causas más probables de ese resultado, mirándolas por separado desde:
   - el estudiante (motivación, hábitos de estudio, comprensión de la competencia evaluada);
   - el docente y la práctica pedagógica (estrategias de enseñanza, énfasis curricular, acompañamiento);
   - la gestión institucional (tiempo dedicado al área, recursos, articulación entre sedes, particularidades del modelo Escuela Nueva en mi institución).
3. Señala qué preguntas debería hacerme como rector o rectora antes de decidir una estrategia, para no tomar decisiones apresuradas con información incompleta.

Con base en ese análisis, y solo después de haberlo hecho, propón:

4. Tres estrategias concretas de mejoramiento: una enfocada en el trabajo con los estudiantes, otra en el acompañamiento y desarrollo de los docentes, y una tercera de gestión institucional que yo pueda liderar directamente. Para cada una indica: propósito, acciones concretas y realistas para una institución rural (recursos limitados, posibles aulas multigrado), responsables, tiempo estimado de implementación, y un indicador simple para saber si está funcionando.
5. Cierra con una recomendación breve de cómo debería socializar estas estrategias y hacerles seguimiento con mi equipo docente en una reunión de la próxima semana.

Sé específico, evita respuestas genéricas de manual, y ten siempre presente que trabajo bajo el modelo pedagógico Escuela Nueva, con población rural.
```

---

## 6. Presentación de apoyo del taller — página web interactiva (ya construida)

Alejo pidió que la presentación fuera web, con código, llamativa e interactiva — no slides clásicas. Se construyó como una página HTML autocontenida (navegación por diapositivas con flechas del teclado, botones y puntos de progreso) y se publicó como Artifact: **"Copiloto Directivo"**.

Contiene, en este orden, 14 pantallas:

1. Portada
2. Bienvenida y objetivo (10 min)
3. Juego "¿Mito o verdad?" — 8 tarjetas volteables sobre IA en la gestión educativa, pensado para votar a mano alzada, sin depender de conectividad (10 min)
4. Fundamentación breve: "¿Qué es realmente la inteligencia artificial?", en lenguaje humano y sin tecnicismos (8 min)
5. "La fórmula de un buen prompt": Rol – Contexto – Tarea – Formato, con el prompt del Momento 1 desglosado y resaltado por colores como ejemplo (12 min)
6. Momento 1 — demo en vivo usando el panel de Caldas como ejemplo ilustrativo (8 min)
7. Momento 1 — instrucciones de práctica individual + el prompt completo con botón de copiar (15 min)
8. Momento 1 — cuadrícula de códigos QR por institución (**pendiente**: hoy son placeholders "QR pendiente"; se completan con los QR reales cuando el sitio esté publicado — ver sección 9)
9. Transición al Momento 2 (2 min)
10. Momento 2 · Paso 1 — ¿dónde está hoy mi tríada? (12 min)
11. Momento 2 · Paso 2 — pregúntele a la IA lo que no está viendo, con su prompt (8 min)
12. Momento 2 · Paso 3 — el reto, con su prompt y los 3 criterios (Pertinencia/Viabilidad/Transformación) (30 min, tiempo oficial)
13. Momento 2 · Paso 4 — mi estrategia 3×3, en 4 cuadrantes + frase de cierre (20 min, tiempo oficial)
14. Cierre general (5 min)

Línea de tiempo resultante (~2 h 20, no 2 h exactas — decisión de Alejo de extender el taller en vez de recortar contenido):

| Bloque | Duración |
|---|---|
| Bienvenida | 10 min |
| Juego "¿Mito o verdad?" | 10 min |
| Fundamentación | 8 min |
| Fórmula del prompt | 12 min |
| Momento 1 — demo | 8 min |
| Momento 1 — práctica | 15 min |
| Transición | 2 min |
| Momento 2 · Paso 1 | 12 min |
| Momento 2 · Paso 2 | 8 min |
| Momento 2 · Paso 3 | 30 min |
| Momento 2 · Paso 4 | 20 min |
| Cierre | 5 min |
| **Total** | **140 min (2 h 20)** |

Diseño: paleta "gris pizarra + turquesa" (misma dirección ya validada en el proyecto hermano de Quiero Ser/Quiero Saber + Saber 11), tipografías Fraunces (títulos) + Work Sans (texto) + JetBrains Mono (los prompts, en formato de bloque de código con botón de copiar). Funciona en modo claro y oscuro.

---

## 8. Momento 2 — ya definido (actividad independiente)

Alejo confirmó que el Momento 2 **no** es continuación del panel de resultados: es una actividad distinta, ya diseñada en `ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx` (carpeta `Prueba de entrada Geduka`), titulada **"La IA como copiloto del liderazgo: fortaleciendo la tríada familia–escuela–estudiante"**. Resumen de su estructura (4 pasos, con tiempos):

1. **Punto de partida — "¿Dónde está hoy mi tríada?"**: el rector elige una situación real de su institución sobre la relación familia-escuela-estudiante (baja participación de familias, deserción, desmotivación, etc.), la diligencia en una herramienta con 5 preguntas guía, y la formula como un desafío de liderazgo ("¿Cómo podría transformar ___ para lograr que ___?").
2. **"Pregúntele a la IA lo que yo todavía no estoy viendo"**: introduce su situación en una IA con un prompt ya redactado (rol de asesor en liderazgo educativo, analiza sin dar solución todavía, desde las 3 perspectivas: estudiante, familia, escuela).
3. **"Diseño una solución para los tres, no para uno" (30 min)**: le pide a la IA tres alternativas de estrategia (cada una con acciones para los 3 actores), y las compara con 3 criterios ya definidos en una tabla: Pertinencia, Viabilidad, Transformación.
4. **Producto final — "Mi estrategia 3×3" (20 min)**: construye una ruta con 3 acciones por actor (estudiante, familia, escuela) más un apartado de "IA como apoyo" para sostener/seguir la estrategia.

Ya está redactado y con sus propios prompts, y su contenido quedó integrado en la presentación web única del taller (pantallas 10-13 de la sección 6). Queda pendiente solo: si la "herramienta" de diligenciamiento que menciona el paso 1.b se queda en papel/Word o se digitaliza, y con qué formato.

---

## 9. Próximos pasos (la parte técnica no se ejecuta todavía)

1. Validar este plan y la presentación (ajustar secciones del panel, paleta, estructura de Sheets, el prompt, o cualquier contenido de la presentación si algo no calza con la dinámica real del taller).
2. Cuando confirmes: subir y convertir los 13 Excel a Google Sheets dentro de "Capacitación rectores IA" → `Base de datos/`, y generar la pestaña `Competencias Débiles` en cada uno.
3. Generar `mapa_instituciones.json` con los 13 IDs de Sheet.
4. Implementar el sitio React en VS Code + Claude Code, usando este documento como contexto (`CLAUDE.md` o similar) y un repo nuevo en GitHub.
5. Publicar con GitHub Pages, generar y repartir los 12 enlaces.
6. Con los enlaces ya reales, generar los 12 códigos QR y reemplazar los placeholders de la pantalla 8 de la presentación.
7. Definir si la "herramienta" de diligenciamiento del Momento 2 (paso 1.b) se queda en papel/Word o se digitaliza, y con qué formato.
