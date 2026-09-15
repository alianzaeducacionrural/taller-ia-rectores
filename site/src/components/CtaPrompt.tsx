import BotonCopiarPrompt from './BotonCopiarPrompt';
import { PROMPT_IA } from '../data/promptIA';

export default function CtaPrompt() {
  return (
    <section className="tarjeta cta-prompt">
      <h2>Ahora te toca a ti</h2>
      <ol className="cta-prompt-pasos">
        <li>Ve a "Acierto por pregunta" (arriba) y selecciona el área que más te interese.</li>
        <li>Toma una captura de pantalla completa del gráfico y de las 3 tarjetas de detalle que aparecen debajo.</li>
        <li>Copia el siguiente prompt con el botón de abajo y pégalo junto con la captura en tu IA de preferencia (ChatGPT, Claude, Gemini, Copilot...).</li>
        <li>Lee la respuesta y coméntala con la persona de al lado antes de la puesta en común.</li>
      </ol>
      <BotonCopiarPrompt texto={PROMPT_IA} />
      <pre className="cta-prompt-texto">{PROMPT_IA}</pre>
    </section>
  );
}
