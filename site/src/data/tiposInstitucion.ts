export type CodigoArea = 'MT' | 'LC' | 'CS' | 'NT' | 'IN';

export const AREAS: { codigo: CodigoArea; nombre: string }[] = [
  { codigo: 'MT', nombre: 'Matemáticas' },
  { codigo: 'LC', nombre: 'Lectura Crítica' },
  { codigo: 'CS', nombre: 'Sociales' },
  { codigo: 'NT', nombre: 'Naturales' },
  { codigo: 'IN', nombre: 'Inglés' },
];

export type NivelDesempenoNombre = 'insuficiente' | 'minimo' | 'satisfactorio' | 'avanzado';

export interface ResultadosPorMateria {
  MT: number;
  LC: number;
  CS: number;
  NT: number;
  IN: number;
  global: number;
}

export interface NivelDesempeno {
  materia: CodigoArea;
  insuficiente: number;
  minimo: number;
  satisfactorio: number;
  avanzado: number;
}

export interface CompetenciaDebil {
  materia: CodigoArea;
  competencia: string;
  pctAciertoPromedio: number;
  afirmacion: string;
  evidencia: string;
}

export interface PreguntaEstadistica {
  codigo: string;
  materia: CodigoArea;
  pctAcierto: number;
  competencia: string;
  afirmacion: string;
  evidencia: string;
}

export interface EstudianteDetalle {
  nombre: string;
  areas: Record<CodigoArea, { puntaje: number; nivel: NivelDesempenoNombre }>;
  global: number;
}

export interface InstitucionData {
  correlativo: number;
  nombre: string;
  slug: string;
  esBaseline: boolean;
  resultadosPorMateria: ResultadosPorMateria;
  nivelesDesempeno: NivelDesempeno[];
  competenciasDebiles: CompetenciaDebil[];
  estadisticasPreguntas: PreguntaEstadistica[];
  detalleEstudiantes: EstudianteDetalle[] | null;
}

export interface InstitucionMeta {
  nombre: string;
  correlativo: number;
  esBaseline: boolean;
  sheetId: string | null;
}

export type MapaInstituciones = Record<string, InstitucionMeta>;
