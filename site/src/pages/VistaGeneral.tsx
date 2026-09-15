import { useEffect, useState } from 'react';
import AciertoPorPreguntas from '../components/AciertoPorPreguntas';
import CompetenciasDebiles from '../components/CompetenciasDebiles';
import NivelesDesempeno from '../components/NivelesDesempeno';
import ResultadosPorArea from '../components/ResultadosPorArea';
import { obtenerDatosInstitucion } from '../data/fuenteDatos';
import type { InstitucionData } from '../data/tiposInstitucion';

// Vista de solo lectura del consolidado departamental (Manizales) — el mismo
// dashboard que ve cada rector en /rector/:slug, pero sin comparación (el
// consolidado no se compara consigo mismo) y sin detalle por estudiante (esa
// pestaña no existe para Manizales — ver CONTEXTO_PARA_CLAUDE_CODE.md §4).
export default function VistaGeneral() {
  const [datos, setDatos] = useState<InstitucionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    obtenerDatosInstitucion('caldas')
      .then((d) => {
        if (!cancelado) setDatos(d);
      })
      .catch((err: unknown) => {
        if (!cancelado) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  if (error) {
    return (
      <main className="estado-pagina">
        <div className="tarjeta">
          <h1>No se pudo cargar el consolidado</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!datos) {
    return (
      <main className="estado-pagina">
        <p>Cargando consolidado...</p>
      </main>
    );
  }

  return (
    <main className="pagina-rector">
      <header className="encabezado">
        <span className="encabezado-marca">Comité de Cafeteros de Caldas</span>
        <h1>{datos.nombre}</h1>
        <p>Vista general — resultados consolidados de todas las instituciones</p>
      </header>

      <section className="tarjeta puntaje-global">
        <div>
          <span className="etiqueta-tenue">Puntaje global consolidado</span>
          <div className="puntaje-global-numero">{datos.resultadosPorMateria.global}</div>
        </div>
      </section>

      <ResultadosPorArea institucion={datos.resultadosPorMateria} />
      <NivelesDesempeno institucion={datos.nivelesDesempeno} />
      <CompetenciasDebiles competencias={datos.competenciasDebiles} />
      <AciertoPorPreguntas preguntas={datos.estadisticasPreguntas} />
    </main>
  );
}
