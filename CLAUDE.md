# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A Git repo (remote: `github.com/alianzaeducacionrural/taller-ia-rectores`, deployed to GitHub Pages via `.github/workflows/deploy.yml`) containing planning docs, source data, and the **"Momento 1"** web app itself, in `site/` — a simplified, read-only clone of the "Geduka" test-results platform, built so that each school principal (rector) can see their institution's results compared against the Caldas department baseline. Live site: `https://alianzaeducacionrural.github.io/taller-ia-rectores/`.

Read `Contexto_Traspaso_Claude_Code/CONTEXTO_PARA_CLAUDE_CODE.md` first — it is the authoritative, up-to-date context doc and supersedes `Plan_Momento1_Plataforma_Resultados.md` (an earlier draft kept for narrative detail only). Do not re-litigate decisions already marked as settled in that doc.

## Decisions already locked in (do not re-open)

- **No login**: access is a single unguessable link per institution, route `/rector/:slug`. No username/password/PIN. `/taller` and `/panel-facilitador` (see below) follow the same model — unguessable route instead of auth.
- **Results ("Momento 1") hosting**: GitHub Pages (static site) + Google Sheets as the data store, read-only via gviz — **no backend for reading results**. This part of the original "no Apps Script" decision still holds for `/rector/:slug`.
- **The `/taller` + `/panel-facilitador` tool (added later) does use a Google Apps Script Web App** — this supersedes the original "no Apps Script at all" line for that one piece, because it needs to *write* (rector submissions) and *send email*, which a static site + read-only Sheets can't do. See "The taller tool" section below. Nothing else in the architecture changed: still no Supabase, no Vercel, no server you have to run.
- **One Google Sheet per institution** (13 total: 12 schools + 1 baseline), never a single shared Sheet — this bounds the blast radius if a Sheet URL leaks (a rector could otherwise see every other school's data, including student names).
- **Baseline naming: data says "Caldas", UI says "Manizales".** The consolidated baseline file/slug/correlativo-100 institution is still internally `caldas` everywhere (source file `COR_100_CALDAS.xlsx`, slug `caldas`, `esBaseline: true`, CSS vars like `--color-caldas`) — only user-facing text was relabeled to "Manizales" (page copy, chart legends, the presentation). Don't rename the internal `caldas` identifiers; only touch display strings if asked to adjust this further.
- **Frontend**: React + Vite, static, deployed to GitHub Pages. Routes: `/` (welcome), `/rector/:slug`, `/taller`, `/panel-facilitador`, `/general` (all via `HashRouter`, so no `404.html` needed). Unknown `/rector/:slug` → "enlace no válido" message. Root `/` never lists institutions or links. `<meta name="robots" content="noindex, nofollow">` site-wide (in `index.html`).
- **2 institutions without their own dashboard**: "Adolfo Hoyos Ocampo" and "Rafael Pombo" appear in the `/taller` institution picker (`src/data/institucionesSinDashboard.ts`, `INSTITUCIONES_SIN_DASHBOARD_PROPIO`) but have no results Sheet — they're routed to `/general` (Manizales' own dashboard, no self-comparison) instead of `/rector/:slug`.
- **Palette/type**: "gris pizarra + turquesa" for the site. Fraunces for headings, Work Sans for body, JetBrains Mono for the copyable AI prompts. The presentation (`presentacion_index.html`) has its own related-but-separate palette with a per-slide color identity — see "The presentation" below.
- **Caldas sheet caveat**: the Caldas source workbook's `Detalle Estudiantes (ref)` tab contains every student from every institution (with a `Colegio` column). That tab must **never** be copied into the production Caldas Sheet — the migration script already enforces this via `--caldas`.
- All 13 source institution files now exist in `Info_Comite/` and have been migrated to real Google Sheets (see "The 13 results Sheets" under "The site" below) — `/rector/:slug` and `/general` run against live production data, not local JSON, as of 2026-09-15.
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
  Info_Comite/                                # duplicate copy of the source files (may lag the root Info_Comite/)
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

### Data layer: local JSON for dev, Google Sheets in production — same interface either way

