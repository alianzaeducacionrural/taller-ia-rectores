# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A local Git repo (no remote configured yet) containing planning docs, source data, and the **"Momento 1"** web app itself, in `site/` — a simplified, read-only clone of the "Geduka" test-results platform, built so that each school principal (rector) can see their institution's results compared against the Caldas department baseline.

Read `Contexto_Traspaso_Claude_Code/CONTEXTO_PARA_CLAUDE_CODE.md` first — it is the authoritative, up-to-date context doc and supersedes `Plan_Momento1_Plataforma_Resultados.md` (an earlier draft kept for narrative detail only). Do not re-litigate decisions already marked as settled in that doc.

## Decisions already locked in (do not re-open)

- **No login**: access is a single unguessable link per institution, route `/rector/:slug`. No username/password/PIN. `/taller` and `/panel-facilitador` (see below) follow the same model — unguessable route instead of auth.
- **Results ("Momento 1") hosting**: GitHub Pages (static site) + Google Sheets as the data store, read-only via gviz — **no backend for reading results**. This part of the original "no Apps Script" decision still holds for `/rector/:slug`.
- **The `/taller` + `/panel-facilitador` tool (added later) does use a Google Apps Script Web App** — this supersedes the original "no Apps Script at all" line for that one piece, because it needs to *write* (rector submissions) and *send email*, which a static site + read-only Sheets can't do. See "The taller tool" section below. Nothing else in the architecture changed: still no Supabase, no Vercel, no server you have to run.
- **One Google Sheet per institution** (13 total: 12 schools + 1 baseline), never a single shared Sheet — this bounds the blast radius if a Sheet URL leaks (a rector could otherwise see every other school's data, including student names).
- **Baseline naming: data says "Caldas", UI says "Manizales".** The consolidated baseline file/slug/correlativo-100 institution is still internally `caldas` everywhere (source file `COR_100_CALDAS.xlsx`, slug `caldas`, `esBaseline: true`, CSS vars like `--color-caldas`) — only user-facing text was relabeled to "Manizales" (page copy, chart legends, the presentation). Don't rename the internal `caldas` identifiers; only touch display strings if asked to adjust this further.
- **Frontend**: React + Vite, static, deployed to GitHub Pages. Routes: `/` (welcome), `/rector/:slug`, `/taller`, `/panel-facilitador` (all via `HashRouter`, so no `404.html` needed). Unknown `/rector/:slug` → "enlace no válido" message. Root `/` never lists institutions or links. `<meta name="robots" content="noindex, nofollow">` site-wide (in `index.html`).
- **Palette/type**: "gris pizarra + turquesa" for the site. Fraunces for headings, Work Sans for body, JetBrains Mono for the copyable AI prompts. The presentation (`presentacion_index.html`) has its own related-but-separate palette with a per-slide color identity — see "The presentation" below.
- **Caldas sheet caveat**: the Caldas source workbook's `Detalle Estudiantes (ref)` tab contains every student from every institution (with a `Colegio` column). That tab must **never** be copied into the production Caldas Sheet — the migration script already enforces this via `--caldas`.
- Only 2 of 13 source institution files currently exist (Giovanni Montini = correlativo 1, Caldas = correlativo 100). Build and test the whole pipeline/site against this pair; do not fabricate data for the other 10 institutions. The remaining files must come from Alejo.
- Momento 2 is a separate, already-designed activity (see `ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx`), fully scripted into the workshop presentation **and** now also digitized end-to-end in `/taller` (situación, 5 preguntas guía, desafío de liderazgo, estrategia 3×3) — the "digitize Paso 1 as a Google Form" idea from the original plan was superseded by building `/taller` instead.
- **Design priority is desktop/PC-first** for everything, but `/rector/:slug` and `/taller` (the two rector-facing tools) must still work well on a phone — the presentation does not need to (it's driven from the facilitator's laptop/projector).

## Repository layout

```
site/                                          # the React + Vite app (see "The site" below)
apps-script/                                   # Google Apps Script backend for /taller — Code.gs, appsscript.json (see "The taller tool")
Info_Comite/                                  # source-of-truth Excel exports from Geduka, one per institution + COR_100_CALDAS.xlsx
Contexto_Traspaso_Claude_Code/
  CONTEXTO_PARA_CLAUDE_CODE.md                # primary context doc — read this first
  Plan_Momento1_Plataforma_Resultados.md      # earlier draft of the same plan, more narrative detail
  Info_Comite/                                # duplicate copy of the 2 currently-available source files
  scripts/migrar_institucion_a_sheet.py       # validated Excel → Sheets-ready workbook migration script (produces the .xlsx uploaded to Drive)
  screenshots/                                # reference captures of the Geduka platform being simplified
  presentacion_index.html                     # source of the published interactive workshop presentation ("Copiloto Directivo")
  ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx       # full Momento 2 activity design
  Guia_Capacitador_Taller_IA_Rectores.docx    # facilitator's step-by-step guide
```

## Source data shape

Each `Info_Comite/COR_<n>_<NOMBRE>.xlsx` has 4 sheets with identical columns across all files:

| Sheet | Contents |
|---|---|
| `Resultados por Materia` | 1 row: average score per area (MT, LC, CS, NT, IN) + global score |
| `Estadísticas Preguntas` | 1 row per question (~120): A–E answer distribution, `% acierto`, `competencia`, `afirmacion`, `evidencia` |
| `NV DESEMPEÑO` | student counts by performance level (insuficiente/mínimo/satisfactorio/avanzado) per area |
| `Detalle Estudiantes (ref)` | 1 row per student: score + level per area + global score |

Areas: MT=Matemáticas, LC=Lectura Crítica, CS=Sociales, NT=Naturales, IN=Inglés.

Institution → slug map (12 schools + correlativo 100 = Caldas baseline, no page of its own) is documented in full in `CONTEXTO_PARA_CLAUDE_CODE.md` §4.

## Migration script

`Contexto_Traspaso_Claude_Code/scripts/migrar_institucion_a_sheet.py` converts one source Excel into the workbook shape needed for production Google Sheets, adding a new computed tab `Competencias Débiles` (groups `Estadísticas Preguntas` by `(materia, competencia)`, averages `% acierto`, keeps the 3 weakest).

```bash
pip install openpyxl

# Regular institution (includes Detalle Estudiantes)
python3 scripts/migrar_institucion_a_sheet.py Info_Comite/COR_1_GIOVANNI_MONTINI.xlsx "Giovanni Montini.xlsx"

# Caldas consolidated file — always pass --caldas to exclude Detalle Estudiantes
python3 scripts/migrar_institucion_a_sheet.py Info_Comite/COR_100_CALDAS.xlsx "Caldas (consolidado).xlsx" --caldas
```

Output tabs: `Resultados por Materia`, `NV Desempeño`, `Estadísticas Preguntas`, `Competencias Débiles` (computed), `Detalle Estudiantes` (omitted when `--caldas` is passed).

## The site (`site/`)

React 19 + TypeScript + Vite, routed with `react-router-dom`'s `HashRouter` (`/#/rector/:slug`, `/#/` welcome, everything else redirects to `/`). Charts via `recharts`. No backend — see "Decisions already locked in" above.

**Commands** (run from `site/`):
```bash
npm run dev              # dev server (uses VITE_DATA_SOURCE=local by default)
npm run build             # tsc -b && vite build — BLOCKED unless VITE_DATA_SOURCE=sheets (see below)
npm run lint               # oxlint
npx tsc -b                 # typecheck only
node scripts/generar-datos-locales.mjs   # regenerate local dev data from ../Info_Comite/*.xlsx
```
There is no test suite yet.

### Data layer: local JSON now, Google Sheets later — same interface either way

The 13 production results Sheets don't exist yet — unlike the taller-tracking Sheet (see "The taller tool" below), which does exist now that `clasp` is authenticated on this machine; creating the 13 results Sheets from the Excel files is just a separate task nobody's done yet, not a credentials blocker. `src/data/fuenteDatos.ts` is the **only** module the app talks to for data (`obtenerMapaInstituciones()`, `obtenerDatosInstitucion(slug)`); no component or page imports JSON or calls `fetch` directly. It switches implementation based on `VITE_DATA_SOURCE` (`.env`, default `local`):
- `local` — dynamically imports `src/data/instituciones/<slug>.json`, generated by `node scripts/generar-datos-locales.mjs` from `Info_Comite/COR_1_GIOVANNI_MONTINI.xlsx` and `COR_100_CALDAS.xlsx` (the only 2 of 13 institution files that exist so far — same constraint as before, do not fabricate the other 10).
- `sheets` — `src/data/fuenteSheets.ts` fetches each tab of the real Google Sheet via the public gviz endpoint (`docs.google.com/spreadsheets/d/<id>/gviz/tq?...`), no API key, no backend, matching the architecture decision. Needs `sheetId` filled in per institution in `src/data/mapaInstituciones.json`.

**Privacy guardrail — do not weaken without understanding why:** `src/data/instituciones/*.json` and `src/data/mapaInstitucionesLocal.json` contain real student names (from `Detalle Estudiantes`) and are gitignored — they must never reach git or a shipped bundle. `vite.config.ts` hard-fails `npm run build` unless `VITE_DATA_SOURCE=sheets` (or the explicit escape hatch `VITE_ALLOW_LOCAL_BUILD=true` for a local-only test build that will *not* be deployed), specifically so a GitHub Pages deploy can never accidentally bundle student names. `src/data/mapaInstituciones.json` (no "Local" suffix) is the **committed**, production slug→sheetId map — it holds no student data, only names/correlativos/sheetId (currently all `null`), and is hand-edited as real Sheets go live, not regenerated by the script.

`InstitucionData` (see `src/data/tiposInstitucion.ts`) also carries `estadisticasPreguntas` — the full per-question `Estadísticas Preguntas` tab (~120 rows, both for an institution and for the Manizales baseline), used by the `AciertoPorPreguntas` component (per-area bar chart, click a bar for its competencia/afirmación/evidencia). This is separate from — and more granular than — `competenciasDebiles` (the precomputed top-3-weakest tab); both are shown on `/rector/:slug`.

### The `/rector/:slug` page sections, in order

`Encabezado` → `PuntajeGlobal` → `ResultadosPorArea` (grouped bars) → `NivelesDesempeno` (100%-stacked bars) → `CompetenciasDebiles` (top-3 weakest, card per competencia) → `AciertoPorPreguntas` (full per-question chart, click for detail) → `DetalleEstudiantes` (collapsed by default; sortable/filterable table, defaults to sorting by lowest global score first so at-risk students surface for the rector) → `CtaPrompt` (copy the Momento 1 AI prompt).

### The taller tool (`/taller` + `/panel-facilitador`)

A general (not per-institution) link that walks any rector through both moments live during the workshop, collecting what they produce — this is a second piece of the app, separate from the read-only `/rector/:slug` results pages, and it's the one part of this project that needs a write path.

- **`/taller`** (`site/src/pages/TallerRector.tsx`): a single-page step machine — identificación (nombre, email, institución) → Momento 1 (instructions + AI prompt + "ya usé la IA" check-in) → espera de indicación del facilitador → Momento 2 Pasos 1–4 (elegir situación, 5 preguntas guía, desafío de liderazgo, prompts 2 y 3, estrategia 3×3) → confirmación. Content constants (situaciones, preguntas guía, criterios, cuadrantes de estrategia, los 3 prompts) live in `src/data/momento2.ts` and `src/data/promptIA.ts` — kept in sync with `presentacion_index.html`'s `PROMPT1/2/3` and situaciones/preguntas arrays; if one changes, check the other.
- **`/panel-facilitador`**: read-only dashboard — participation grid (who's done Momento 1 / Momento 2 per institution) + a gallery of submitted 3×3 strategies, meant to be pulled up and projected at the close of the workshop (per Alejo: private to him during the session, shown to everyone at the end — not something rectors browse mid-session).
- **`src/data/tallerApi.ts`** is the only module either page talks to (`enviarCheckInMomento1`, `enviarMomento2`, `enviarReporteFinal`, `obtenerSeguimiento`) — same "swappable data layer" pattern as `fuenteDatos.ts`. Without `VITE_APPS_SCRIPT_URL` set, it falls back to a `localStorage`-backed simulation (per-browser only, not shared) so the whole flow is usable and testable end-to-end right now. Once the Apps Script Web App is deployed, setting that env var switches everything to the real backend with no component changes.
- **Backend**: `apps-script/Code.gs`, a Google Apps Script Web App — **deployed and live** (2026-09-15, account `edurural.osorio.alejandro@gmail.com`). It writes rows to a dedicated "Seguimiento Taller IA Rectores" Sheet (tabs `Momento1`, `Momento2` — **not** one of the 13 results Sheets, and deliberately **never** shared as "anyone with the link" — the only access path is the Web App itself, since submissions include rector names/emails/personal reflections), serves them back as JSON via `doGet` for the dashboard, and on a completed Momento 2 also builds an HTML report (institution's Momento 1 results + the full Momento 2 route) and emails it as a PDF via `MailApp`. The live URLs and re-deploy steps are in the comment at the top of `Code.gs`. `site/.env` (gitignored — see below) has the real `VITE_APPS_SCRIPT_URL` already set, so `/taller` and `/panel-facilitador` talk to the live backend, not the localStorage simulation, whenever you run `npm run dev` in this checkout.
  - Deployed via `clasp` (already authenticated on this machine) rather than the Apps Script web editor — `clasp create-script`, `clasp push`, `clasp create-deployment`/`update-deployment`. Two things that CLI path can't do, discovered the hard way: (1) the Sheets REST API (`sheets.googleapis.com`) is disabled on clasp's default shared GCP project and a regular user can't enable it (403 `SERVICE_DISABLED`, and the "enable it" link needs project-owner access nobody but Google has) — tab/header setup had to go through Apps Script's own `SpreadsheetApp` service instead (not gated by that project's enabled APIs), triggered via a temporary `doGet` query-param branch, then deleted once it had run. (2) A brand-new Web App's **first** hit always 403s ("Necesitas acceso") for anonymous/`curl` callers — Google requires one interactive "Authorize access" click, in a browser already logged into the deploying account, before `ANYONE_ANONYMOUS` + `executeAs: USER_DEPLOYING` actually opens up; `clasp run` doesn't get around this either (it 404s without the separate, manually-toggled "Apps Script API" account setting). If this ever needs a from-scratch redeploy, expect to hit both again.
  - The Apps Script *project* itself still lives at Drive's top level, not inside the "Capacitación rectores IA" folder — `clasp`'s OAuth token only has `drive.file` scope (files it created *through Drive API calls*), which doesn't cover moving a file created via the separate Apps Script API (403 `appNotAuthorizedToFile`). Functionally irrelevant (the deployment works regardless of Drive folder), but if Alejo wants it tidy, he can drag "Taller IA Rectores - Backend" into that folder himself in the Drive UI — a few seconds, no functional effect either way. The Sheet itself *is* correctly inside that folder (created via a Drive API call with `parents` set).
- Momento 1 in `/taller` is deliberately just a check-in (name + institución + timestamp) — there's no separate "upload a screenshot/reflection" step, per Alejo's call when this was scoped. The one PDF/email is sent once, at the end of Momento 2, and bundles both moments together.

### Still pending before this can go live

- The other 10 institutions' source Excel files (from Alejo) — see `CONTEXTO_PARA_CLAUDE_CODE.md` §4.
- Creating the 13 results Google Sheets in Drive and filling in real `sheetId`s in `src/data/mapaInstituciones.json` — separate from (and not yet done, unlike) the taller-tracking Sheet above.
- A GitHub repo to push to and set `base` in `vite.config.ts` + confirm the `HashRouter` deploy works on Pages (no remote is configured yet; this repo is local-only). Note: `site/.env` (with the live `VITE_APPS_SCRIPT_URL`) is gitignored on purpose — a deploy pipeline will need that env var set some other way (GitHub Actions secret, etc.), it won't come from the repo.
- QR codes for `presentacion_index.html` screen 8 (and possibly `/taller`'s own link/QR), generated once real rector links exist.
- The transition from Momento 1 → Momento 2 inside `/taller` ("esperen la indicación del facilitador") is an honor-system UI screen with a manual "Continuar" button, not a real-time server-pushed gate — there's no realtime infra in this architecture (Sheets/Apps Script aren't push-based). Revisit only if the facilitator actually needs to remote-unlock it for everyone at once.

## The presentation (`presentacion_index.html`)

Single self-contained HTML file (inline CSS + vanilla JS, no build step) — a 14-slide, keyboard/swipe-navigable deck. Edit it directly and open it in a browser to preview; no dev server needed.

- **Per-slide color identity**: each `<section class="slide ...">` carries a theme class (`slide--dark`, `slide--teal`, `slide--coral`, `slide--blue`, `slide--violet`, `slide--green`) that sets a distinct background wash and tints that slide's eyebrow/accent elements — added specifically so consecutive slides don't look identical. `slide--dark` is reserved for the 3 "anchor" slides (portada, transición, cierre) and is a fixed dark theme *regardless of the viewer's light/dark system preference* (unlike everything else on the page, which still respects `prefers-color-scheme` via the `:root` / `@media (prefers-color-scheme: dark)` / `[data-theme="dark"]` triple-block pattern already established in the file — keep updating all three when adding a new color token). No two adjacent slides share a theme. When adding a slide, pick a theme that doesn't repeat its neighbors and reuse an existing color family before inventing a new one — `--info` (blue) and `--tarea` (violet) and `--lima` (green, deliberately *not* `--verdad` — that token is nearly identical to `--primary`/teal at the pale "-soft" tint used for full-slide backgrounds, so don't reuse `--verdad-soft` for a slide wash).
- **No time badges anywhere** — durations (`timebadge`, the cover's "~2 h 20" pill) were deliberately removed; don't reintroduce per-slide or total-duration timing text.
- Content stays in sync with `site/`'s `/taller` tool: `PROMPT1/2/3` here are the same strings as `src/data/promptIA.ts`, and the situaciones/preguntas-guía/criterios arrays mirror `src/data/momento2.ts`.
- Slide 2 has an "Evidencias de aprendizaje" row (Conceptual/Procedimental/Actitudinal) — a pedagogical-framing addition Alejo asked for; keep it if editing that slide.

## Reference platform being simplified (Geduka)

The `/rector/:slug` page design is a deliberately trimmed-down version of Geduka's "Panel Comité de Cafeteros" (accessed via test creds documented in `CONTEXTO_PARA_CLAUDE_CODE.md` §3). Reference screenshots for each component are in `Contexto_Traspaso_Claude_Code/screenshots/` and mapped to sections of the target page in that doc. Explicitly **excluded** from the simplified version: the "Bot IA" assistant, "Premium"/watermarked PDF export, and the animated mascot/avatar.
