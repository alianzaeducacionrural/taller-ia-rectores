import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AREAS, type CodigoArea, type PreguntaEstadistica } from '../data/tiposInstitucion';
import { colorSeveridad, severidadPorAcierto } from '../utils/severidad';

interface Props {
  preguntas: PreguntaEstadistica[];
}

function numeroPregunta(codigo: string): number {
  const match = codigo.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export default function AciertoPorPreguntas({ preguntas }: Props) {
  const areasDisponibles = useMemo(
    () => AREAS.filter(({ codigo }) => preguntas.some((p) => p.materia === codigo)),
    [preguntas],
  );
  const [area, setArea] = useState<CodigoArea | undefined>(areasDisponibles[0]?.codigo);

  const preguntasArea = useMemo(
    () => preguntas.filter((p) => p.materia === area).sort((a, b) => numeroPregunta(a.codigo) - numeroPregunta(b.codigo)),
    [preguntas, area],
  );

  // Las 3 preguntas con menor acierto del área elegida se muestran solas,
  // sin necesidad de hacer clic — son las que el rector va a llevar al
  // prompt de IA (con el pantallazo del gráfico completo).
  const masBajas = useMemo(() => [...preguntasArea].sort((a, b) => a.pctAcierto - b.pctAcierto).slice(0, 3), [preguntasArea]);
  const codigosMasBajos = useMemo(() => new Set(masBajas.map((p) => p.codigo)), [masBajas]);

  if (areasDisponibles.length === 0) return null;

  return (
    <section className="tarjeta">
      <h2>Acierto por pregunta</h2>
      <p className="tarjeta-subtitulo">
        Selecciona un área. Abajo aparecen automáticamente las 3 preguntas con menor acierto de esa área — con su
        competencia, afirmación y evidencia — listas para el pantallazo que van a usar con la IA.
      </p>

      <div className="acierto-tabs">
        {areasDisponibles.map(({ codigo, nombre }) => (
          <button
            key={codigo}
            type="button"
            className={`acierto-tab ${area === codigo ? 'es-activo' : ''}`}
            onClick={() => setArea(codigo)}
          >
            {nombre}
          </button>
        ))}
      </div>

      <div className="acierto-grafico-contenedor">
        <ResponsiveContainer width="100%" height={280} minWidth={Math.max(preguntasArea.length * 32, 280)}>
          <BarChart data={preguntasArea} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <XAxis dataKey="codigo" tick={{ fill: 'var(--color-texto-tenue)', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
            <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-texto-tenue)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(valor) => [`${valor}%`, 'Acierto']}
              contentStyle={{
                background: 'var(--color-superficie)',
                border: '1px solid var(--color-borde)',
                borderRadius: 8,
                fontFamily: 'var(--fuente-texto)',
              }}
            />
            <Bar dataKey="pctAcierto" radius={[4, 4, 0, 0]}>
              {preguntasArea.map((p) => (
                <Cell
                  key={p.codigo}
                  fill={colorSeveridad(severidadPorAcierto(p.pctAcierto))}
                  stroke={codigosMasBajos.has(p.codigo) ? 'var(--pizarra-900)' : 'none'}
                  strokeWidth={codigosMasBajos.has(p.codigo) ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="acierto-masbajas">
        <span className="acierto-masbajas-titulo">Las 3 con menor acierto en esta área</span>
        <div className="acierto-masbajas-lista">
          {masBajas.map((p) => (
            <div key={p.codigo} className={`acierto-detalle severidad-${severidadPorAcierto(p.pctAcierto)}`}>
              <div className="acierto-detalle-encabezado">
                <div className="acierto-detalle-titulo">
                  <span className="acierto-detalle-badge" style={{ background: colorSeveridad(severidadPorAcierto(p.pctAcierto)) }}>
                    Detalle
                  </span>
                  <span className="acierto-detalle-codigo">{p.codigo}</span>
                </div>
                <span className="acierto-detalle-puntaje" style={{ color: colorSeveridad(severidadPorAcierto(p.pctAcierto)) }}>
                  {p.pctAcierto}
                  <span className="acierto-detalle-puntaje-sobre">/100</span>
                </span>
              </div>
              <div className="acierto-detalle-barra">
                <div
                  className="acierto-detalle-barra-relleno"
                  style={{ width: `${p.pctAcierto}%`, background: colorSeveridad(severidadPorAcierto(p.pctAcierto)) }}
                />
              </div>
              <div className="acierto-detalle-columnas">
                <div>
                  <span className="acierto-detalle-etiqueta">Competencia</span>
                  <p>{p.competencia}</p>
                </div>
                <div>
                  <span className="acierto-detalle-etiqueta">Afirmación</span>
                  <p>{p.afirmacion}</p>
                </div>
                <div>
                  <span className="acierto-detalle-etiqueta">Evidencia</span>
                  <p>{p.evidencia}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
