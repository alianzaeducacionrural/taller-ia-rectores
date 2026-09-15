interface Props {
  puntajeInstitucion: number;
  puntajeCaldas: number;
}

export default function PuntajeGlobal({ puntajeInstitucion, puntajeCaldas }: Props) {
  const diferencia = puntajeInstitucion - puntajeCaldas;
  const porEncima = diferencia >= 0;

  return (
    <section className="tarjeta puntaje-global" aria-label="Puntaje global">
      <div>
        <span className="etiqueta-tenue">Puntaje global de la institución</span>
        <div className="puntaje-global-numero">{puntajeInstitucion}</div>
      </div>
      <div className={`puntaje-global-indicador ${porEncima ? 'es-positivo' : 'es-negativo'}`}>
        <span className="puntaje-global-flecha">{porEncima ? '▲' : '▼'}</span>
        <span>
          {Math.abs(diferencia)} puntos {porEncima ? 'por encima' : 'por debajo'} del promedio de Manizales
        </span>
      </div>
      <span className="etiqueta-tenue">Manizales: {puntajeCaldas}</span>
    </section>
  );
}
