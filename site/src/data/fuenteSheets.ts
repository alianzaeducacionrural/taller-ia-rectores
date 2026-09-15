// Lee un Google Sheet publicado como "cualquiera con el enlace: lector" vía
// el endpoint gviz (sin API key, sin backend, sin Apps Script — igual que
// decidido en el plan de arquitectura). Convierte cada pestaña al mismo
// InstitucionData que ya usa el modo "local" (ver fuenteDatosLocal.ts), para
// que los componentes no sepan de dónde vinieron los datos.
import type {
  CodigoArea,
  CompetenciaDebil,
  EstudianteDetalle,
  InstitucionData,
  InstitucionMeta,
  NivelDesempeno,
  NivelDesempenoNombre,
  PreguntaEstadistica,
  ResultadosPorMateria,
} from './tiposInstitucion';

const MATERIA_A_CODIGO: Record<string, CodigoArea> = {
  MATEMÁTICAS: 'MT',
  LECTURA: 'LC',
  SOCIALES: 'CS',
  NATURALES: 'NT',
  INGLÉS: 'IN',
};

interface TablaGviz {
  header: string[];
  rows: unknown[][];
}

async function leerPestanaGviz(sheetId: string, pestana: string): Promise<TablaGviz> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(pestana)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No se pudo leer la pestaña "${pestana}" del Sheet ${sheetId} (HTTP ${res.status})`);
  }
  const texto = await res.text();
  // La respuesta viene envuelta como `google.visualization.Query.setResponse({...});`
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  const json = JSON.parse(texto.slice(inicio, fin + 1));
  const cols: string[] = json.table.cols.map((c: { label?: string }, i: number) => c.label || `col${i}`);
  const rows: unknown[][] = json.table.rows.map((r: { c: ({ v: unknown } | null)[] }) =>
    r.c.map((cell) => (cell ? cell.v : null)),
  );
  return { header: cols, rows };
}

function indiceColumnas(header: string[]): Record<string, number> {
  return Object.fromEntries(header.map((h, i) => [h, i]));
}

function parseResultadosPorMateria(tabla: TablaGviz): ResultadosPorMateria {
  const idx = indiceColumnas(tabla.header);
  const row = tabla.rows[0];
  const colIN = 'IN_' in idx ? idx['IN_'] : idx['IN'];
  return {
    MT: Number(row[idx['MT']]),
    LC: Number(row[idx['LC']]),
    CS: Number(row[idx['CS']]),
    NT: Number(row[idx['NT']]),
    IN: Number(row[colIN]),
    global: Number(row[idx['PUNTAJE GLOBAL']]),
  };
}

function parseNivelesDesempeno(tabla: TablaGviz): NivelDesempeno[] {
  const idx = indiceColumnas(tabla.header);
  return tabla.rows.map((row) => ({
    materia: MATERIA_A_CODIGO[String(row[idx['materia']])] ?? (String(row[idx['materia']]) as CodigoArea),
    insuficiente: Number(row[idx['insuficiente']]),
    minimo: Number(row[idx['minimo']]),
    satisfactorio: Number(row[idx['satisfactorio']]),
    avanzado: Number(row[idx['avnzado']]),
  }));
}

function parseCompetenciasDebiles(tabla: TablaGviz): CompetenciaDebil[] {
  const idx = indiceColumnas(tabla.header);
  return tabla.rows.map((row) => ({
    materia: row[idx['materia']] as CodigoArea,
    competencia: String(row[idx['competencia']]),
    pctAciertoPromedio: Number(row[idx['% acierto promedio']]),
    afirmacion: String(row[idx['afirmacion']]),
    evidencia: String(row[idx['evidencia']]),
  }));
}

function parseEstadisticasPreguntas(tabla: TablaGviz): PreguntaEstadistica[] {
  const idx = indiceColumnas(tabla.header);
  return tabla.rows.map((row) => {
    const codigo = String(row[idx['# Pregunta']]);
    return {
      codigo,
      materia: codigo.replace(/[0-9]/g, '') as CodigoArea,
      pctAcierto: Math.round(Number(row[idx['% acierto']]) * 1000) / 10,
      competencia: String(row[idx['competencia']]),
      afirmacion: String(row[idx['afirmacion']]),
      evidencia: String(row[idx['evidencia']]),
    };
  });
}

function parseDetalleEstudiantes(tabla: TablaGviz): EstudianteDetalle[] {
  const idx = indiceColumnas(tabla.header);
  const nivel = (row: unknown[], col: string): NivelDesempenoNombre => String(row[idx[col]]) as NivelDesempenoNombre;
  return tabla.rows.map((row) => ({
    nombre: String(row[idx['Nombre']]),
    areas: {
      MT: { puntaje: Number(row[idx['MT']]), nivel: nivel(row, 'Nivel MT') },
      LC: { puntaje: Number(row[idx['LC']]), nivel: nivel(row, 'Nivel LC') },
      CS: { puntaje: Number(row[idx['CS']]), nivel: nivel(row, 'Nivel CS') },
      NT: { puntaje: Number(row[idx['NT']]), nivel: nivel(row, 'Nivel NT') },
      IN: { puntaje: Number(row[idx['IN']]), nivel: nivel(row, 'Nivel IN') },
    },
    global: Number(row[idx['GL']]),
  }));
}

export async function obtenerInstitucionDesdeSheets(slug: string, meta: InstitucionMeta): Promise<InstitucionData> {
  if (!meta.sheetId) {
    throw new Error(
      `La institución "${slug}" todavía no tiene un Google Sheet publicado (sheetId vacío en mapaInstituciones.json).`,
    );
  }
  const [resultados, niveles, competencias, preguntas, detalle] = await Promise.all([
    leerPestanaGviz(meta.sheetId, 'Resultados por Materia'),
    leerPestanaGviz(meta.sheetId, 'NV Desempeño'),
    leerPestanaGviz(meta.sheetId, 'Competencias Débiles'),
    leerPestanaGviz(meta.sheetId, 'Estadísticas Preguntas'),
    meta.esBaseline ? Promise.resolve(null) : leerPestanaGviz(meta.sheetId, 'Detalle Estudiantes'),
  ]);
  return {
    correlativo: meta.correlativo,
    nombre: meta.nombre,
    slug,
    esBaseline: meta.esBaseline,
    resultadosPorMateria: parseResultadosPorMateria(resultados),
    nivelesDesempeno: parseNivelesDesempeno(niveles),
    competenciasDebiles: parseCompetenciasDebiles(competencias),
    estadisticasPreguntas: parseEstadisticasPreguntas(preguntas),
    detalleEstudiantes: detalle ? parseDetalleEstudiantes(detalle) : null,
  };
}
