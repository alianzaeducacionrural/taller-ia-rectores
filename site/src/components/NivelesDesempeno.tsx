import { AREAS, type CodigoArea, type NivelDesempeno } from '../data/tiposInstitucion';

interface Props {
  institucion: NivelDesempeno[];
  caldas?: NivelDesempeno[];
}

const NIVELES: { clave: 'insuficiente' | 'minimo' | 'satisfactorio' | 'avanzado'; etiqueta: string; color: string }[] = [
  { clave: 'insuficiente', etiqueta: 'Insuficiente', color: 'var(--nivel-insuficiente)' },
  { clave: 'minimo', etiqueta: 'Mínimo', color: 'var(--nivel-minimo)' },
  { clave: 'satisfactorio', etiqueta: 'Satisfactorio', color: 'var(--nivel-satisfactorio)' },
  { clave: 'avanzado', etiqueta: 'Avanzado', color: 'var(--nivel-avanzado)' },
];

function porArea(niveles: NivelDesempeno[], area: CodigoArea): NivelDesempeno | undefined {
  return niveles.find((n) => n.materia === area);
}

function BarraApilada({ fila, etiqueta }: { fila: NivelDesempeno; etiqueta: string }) {
  const total = fila.insuficiente + fila.minimo + fila.satisfactorio + fila.avanzado;
  return (
    <div className="niveles-fila">
      <span className="niveles-fila-etiqueta">{etiqueta}</span>
      <div className="niveles-barra" role="img" aria-label={`${etiqueta}: distribución de niveles de desempeño`}>
        {NIVELES.map(({ clave, etiqueta: etiquetaNivel, color }) => {
          const valor = fila[clave];
          const pct = total > 0 ? (valor / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={clave}
              className="niveles-segmento"
              style={{ width: `${pct}%`, background: color }}
              title={`${etiquetaNivel}: ${valor} estudiantes (${Math.round(pct)}%)`}
            >
              {pct >= 10 ? `${Math.round(pct)}%` : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function NivelesDesempeno({ institucion, caldas }: Props) {
  return (
    <section className="tarjeta">
      <h2>Niveles de desempeño por área</h2>
      <p className="tarjeta-subtitulo">
        {caldas ? 'Porcentaje de estudiantes en cada nivel, institución frente a Manizales.' : 'Porcentaje consolidado de estudiantes en cada nivel.'}
      </p>

      <div className="niveles-leyenda">
        {NIVELES.map(({ clave, etiqueta, color }) => (
          <span key={clave} className="niveles-leyenda-item">
            <span className="niveles-leyenda-punto" style={{ background: color }} />
            {etiqueta}
          </span>
        ))}
      </div>

      <div className="niveles-lista">
        {AREAS.map(({ codigo, nombre }) => {
          const filaInstitucion = porArea(institucion, codigo);
          const filaCaldas = caldas ? porArea(caldas, codigo) : undefined;
          if (!filaInstitucion || (caldas && !filaCaldas)) return null;
          return (
            <div key={codigo} className="niveles-grupo">
              <h3 className="niveles-grupo-titulo">{nombre}</h3>
              <BarraApilada fila={filaInstitucion} etiqueta={caldas ? 'Institución' : 'Manizales'} />
              {filaCaldas && <BarraApilada fila={filaCaldas} etiqueta="Manizales" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
