// Instituciones que participan en el taller pero no tienen panel de
// resultados propio (no están entre las 12 del alcance original de
// Momento 1) — en /taller usan la Vista general (/general, consolidado de
// Manizales) en vez de /rector/:slug.
export const INSTITUCIONES_SIN_DASHBOARD_PROPIO = [
  { slug: 'adolfo-hoyos-ocampo', nombre: 'Adolfo Hoyos Ocampo' },
  { slug: 'rafael-pombo', nombre: 'Rafael Pombo' },
] as const;

export const SLUGS_SIN_DASHBOARD_PROPIO: Set<string> = new Set(INSTITUCIONES_SIN_DASHBOARD_PROPIO.map((i) => i.slug));