`src/data/fuenteDatos.ts` is the **only** module the app talks to for data (`obtenerMapaInstituciones()`, `obtenerDatosInstitucion(slug)`); no component or page imports JSON or calls `fetch` directly. It switches implementation based on `VITE_DATA_SOURCE` (`.env`, default `local`):
- `local` — dynamically imports `src/data/instituciones/<slug>.json`, generated by `node scripts/generar-datos-locales.mjs` from `Info_Comite/*.xlsx`.
- `sheets` — `src/data/fuenteSheets.ts` fetches each tab of the real Google Sheet via the public gviz endpoint (`docs.google.com/spreadsheets/d/<id>/gviz/tq?...`), no API key, no backend, matching the architecture decision. `sheetId` per institution lives in `src/data/mapaInstituciones.json`. The GitHub Actions deploy always builds with `VITE_DATA_SOURCE=sheets`.

**Privacy guardrail — do not weaken without understanding why:** `src/data/instituciones/*.json` and `src/data/mapaInstitucionesLocal.json` contain real student names (from `Detalle Estudiantes`) and are gitignored — they must never reach git or a shipped bundle. `vite.config.ts` hard-fails `npm run build` unless `VITE_DATA_SOURCE=sheets` (or the explicit escape hatch `VITE_ALLOW_LOCAL_BUILD=true` for a local-only test build that will *not* be deployed), specifically so a GitHub Pages deploy can never accidentally bundle student names. `src/data/mapaInstituciones.json` (no "Local" suffix) is the **committed**, production slug→sheetId map — it holds no student data, only names/correlativos/sheetId, and is hand-edited as real Sheets go live, not regenerated by the script.

### The 13 results Sheets (created 2026-09-15)

All 13 (12 schools + Manizales/Caldas baseline) exist as real Google Sheets inside the "Capacitación rectores IA" Drive folder, shared as "cualquiera con el enlace: lector", with real `sheetId`s filled into `src/data/mapaInstituciones.json`. They were created via a **temporary** extension of the `/taller` Apps Script backend (see "Backend" below) rather than by hand:
- `Contexto_Traspaso_Claude_Code/scripts/migrar_institucion_a_sheet.py`'s tab logic was reused (not called directly) — the actual extraction was a one-off Python script (not checked into the repo — it lived in a scratch dir) that read all 13 `Info_Comite/*.xlsx`, built the same tab shapes (`Resultados por Materia`, `NV Desempeño`, `Estadísticas Preguntas`, `Competencias Débiles` computed, `Detalle Estudiantes` except for `caldas`), and POSTed each institution as JSON to a temporary `doPost` branch (`tipo: 'setup-crear-institucion'`) added to `apps-script/Code.gs`.
- That temporary branch called a `crearSheetInstitucion` function using `SpreadsheetApp.create` + `DriveApp` (create → fill tabs → `setSharing(ANYONE_WITH_LINK, VIEW)` → move into the Drive folder) — same "use Apps Script's own services, not the gated Sheets REST API" pattern as the taller-tracking Sheet setup. This needed one fresh interactive "Authorize access" click (new Drive scope) from the deploying account, done via the Apps Script *editor's* Run button (not curl/the Web App — the auth prompt only appears in the editor), before the endpoint would work.
- Once all 13 were created and their `sheetId`s copied into `mapaInstituciones.json`, the temporary `doPost` branch and `crearSheetInstitucion`/`_probarCrearSheet` functions were deleted from `Code.gs` and the Web App redeployed clean (`clasp deploy -i <deploymentId>`) — same "add temporarily, use once, remove, redeploy" discipline as every other one-off Apps Script migration task in this project. If another institution needs to be added later, restore that pattern rather than reinventing it (see the header comment in `Code.gs` for the exact shape).
- gviz header auto-detection was verified against real data post-migration (not just the local-JSON path) — `parsedNumHeaders` correctly finds row 1 as headers for every tab shape used here, including the all-numeric `Resultados por Materia` row.

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

