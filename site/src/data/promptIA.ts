// Prompt del Momento 1 — ajustado a la actividad real: el rector selecciona
// un área en "Acierto por pregunta" y toma un pantallazo del gráfico
// completo más las 3 tarjetas (competencia/afirmación/evidencia) que
// aparecen automáticamente para las 3 preguntas con menor acierto de esa
// área. No editar sin actualizar también presentacion_index.html.
export const PROMPT_IA = `Actúa como un asesor experto en gestión directiva educativa y uso pedagógico de resultados de pruebas estandarizadas, con experiencia en instituciones educativas rurales que trabajan bajo el modelo Escuela Nueva.

Te voy a compartir una captura de pantalla con el gráfico de "acierto por pregunta" de un área específica de mi institución, junto con el detalle (competencia, afirmación y evidencia) de las 3 preguntas con menor porcentaje de acierto en esa área. Yo soy el rector o la rectora de esta institución.

Antes de darme una solución, ayúdame a leer e interpretar la información paso a paso:

1. Describe, en un lenguaje claro y sin tecnicismos estadísticos, qué muestran esas 3 preguntas: qué competencias evalúan y qué tan bajo es su acierto frente al resto del área.
2. Identifica las causas más probables de ese resultado en esas competencias específicas, mirándolas por separado desde:
   - el estudiante (motivación, hábitos de estudio, comprensión de la competencia evaluada);
   - el docente y la práctica pedagógica (estrategias de enseñanza, énfasis curricular, acompañamiento);
   - la gestión institucional (tiempo dedicado al área, recursos, articulación entre sedes, particularidades del modelo Escuela Nueva en mi institución).
3. Señala qué preguntas debería hacerme como rector o rectora antes de decidir una estrategia, para no tomar decisiones apresuradas con información incompleta.

Con base en ese análisis, y solo después de haberlo hecho, propón:

4. Para cada una de las 3 competencias, una acción concreta y realista para una institución rural (recursos limitados, posibles aulas multigrado) que yo pueda impulsar directamente como rector o rectora. Para cada una indica: propósito, la acción en sí, responsables, tiempo estimado de implementación, y un indicador simple para saber si está funcionando.
5. Cierra con una recomendación breve de cómo debería socializar esto con mi equipo docente en una reunión de la próxima semana.

Sé específico, evita respuestas genéricas de manual, y ten siempre presente que trabajo bajo el modelo pedagógico Escuela Nueva, con población rural.`;

// Prompts del Momento 2 — mismo texto que presentacion_index.html (PROMPT2/PROMPT3).
export const PROMPT_MOMENTO2_PASO2 =
  'Actúa como asesor experto en liderazgo educativo y participación de las familias. Tengo esta situación en mi institución: [describir situación]. No me des todavía una solución. Primero ayúdame a analizar el problema desde tres perspectivas: estudiante, familia y escuela. Identifica posibles causas, tensiones entre los tres actores, factores que sí puede transformar el liderazgo directivo y preguntas que debería hacerme antes de tomar decisiones.';

export const PROMPT_MOMENTO2_PASO3 =
  'Diseña tres alternativas para abordar esta situación. Cada alternativa debe incluir acciones concretas para estudiante, familia y escuela. La estrategia debe fortalecer la corresponsabilidad y no trasladar toda la responsabilidad a uno de los actores. Para cada alternativa indica: propósito, acciones, responsables, recursos, posibles barreras e indicador de resultado.';
