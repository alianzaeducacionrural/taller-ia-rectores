// Escala de 3 niveles compartida por "Lo que más pesa mejorar" y "Acierto por
// pregunta" — mismo criterio, un solo lugar para ajustarlo.
export type Severidad = 'alta' | 'media' | 'baja';

export function severidadPorAcierto(pct: number): Severidad {
  if (pct < 40) return 'alta';
  if (pct < 60) return 'media';
  return 'baja';
}

export function colorSeveridad(severidad: Severidad): string {
  if (severidad === 'alta') return 'var(--nivel-insuficiente)';
  if (severidad === 'media') return 'var(--nivel-minimo)';
  return 'var(--nivel-satisfactorio)';
}
