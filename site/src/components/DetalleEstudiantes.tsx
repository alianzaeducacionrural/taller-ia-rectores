import { useMemo, useState } from 'react';
import { AREAS, type CodigoArea, type EstudianteDetalle, type NivelDesempenoNombre } from '../data/tiposInstitucion';

interface Props {
  estudiantes: EstudianteDetalle[];
}

type Columna = 'nombre' | CodigoArea | 'global';

const NIVEL_ETIQUETA: Record<NivelDesempenoNombre, string> = {
  insuficiente: 'Insuf.',
  minimo: 'Mínimo',
  satisfactorio: 'Satisf.',
  avanzado: 'Avanz.',
};

function ordenar(estudiantes: EstudianteDetalle[], columna: Columna, direccion: 1 | -1): EstudianteDetalle[] {
  return [...estudiantes].sort((a, b) => {
    if (columna === 'nombre') return direccion * a.nombre.localeCompare(b.nombre, 'es');
    if (columna === 'global') return direccion * (a.global - b.global);
    return direccion * (a.areas[columna].puntaje - b.areas[columna].puntaje);
  });
}

export default function DetalleEstudiantes({ estudiantes }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [soloEnRiesgo, setSoloEnRiesgo] = useState(false);
  const [columna, setColumna] = useState<Columna>('global');
  const [direccion, setDireccion] = useState<1 | -1>(1); // 1 = ascendente: peores primero, útil para decidir apoyos

  const filtrados = useMemo(() => {
    let lista = estudiantes;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      lista = lista.filter((e) => e.nombre.toLowerCase().includes(q));
    }
    if (soloEnRiesgo) {
      lista = lista.filter((e) => AREAS.some(({ codigo }) => e.areas[codigo].nivel === 'insuficiente' || e.areas[codigo].nivel === 'minimo'));
    }
    return ordenar(lista, columna, direccion);
  }, [estudiantes, busqueda, soloEnRiesgo, columna, direccion]);

  function alHacerClicColumna(nueva: Columna) {
    if (nueva === columna) {
      setDireccion((d) => (d === 1 ? -1 : 1));
    } else {
      setColumna(nueva);
      setDireccion(1);
    }
  }

  return (
    <section className="tarjeta detalle-estudiantes">
      <button type="button" className="detalle-estudiantes-toggle" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        <h2>Detalle por estudiante</h2>
        <span>{abierto ? 'Ocultar ▾' : 'Ver detalle ▸'}</span>
      </button>

      {abierto && (
        <>
          <p className="tarjeta-subtitulo">
            Puntaje y nivel de cada estudiante por área, para apoyar decisiones de acompañamiento individual. Ordenado
            de menor a mayor puntaje global por defecto.
          </p>

          <div className="detalle-estudiantes-controles">
            <input
              type="search"
              placeholder="Buscar estudiante por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="detalle-estudiantes-busqueda"
            />
            <label className="detalle-estudiantes-filtro">
              <input type="checkbox" checked={soloEnRiesgo} onChange={(e) => setSoloEnRiesgo(e.target.checked)} />
              Solo con algún nivel insuficiente o mínimo
            </label>
          </div>

          <div className="detalle-estudiantes-tabla-contenedor">
            <table className="detalle-estudiantes-tabla">
              <thead>
                <tr>
                  <th>
                    <button type="button" onClick={() => alHacerClicColumna('nombre')}>
                      Estudiante {columna === 'nombre' ? (direccion === 1 ? '▲' : '▼') : ''}
                    </button>
                  </th>
                  {AREAS.map(({ codigo, nombre }) => (
                    <th key={codigo}>
                      <button type="button" onClick={() => alHacerClicColumna(codigo)}>
                        {codigo} {columna === codigo ? (direccion === 1 ? '▲' : '▼') : ''}
                      </button>
                      <span className="detalle-estudiantes-nombre-area">{nombre}</span>
                    </th>
                  ))}
                  <th>
                    <button type="button" onClick={() => alHacerClicColumna('global')}>
                      Global {columna === 'global' ? (direccion === 1 ? '▲' : '▼') : ''}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((e) => (
                  <tr key={e.nombre}>
                    <td className="detalle-estudiantes-nombre">{e.nombre}</td>
                    {AREAS.map(({ codigo }) => (
                      <td key={codigo}>
                        <span className={`nivel-badge nivel-${e.areas[codigo].nivel}`}>
                          {e.areas[codigo].puntaje} · {NIVEL_ETIQUETA[e.areas[codigo].nivel]}
                        </span>
                      </td>
                    ))}
                    <td className="detalle-estudiantes-global">{e.global}</td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={AREAS.length + 2} className="detalle-estudiantes-vacio">
                      Ningún estudiante coincide con el filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