- Everything in this section as of an earlier pass (10 missing Excel files, the 13 results Sheets, the GitHub repo/Pages deploy, QR codes) is **done** as of 2026-09-15 — see "The 13 results Sheets" above and "The presentation" below for the QR code.
- The transition from Momento 1 → Momento 2 inside `/taller` ("esperen la indicación del facilitador") is an honor-system UI screen with a manual "Continuar" button, not a real-time server-pushed gate — there's no realtime infra in this architecture (Sheets/Apps Script aren't push-based). Revisit only if the facilitator actually needs to remote-unlock it for everyone at once.
- Two leftover test spreadsheets ("Prueba Temporal", "Prueba Temporal 2") from validating the Sheets-creation endpoint are sitting in the "Capacitación rectores IA" Drive folder — cosmetic only, safe to delete manually whenever.

## The presentation (`presentacion_index.html`)

Single self-contained HTML file (inline CSS + vanilla JS, no build step) — a 14-slide, keyboard/swipe-navigable deck. Edit it directly and open it in a browser to preview; no dev server needed. After editing, run `npm run sync-presentacion` (from `site/`) to copy it into `site/public/presentacion.html`, which is what actually gets deployed.

- **QR code**: generated fully offline via a vendored `qrcode-generator` (Kazuhiko Arase, MIT) library inlined as a `<script>` block, not an external QR API — matches the workshop's "works with limited connectivity" framing. Small QR on the practice slide (`#qrChico`), click-to-enlarge modal (`#qrModal`). **The modal `<div>` must live outside `.deck`/`.slides`** (currently a sibling of `.navctrl`) — `.slides` has a CSS `transform` for the carousel, and a transformed ancestor becomes the containing block for any `position:fixed` descendant, which silently breaks the modal's positioning if it's nested inside.
- **Momento 2 Paso 1 is two slides**, not one: the 14 situación cards (one per institution, `SITUACIONES_BASE` cycled and shuffled, duplicates allowed) get a full slide to themselves in a large 7×2 grid; the guía questions + "Su desafío de liderazgo" card (with a worked example distinct from the 7 situaciones) are a separate slide right after. Keep them split — they were merged originally and it was too cramped at readable font sizes on one screen.

- **Per-slide color identity**: each `<section class="slide ...">` carries a theme class (`slide--dark`, `slide--teal`, `slide--coral`, `slide--blue`, `slide--violet`, `slide--green`) that sets a distinct background wash and tints that slide's eyebrow/accent elements — added specifically so consecutive slides don't look identical. `slide--dark` is reserved for the 3 "anchor" slides (portada, transición, cierre) and is a fixed dark theme *regardless of the viewer's light/dark system preference* (unlike everything else on the page, which still respects `prefers-color-scheme` via the `:root` / `@media (prefers-color-scheme: dark)` / `[data-theme="dark"]` triple-block pattern already established in the file — keep updating all three when adding a new color token). No two adjacent slides share a theme. When adding a slide, pick a theme that doesn't repeat its neighbors and reuse an existing color family before inventing a new one — `--info` (blue) and `--tarea` (violet) and `--lima` (green, deliberately *not* `--verdad` — that token is nearly identical to `--primary`/teal at the pale "-soft" tint used for full-slide backgrounds, so don't reuse `--verdad-soft` for a slide wash).
- **No time badges anywhere** — durations (`timebadge`, the cover's "~2 h 20" pill) were deliberately removed; don't reintroduce per-slide or total-duration timing text.
- Content stays in sync with `site/`'s `/taller` tool: `PROMPT1/2/3` here are the same strings as `src/data/promptIA.ts`, and the situaciones/preguntas-guía/criterios arrays mirror `src/data/momento2.ts`.
- Slide 2 has an "Evidencias de aprendizaje" row (Conceptual/Procedimental/Actitudinal) — a pedagogical-framing addition Alejo asked for; keep it if editing that slide.

## Reference platform being simplified (Geduka)

The `/rector/:slug` page design is a deliberately trimmed-down version of Geduka's "Panel Comité de Cafeteros" (accessed via test creds documented in `CONTEXTO_PARA_CLAUDE_CODE.md` §3). Reference screenshots for each component are in `Contexto_Traspaso_Claude_Code/screenshots/` and mapped to sections of the target page in that doc. Explicitly **excluded** from the simplified version: the "Bot IA" assistant, "Premium"/watermarked PDF export, and the animated mascot/avatar.
