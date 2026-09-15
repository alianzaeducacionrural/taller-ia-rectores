// Punto único de acceso a los datos de una institución. El resto de la app
// (páginas, componentes) solo conoce esta interfaz — nunca importa JSON local
// ni llama a Sheets directamente — así que activar producción es cambiar
// VITE_DATA_SOURCE=sheets y llenar los sheetId en mapaInstituciones.json, sin
// tocar un solo componente.
import mapaProduccion from './mapaInstituciones.json';
import type { InstitucionData, MapaInstituciones } from './tiposInstitucion';
import { obtenerInstitucionDesdeSheets } from './fuenteSheets';

const modo = (import.meta.env.VITE_DATA_SOURCE ?? 'local') as 'local' | 'sheets';

// Los JSON reales (con datos de estudiantes) se generan con
// `node scripts/generar-datos-locales.mjs` y están en .gitignore — por eso
// el import es perezoso (glob) y puede no existir ninguna coincidencia.
const modulosLocales = import.meta.glob<{ default: InstitucionData }>('./instituciones/*.json');

export function obtenerMapaInstituciones(): MapaInstituciones {
  return mapaProduccion as MapaInstituciones;
}

export async function obtenerDatosInstitucion(slug: string): Promise<InstitucionData> {
  const mapa = obtenerMapaInstituciones();
  const meta = mapa[slug];
  if (!meta) {
    throw new Error(`Slug "${slug}" no existe en mapaInstituciones.json`);
  }

  if (modo === 'sheets') {
    return obtenerInstitucionDesdeSheets(slug, meta);
  }

  const ruta = `./instituciones/${slug}.json`;
  const cargar = modulosLocales[ruta];
  if (!cargar) {
    throw new Error(
      `No hay datos locales generados para "${slug}". Corre "node scripts/generar-datos-locales.mjs" ` +
        `(solo genera giovanni-montini y caldas hasta que lleguen los otros 10 Excel) o cambia ` +
        `VITE_DATA_SOURCE=sheets si ya existe el Google Sheet real.`,
    );
  }
  const modulo = await cargar();
  return modulo.default;
}
