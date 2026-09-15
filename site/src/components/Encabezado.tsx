interface Props {
  nombreInstitucion: string;
}

export default function Encabezado({ nombreInstitucion }: Props) {
  return (
    <header className="encabezado">
      <span className="encabezado-marca">Comité de Cafeteros de Caldas</span>
      <h1>{nombreInstitucion}</h1>
      <p>Resultados frente al consolidado de Manizales</p>
    </header>
  );
}
