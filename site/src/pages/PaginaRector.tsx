import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AciertoPorPreguntas from '../components/AciertoPorPreguntas';
import CompetenciasDebiles from '../components/CompetenciasDebiles';
import CtaPrompt from '../components/CtaPrompt';
import DetalleEstudiantes from '../components/DetalleEstudiantes';
import Encabezado from '../components/Encabezado';
import NivelesDesempeno from '../components/NivelesDesempeno';
import PuntajeGlobal from '../components/PuntajeGlobal';
import ResultadosPorArea from '../components/ResultadosPorArea';
import { obtenerDatosInstitucion, obtenerMapaInstituciones } from '../data/fuenteDatos';
import type { InstitucionData } from '../data/tiposInstitucion';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; institucion: InstitucionData; caldas: InstitucionData };

// Envoltorio que solo lee el slug de la URL y lo pasa como `key`: así, si el
// slug cambia (navegación directa entre dos rectores), React remonta
// PaginaRectorConSlug en vez de reutilizar el estado del rector anterior.
export default function PaginaRector() {
  const { slug } = useParams<{ slug: string }>();
  return <PaginaRectorConSlug key={slug} slug={slug} />;
}

function PaginaRectorConSlug({ slug }: { slug?: string }) {
  const mapa = obtenerMapaInstituciones();
  const meta = slug ? mapa[slug] : undefined;
  // Caldas es la línea base departamental, no una institución con rector: no
  // tiene página propia (ver CONTEXTO_PARA_CLAUDE_CODE.md §6). Es pura
  // (depende solo de slug y del mapa estático), así que se resuelve en el
  // render, sin pasar por estado ni por el efecto de carga de abajo.
  const esValido = Boolean(slug && meta && !meta.esBaseline);

  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!esValido || !slug) return;
    let cancelado = false;

    Promise.all([obtenerDatosInstitucion(slug), obtenerDatosInstitucion('caldas')])
      .then(([institucion, caldas]) => {
        if (!cancelado) setEstado({ tipo: 'listo', institucion, caldas });
      })
      .catch((err: unknown) => {
        if (!cancelado) setEstado({ tipo: 'error', mensaje: err instanceof Error ? err.message : String(err) });
      });

    return () => {
      cancelado = true;
    };
  }, [slug, esValido]);

  if (!esValido) {
    return (
      <main className="estado-pagina">
        <div className="tarjeta">
          <h1>Enlace no válido</h1>
          <p>Verifica el enlace con el equipo de Educación del Comité de Cafeteros de Caldas.</p>
        </div>
      </main>
    );
  }

  if (estado.tipo === 'cargando') {
    return (
      <main className="estado-pagina">
        <p>Cargando resultados...</p>
      </main>
    );
  }

  if (estado.tipo === 'error') {
    return (
      <main className="estado-pagina">
        <div className="tarjeta">
          <h1>No se pudieron cargar los resultados</h1>
          <p>{estado.mensaje}</p>
        </div>
      </main>
    );
  }

  const { institucion, caldas } = estado;

  return (
    <main className="pagina-rector">
      <Encabezado nombreInstitucion={institucion.nombre} />
      <PuntajeGlobal puntajeInstitucion={institucion.resultadosPorMateria.global} puntajeCaldas={caldas.resultadosPorMateria.global} />
      <ResultadosPorArea institucion={institucion.resultadosPorMateria} caldas={caldas.resultadosPorMateria} />
      <NivelesDesempeno institucion={institucion.nivelesDesempeno} caldas={caldas.nivelesDesempeno} />
      <CompetenciasDebiles competencias={institucion.competenciasDebiles} />
      <AciertoPorPreguntas preguntas={institucion.estadisticasPreguntas} />
      {institucion.detalleEstudiantes && <DetalleEstudiantes estudiantes={institucion.detalleEstudiantes} />}
      <CtaPrompt />
    </main>
  );
}
