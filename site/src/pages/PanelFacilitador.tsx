import { useCallback, useEffect, useMemo, useState } from 'react';
import BotonCopiarPrompt from '../components/BotonCopiarPrompt';
import { CUADRANTES_ESTRATEGIA } from '../data/momento2';
import { obtenerMapaInstituciones } from '../data/fuenteDatos';
import { INSTITUCIONES_SIN_DASHBOARD_PROPIO } from '../data/institucionesSinDashboard';
import { obtenerSeguimiento, usandoSimulacionLocal } from '../data/tallerApi';
import type { EnvioMomento2, SeguimientoTaller } from '../data/tiposTaller';

// Origen + ruta del sitio ya desplegado (funciona igual en localhost que en
// GitHub Pages, sin hardcodear dominio) — el HashRouter cuelga todo de "#".
const BASE_URL = `${window.location.origin}${window.location.pathname}`;

function FilaEnlace({ nombre, url, destacada }: { nombre: string; url: string; destacada?: boolean }) {
  return (
    <div className={`panel-facilitador-enlace-fila ${destacada ? 'panel-facilitador-enlace-destacada' : ''}`}>
      <div>
        <span className="panel-facilitador-enlace-nombre">{nombre}</span>
        <span className="panel-facilitador-enlace-url">{url}</span>
      </div>
      <div className="panel-facilitador-enlace-acciones">
        <a href={url} target="_blank" rel="noreferrer" className="taller-boton-secundario">
          Abrir ↗
        </a>
        <BotonCopiarPrompt texto={url} etiqueta="Copiar" />
      </div>
    </div>
  );
}

export default function PanelFacilitador() {
  const [datos, setDatos] = useState<SeguimientoTaller | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const instituciones = useMemo(
    () =>
      Object.entries(obtenerMapaInstituciones())
        .filter(([, meta]) => !meta.esBaseline)
        .sort((a, b) => a[1].correlativo - b[1].correlativo),
    [],
  );

  // Para "Participación": las 12 con panel propio + las que solo usan la
  // Vista general (no tienen /rector/:slug, así que no aparecen en "Enlaces
  // de resultados por institución" más abajo).
  const participantes = useMemo(
    () => [
      ...instituciones.map(([slug, meta]) => ({ slug, nombre: meta.nombre })),
      ...INSTITUCIONES_SIN_DASHBOARD_PROPIO.map((i) => ({ slug: i.slug, nombre: i.nombre })),
    ],
    [instituciones],
  );

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    obtenerSeguimiento()
      .then(setDatos)
      .catch(() => setError('No se pudo cargar el seguimiento del taller.'))
      .finally(() => setCargando(false));
  }, []);

  // Carga inicial: no se reutiliza `cargar` aquí (cargando/error ya parten en
  // su valor inicial correcto) para no disparar setState sincrónico dentro
  // del efecto — `cargar` sí lo hace, pero se usa desde el botón "Actualizar".
  useEffect(() => {
    let cancelado = false;
    obtenerSeguimiento()
      .then((d) => {
        if (!cancelado) setDatos(d);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo cargar el seguimiento del taller.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const institucionesConMomento1 = useMemo(() => new Set((datos?.momento1 ?? []).map((c) => c.institucion)), [datos]);
  const envioMasRecientePorInstitucion = useMemo(() => {
    const mapa = new Map<string, EnvioMomento2>();
    const datosMomento2 = datos?.momento2 ?? [];
    for (const envio of datosMomento2) {
      mapa.set(envio.institucion, envio);
    }
    return mapa;
  }, [datos]);

  return (
    <main className="pagina-rector">
      <header className="encabezado">
        <span className="encabezado-marca">Comité de Cafeteros de Caldas</span>
        <h1>Panel del facilitador</h1>
        <p>Seguimiento en vivo del taller — Momento 1 y Momento 2</p>
      </header>

      <section className="tarjeta">
        <div className="panel-facilitador-toolbar">
          <button type="button" className="taller-boton-secundario" onClick={cargar} disabled={cargando}>
            {cargando ? 'Actualizando...' : '↻ Actualizar'}
          </button>
          {usandoSimulacionLocal && (
            <span className="etiqueta-tenue">
              Modo simulación local: solo ves los envíos hechos desde este navegador. Configura VITE_APPS_SCRIPT_URL para ver los envíos
              reales de todas las instituciones.
            </span>
          )}
        </div>
        {error && <p className="taller-error">{error}</p>}
      </section>

      <section className="tarjeta">
        <h2>Enlaces</h2>
        <p className="tarjeta-subtitulo">Todo lo del taller en un solo lugar: presentación, herramienta general, este panel, y el de cada institución.</p>
        <div className="panel-facilitador-enlaces">
          <FilaEnlace nombre="Presentación del taller" url={`${BASE_URL}presentacion.html`} destacada />
          <FilaEnlace nombre="Herramienta del taller (general, para rectores)" url={`${BASE_URL}#/taller`} destacada />
          <FilaEnlace nombre="Panel del facilitador (este panel)" url={`${BASE_URL}#/panel-facilitador`} destacada />
          <FilaEnlace nombre="Vista general (consolidado de Manizales)" url={`${BASE_URL}#/general`} destacada />
        </div>
        <p className="tarjeta-subtitulo" style={{ marginTop: 16 }}>
          Enlace de resultados por institución (uno por rector):
        </p>
        <div className="panel-facilitador-enlaces">
          {instituciones.map(([slug, meta]) => (
            <FilaEnlace key={slug} nombre={meta.nombre} url={`${BASE_URL}#/rector/${slug}`} />
          ))}
        </div>
      </section>

      <section className="tarjeta">
        <h2>Participación</h2>
        <p className="tarjeta-subtitulo">
          {institucionesConMomento1.size} / {participantes.length} completaron Momento 1 · {envioMasRecientePorInstitucion.size} /{' '}
          {participantes.length} enviaron su estrategia de Momento 2
        </p>
        <div className="panel-facilitador-grid">
          {participantes.map(({ slug, nombre: nombreParticipante }) => (
            <div key={slug} className="panel-facilitador-fila">
              <span>{nombreParticipante}</span>
              <span className={`panel-facilitador-estado ${institucionesConMomento1.has(slug) ? 'es-listo' : ''}`}>M1</span>
              <span className={`panel-facilitador-estado ${envioMasRecientePorInstitucion.has(slug) ? 'es-listo' : ''}`}>M2</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tarjeta">
        <h2>Estrategias 3×3 de las instituciones</h2>
        <p className="tarjeta-subtitulo">Para mostrar al cierre del taller.</p>
        <div className="panel-facilitador-estrategias">
          {[...envioMasRecientePorInstitucion.entries()].map(([slug, envio]) => {
            const nombre = participantes.find((p) => p.slug === slug)?.nombre ?? slug;
            return (
              <article key={slug} className="panel-facilitador-tarjeta-estrategia">
                <h3>{nombre}</h3>
                <p className="etiqueta-tenue">{envio.situacion}</p>
                <p className="panel-facilitador-desafio">{envio.desafio}</p>
                <div className="taller-estrategia-grid">
                  {CUADRANTES_ESTRATEGIA.map(({ clave, titulo }) => (
                    <div key={clave}>
                      <span className="etiqueta-tenue">{titulo}</span>
                      <p>{envio[clave]}</p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
          {envioMasRecientePorInstitucion.size === 0 && !cargando && <p className="etiqueta-tenue">Todavía no hay envíos de Momento 2.</p>}
        </div>
      </section>
    </main>
  );
}
