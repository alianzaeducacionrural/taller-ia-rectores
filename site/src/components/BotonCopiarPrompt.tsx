import { useState } from 'react';

interface Props {
  texto: string;
  etiqueta?: string;
}

export default function BotonCopiarPrompt({ texto, etiqueta = '📋 Copiar prompt para IA' }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <button type="button" className="cta-prompt-boton" onClick={copiar}>
      {copiado ? 'Copiado ✓' : etiqueta}
    </button>
  );
}
