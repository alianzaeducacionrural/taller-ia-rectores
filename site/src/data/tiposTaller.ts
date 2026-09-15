export interface CheckInMomento1 {
  institucion: string;
  nombre: string;
  competencia: string;
  afirmacion: string;
  accion: string;
  timestamp?: string;
}

export interface EnvioMomento2 {
  institucion: string;
  nombre: string;
  situacion: string;
  pregunta1: string;
  pregunta2: string;
  pregunta3: string;
  pregunta4: string;
  pregunta5: string;
  desafio: string;
  estrategiaEstudiante: string;
  estrategiaFamilia: string;
  estrategiaEscuela: string;
  estrategiaIa: string;
  timestamp?: string;
}

export interface SeguimientoTaller {
  momento1: CheckInMomento1[];
  momento2: EnvioMomento2[];
}

export interface AreaReporte {
  nombre: string;
  institucion: number;
  manizales: number;
}

export interface CompetenciaReporte {
  competencia: string;
  afirmacion: string;
}

export interface ReporteFinal {
  email: string;
  nombre: string;
  institucionNombre: string;
  puntajeGlobal: number;
  puntajeGlobalManizales: number;
  areas: AreaReporte[];
  competenciasDebiles: CompetenciaReporte[];
  momento1Competencia: string;
  momento1Afirmacion: string;
  momento1Accion: string;
  situacion: string;
  pregunta1: string;
  pregunta2: string;
  pregunta3: string;
  pregunta4: string;
  pregunta5: string;
  desafio: string;
  estrategiaEstudiante: string;
  estrategiaFamilia: string;
  estrategiaEscuela: string;
  estrategiaIa: string;
}
