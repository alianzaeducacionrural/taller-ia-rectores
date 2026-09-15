// Contenido estructurado del Momento 2 — mismo guion que
// Contexto_Traspaso_Claude_Code/presentacion_index.html y
// ACTIVIDAD INTELIGENCIA ARTIFICIAL.docx.

export const SITUACIONES = [
  'Baja participación de las familias',
  'Dificultades de comunicación familia–escuela',
  'Desmotivación de los estudiantes',
  'Inasistencia o riesgo de deserción',
  'Bajo acompañamiento familiar al aprendizaje',
  'Conflictos entre estudiantes y familias',
  'Poca participación de los estudiantes en las decisiones escolares',
];

export const PREGUNTAS_GUIA = [
  { clave: 'pregunta1', texto: '¿Qué está ocurriendo?' },
  { clave: 'pregunta2', texto: '¿A quién afecta?' },
  { clave: 'pregunta3', texto: '¿Qué estamos haciendo actualmente?' },
  { clave: 'pregunta4', texto: '¿Qué no está funcionando?' },
  { clave: 'pregunta5', texto: '¿Qué necesitaríamos cambiar?' },
] as const;

export const CRITERIOS = [
  { clave: 'Pertinencia', pregunta: '¿Responde realmente a mi contexto?' },
  { clave: 'Viabilidad', pregunta: '¿Podemos implementarla con nuestros recursos y capacidades?' },
  { clave: 'Transformación', pregunta: '¿Fortalece realmente la relación familia–escuela–estudiante?' },
];

export const CUADRANTES_ESTRATEGIA = [
  { clave: 'estrategiaEstudiante' as const, titulo: 'Estudiante', pregunta: '¿Qué haré para que tenga voz, participación y responsabilidad?' },
  { clave: 'estrategiaFamilia' as const, titulo: 'Familia', pregunta: '¿Qué haré para que pase de receptora de información a corresponsable del proceso?' },
  { clave: 'estrategiaEscuela' as const, titulo: 'Escuela', pregunta: '¿Qué debe transformar la institución, y qué debe liderar el rector?' },
  { clave: 'estrategiaIa' as const, titulo: 'IA como apoyo', pregunta: '¿Cómo usaremos la IA para sostener, mejorar o hacer seguimiento a la estrategia?' },
];
