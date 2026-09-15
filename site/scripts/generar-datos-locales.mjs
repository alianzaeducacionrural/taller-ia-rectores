// Convierte los Excel de origen (Info_Comite/) en el JSON local que usa la app
// mientras los 13 Google Sheets de producción no existen todavía.
//
// Uso: node scripts/generar-datos-locales.mjs
//
// La forma del JSON generado es la misma que devolverá más adelante la capa
// de datos que lea de Google Sheets (ver src/data/tiposInstitucion.ts), así
// que cambiar de "local" a "sheets" solo implica reemplazar la implementación
// de src/data/fuenteDatos.ts, no los componentes que consumen los datos.

import XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGEN_DIR = join(__dirname, '..', '..', 'Info_Comite');
const SALIDA_DIR = join(__dirname, '..', 'src', 'data', 'instituciones');
// mapaInstitucionesLocal.json (a diferencia de mapaInstituciones.json) es
// generado y está en .gitignore: nunca debe llegar a git ni al build de
// producción, porque las instituciones aquí referenciadas exponen datos con
// nombres reales de estudiantes en instituciones/*.json.
const MAPA_SALIDA = join(__dirname, '..', 'src', 'data', 'mapaInstitucionesLocal.json');

const MATERIA_A_CODIGO = {
  'MATEMÁTICAS': 'MT',
  'LECTURA': 'LC',
  'SOCIALES': 'CS',
  'NATURALES': 'NT',
  'INGLÉS': 'IN',
};

function leerHoja(wb, nombreHoja) {
  return XLSX.utils.sheet_to_json(wb.Sheets[nombreHoja], { header: 1, defval: null });
}

function resultadosPorMateria(wb) {
  const rows = leerHoja(wb, 'Resultados por Materia');
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const row = rows[1];
  return {
    MT: row[idx['MT']],
    LC: row[idx['LC']],
    CS: row[idx['CS']],
    NT: row[idx['NT']],
    IN: row[idx['IN_']],
    global: row[idx['PUNTAJE GLOBAL']],
  };
}

function nivelesDesempeno(wb) {
  const rows = leerHoja(wb, 'NV DESEMPEÑO');
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return rows.slice(1).map((row) => ({
    materia: MATERIA_A_CODIGO[row[idx['materia']]] ?? row[idx['materia']],
    insuficiente: row[idx['insuficiente']],
    minimo: row[idx['minimo']],
    satisfactorio: row[idx['satisfactorio']],
    avanzado: row[idx['avnzado']],
  }));
}

function competenciasDebiles(wb, topN = 3) {
  const rows = leerHoja(wb, 'Estadísticas Preguntas');
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const agg = new Map();
  const meta = new Map();
  for (const row of rows.slice(1)) {
    const comp = row[idx['competencia']];
    const pct = row[idx['% acierto']];
    const codigoPregunta = String(row[idx['# Pregunta']]);
    const materia = codigoPregunta.replace(/[0-9]/g, '');
    const key = `${materia}::${comp}`;
    if (!agg.has(key)) agg.set(key, []);
    agg.get(key).push(pct);
    if (!meta.has(key)) {
      meta.set(key, {
        afirmacion: row[idx['afirmacion']],
        evidencia: row[idx['evidencia']],
      });
    }
  }
  const promedios = [...agg.entries()].map(([key, vals]) => {
    const [materia, competencia] = key.split('::');
    const promedio = vals.reduce((a, b) => a + b, 0) / vals.length;
    return {
      materia,
      competencia,
      pctAciertoPromedio: Math.round(promedio * 1000) / 10,
      afirmacion: meta.get(key).afirmacion,
      evidencia: meta.get(key).evidencia,
    };
  });
  promedios.sort((a, b) => a.pctAciertoPromedio - b.pctAciertoPromedio);
  return promedios.slice(0, topN);
}

function estadisticasPreguntas(wb) {
  const rows = leerHoja(wb, 'Estadísticas Preguntas');
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return rows.slice(1).map((row) => {
    const codigo = String(row[idx['# Pregunta']]);
    return {
      codigo,
      materia: codigo.replace(/[0-9]/g, ''),
      pctAcierto: Math.round(row[idx['% acierto']] * 1000) / 10,
      competencia: row[idx['competencia']],
      afirmacion: row[idx['afirmacion']],
      evidencia: row[idx['evidencia']],
    };
  });
}

function detalleEstudiantes(wb) {
  const rows = leerHoja(wb, 'Detalle Estudiantes (ref)');
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return rows.slice(1).map((row) => ({
    nombre: row[idx['Nombre']],
    areas: {
      MT: { puntaje: row[idx['MT']], nivel: row[idx['Nivel MT']] },
      LC: { puntaje: row[idx['LC']], nivel: row[idx['Nivel LC']] },
      CS: { puntaje: row[idx['CS']], nivel: row[idx['Nivel CS']] },
      NT: { puntaje: row[idx['NT']], nivel: row[idx['Nivel NT']] },
      IN: { puntaje: row[idx['IN']], nivel: row[idx['Nivel IN']] },
    },
    global: row[idx['GL']],
  }));
}

function construirInstitucion({ archivo, slug, nombre, correlativo, esBaseline }) {
  const wb = XLSX.readFile(join(ORIGEN_DIR, archivo));
  return {
    correlativo,
    nombre,
    slug,
    esBaseline,
    resultadosPorMateria: resultadosPorMateria(wb),
    nivelesDesempeno: nivelesDesempeno(wb),
    competenciasDebiles: competenciasDebiles(wb),
    estadisticasPreguntas: estadisticasPreguntas(wb),
    // El detalle de estudiantes de Caldas trae TODAS las instituciones
    // (columna "Colegio") y nunca debe exponerse como si fuera de Caldas.
    detalleEstudiantes: esBaseline ? null : detalleEstudiantes(wb),
  };
}

const INSTITUCIONES = [
  {
    archivo: 'COR_1_GIOVANNI_MONTINI.xlsx',
    slug: 'giovanni-montini',
    nombre: 'Giovanni Montini',
    correlativo: 1,
    esBaseline: false,
  },
  {
    archivo: 'COR_100_CALDAS.xlsx',
    slug: 'caldas',
    nombre: 'Manizales (consolidado)',
    correlativo: 100,
    esBaseline: true,
  },
];

mkdirSync(SALIDA_DIR, { recursive: true });

const mapa = {};
for (const def of INSTITUCIONES) {
  const data = construirInstitucion(def);
  writeFileSync(join(SALIDA_DIR, `${def.slug}.json`), JSON.stringify(data, null, 2) + '\n');
  mapa[def.slug] = {
    nombre: def.nombre,
    correlativo: def.correlativo,
    esBaseline: def.esBaseline,
    // sheetId queda null hasta que el Sheet real exista en producción.
    sheetId: null,
  };
  console.log('OK ->', `${def.slug}.json`);
}

writeFileSync(MAPA_SALIDA, JSON.stringify(mapa, null, 2) + '\n');
console.log('OK ->', 'mapaInstitucionesLocal.json');
