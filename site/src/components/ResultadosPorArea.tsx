import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AREAS, type ResultadosPorMateria } from '../data/tiposInstitucion';

interface Props {
  institucion: ResultadosPorMateria;
  caldas?: ResultadosPorMateria;
}

export default function ResultadosPorArea({ institucion, caldas }: Props) {
  const datos = AREAS.map(({ codigo, nombre }) => ({
    area: nombre,
    Institución: institucion[codigo],
    ...(caldas ? { Manizales: caldas[codigo] } : {}),
  }));

  return (
    <section className="tarjeta">
      <h2>Resultados por área</h2>
      <p className="tarjeta-subtitulo">
        {caldas ? 'Puntaje promedio, institución frente a Manizales.' : 'Puntaje promedio consolidado por área.'}
      </p>
      <div className="grafico-contenedor">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={datos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" vertical={false} />
            <XAxis dataKey="area" tick={{ fill: 'var(--color-texto-tenue)', fontSize: 13 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-texto-tenue)', fontSize: 13 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-superficie)',
                border: '1px solid var(--color-borde)',
                borderRadius: 8,
                fontFamily: 'var(--fuente-texto)',
              }}
            />
            {caldas && <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'var(--fuente-texto)' }} />}
            <Bar dataKey="Institución" name={caldas ? 'Institución' : 'Manizales'} fill="var(--color-institucion)" radius={[6, 6, 0, 0]} />
            {caldas && <Bar dataKey="Manizales" fill="var(--color-caldas)" radius={[6, 6, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
