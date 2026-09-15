import { AREAS, type CompetenciaDebil } from '../data/tiposInstitucion';
import { severidadPorAcierto } from '../utils/severidad';

interface Props {
  competencias: CompetenciaDebil[];
}

export default function CompetenciasDebiles({ competencias }: Props) {
  return (
    <section className="tarjeta">
      <h2>Lo que más pesa mejorar</h2>
      <p className="tarjeta-subtitulo">Las 3 competencias con menor acierto promedio, con su afirmación y evidencia.</p>
      <div className="competencias-lista">
        {competencias.map((c) => {
          const nombreArea = AREAS.find((a) => a.codigo === c.materia)?.nombre ?? c.materia;
          return (
            <article key={`${c.materia}-${c.competencia}`} className={`competencia-tarjeta severidad-${severidadPorAcierto(c.pctAciertoPromedio)}`}>
              <span className="competencia-area">{nombreArea}</span>
              <h3 className="competencia-nombre">{c.competencia}</h3>
              <dl className="competencia-detalle">
                <div>
                  <dt>Afirmación</dt>
                  <dd>{c.afirmacion}</dd>
                </div>
                <div>
                  <dt>Evidencia</dt>
                  <dd>{c.evidencia}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
