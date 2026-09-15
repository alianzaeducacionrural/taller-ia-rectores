import { useMemo, useState } from 'react';
import BotonCopiarPrompt from '../components/BotonCopiarPrompt';
import { AREAS } from '../data/tiposInstitucion';
import { obtenerDatosInstitucion, obtenerMapaInstituciones } from '../data/fuenteDatos';
import { INSTITUCIONES_SIN_DASHBOARD_PROPIO, SLUGS_SIN_DASHBOARD_PROPIO } from '../data/institucionesSinDashboard';
import { CRITERIOS, CUADRANTES_ESTRATEGIA, PREGUNTAS_GUIA, SITUACIONES } from '../data/momento2';
import { PROMPT_IA, PROMPT_MOMENTO2_PASO2, PROMPT_MOMENTO2_PASO3 } from '../data/promptIA';
import { enviarCheckInMomento1, enviarMomento2, enviarReporteFinal } from '../data/tallerApi';

type Paso = 'identificacion' | 'momento1' | 'esperando' | 'm2-paso1' | 'm2-paso2' | 'm2-paso3' | 'm2-paso4' | 'enviado';

const ORDEN_PASOS: Paso[] = ['identificacion', 'momento1', 'esperando', 'm2-paso1', 'm2-paso2', 'm2-paso3', 'm2-paso4', 'enviado'];

const ETIQUETA_PASO: Partial<Record<Paso, string>> = {
  momento1: 'Momento 1',
  esperando: 'Transición',
  'm2-paso1': 'Momento 2 · Paso 1',
  'm2-paso2': 'Momento 2 · Paso 2',
  'm2-paso3': 'Momento 2 · Paso 3',
  'm2-paso4': 'Momento 2 · Paso 4',
};

const RESPUESTAS_VACIAS = { pregunta1: '', pregunta2: '', pregunta3: '', pregunta4: '', pregunta5: '' };
const ESTRATEGIA_VACIA = { estrategiaEstudiante: '', estrategiaFamilia: '', estrategiaEscuela: '', estrategiaIa: '' };

export default function TallerRector() {
  const instituciones = useMemo(
    () =>
      Object.entries(obtenerMapaInstituciones())
        .filter(([, meta]) => !meta.esBaseline)
        .sort((a, b) => a[1].correlativo - b[1].correlativo),
    [],
  );

  // Para el selector del taller: las 12 con panel propio + las que solo
  // tienen acceso a la Vista general (sin dashboard individual).
  const opcionesInstitucion = useMemo(
    () => [
      ...instituciones.map(([slug, meta]) => ({ slug, nombre: meta.nombre })),
      ...INSTITUCIONES_SIN_DASHBOARD_PROPIO.map((i) => ({ slug: i.slug, nombre: i.nombre })),
    ],
    [instituciones],
  );

  const [paso, setPaso] = useState<Paso>('identificacion');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [institucionSlug, setInstitucionSlug] = useState('');

  const [competenciaM1, setCompetenciaM1] = useState('');
  const [afirmacionM1, setAfirmacionM1] = useState('');
  const [accionM1, setAccionM1] = useState('');

  const [situacion, setSituacion] = useState('');
  const [respuestas, setRespuestas] = useState(RESPUESTAS_VACIAS);
  const [desafioQue, setDesafioQue] = useState('');
  const [desafioPara, setDesafioPara] = useState('');

  const [estrategia, setEstrategia] = useState(ESTRATEGIA_VACIA);

  const nombreInstitucion = opcionesInstitucion.find((i) => i.slug === institucionSlug)?.nombre ?? '';
  const tienePanelPropio = institucionSlug !== '' && !SLUGS_SIN_DASHBOARD_PROPIO.has(institucionSlug);
  const urlPanelResultados = `${window.location.origin}${window.location.pathname}#/${tienePanelPropio ? `rector/${institucionSlug}` : 'general'}`;
  const desafio = `¿Cómo podría transformar ${desafioQue || '______'} para lograr que ${desafioPara || '______'}?`;

  async function confirmarMomento1() {
    setError(null);
    setEnviando(true);
    try {
      await enviarCheckInMomento1({
        institucion: institucionSlug,
        nombre,
        competencia: competenciaM1,
        afirmacion: afirmacionM1,
        accion: accionM1,
      });
      setPaso('esperando');
    } catch {
      setError('No se pudo registrar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function enviarEstrategiaFinal() {
    setError(null);
    setEnviando(true);
    try {
      await enviarMomento2({
        institucion: institucionSlug,
        nombre,
        situacion,
        ...respuestas,
        desafio,
        ...estrategia,
      });

      // El informe en PDF necesita también los resultados del Momento 1, no
      // solo lo del Momento 2 — se arman aquí porque en este punto ya se
      // tienen los dos. Si la institución no tiene panel propio (usa la
      // Vista general), se reporta con los datos consolidados de Manizales.
      try {
        const manizales = await obtenerDatosInstitucion('caldas');
        const institucion = tienePanelPropio ? await obtenerDatosInstitucion(institucionSlug) : manizales;
        await enviarReporteFinal({
          email,
          nombre,
          institucionNombre: nombreInstitucion || institucion.nombre,
          puntajeGlobal: institucion.resultadosPorMateria.global,
          puntajeGlobalManizales: manizales.resultadosPorMateria.global,
          areas: AREAS.map(({ codigo, nombre: nombreArea }) => ({
            nombre: nombreArea,
            institucion: institucion.resultadosPorMateria[codigo],
            manizales: manizales.resultadosPorMateria[codigo],
          })),
          competenciasDebiles: institucion.competenciasDebiles.map((c) => ({ competencia: c.competencia, afirmacion: c.afirmacion })),
          momento1Competencia: competenciaM1,
          momento1Afirmacion: afirmacionM1,
          momento1Accion: accionM1,
          situacion,
          ...respuestas,
          desafio,
          ...estrategia,
        });
      } catch {
        // El envío del correo con PDF es un "extra": si falla, no debe
        // bloquear la confirmación de que la estrategia ya quedó guardada.
      }

      setPaso('enviado');
    } catch {
      setError('No se pudo enviar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const indiceActual = ORDEN_PASOS.indexOf(paso);

  return (
    <main className="pagina-taller">
      <header className="encabezado">
        <span className="encabezado-marca">Comité de Cafeteros de Caldas</span>
        <h1>Taller de IA para rectores</h1>
        <p>La IA como copiloto de la gestión directiva</p>
      </header>

      {ETIQUETA_PASO[paso] && (
        <div className="taller-progreso">
          <span>{ETIQUETA_PASO[paso]}</span>
          <div className="taller-progreso-barra">
            <div className="taller-progreso-relleno" style={{ width: `${(indiceActual / (ORDEN_PASOS.length - 1)) * 100}%` }} />
          </div>
        </div>
      )}

      {paso === 'identificacion' && (
        <section className="tarjeta">
          <h2>Antes de empezar, cuéntanos quién eres</h2>
          <p className="tarjeta-subtitulo">Con esto identificamos tus envíos y te mandamos tu informe al terminar.</p>
          <div className="taller-campo">
            <label htmlFor="nombre">Tu nombre</label>
            <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="taller-campo">
            <label htmlFor="email">Tu correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
            />
            <span className="etiqueta-tenue">Al terminar el taller te enviamos ahí un PDF con toda tu ruta (Momento 1 y Momento 2).</span>
          </div>
          <div className="taller-campo">
            <label htmlFor="institucion">Tu institución</label>
            <select id="institucion" value={institucionSlug} onChange={(e) => setInstitucionSlug(e.target.value)}>
              <option value="">Selecciona tu institución...</option>
              {opcionesInstitucion.map(({ slug, nombre: nombreOpcion }) => (
                <option key={slug} value={slug}>
                  {nombreOpcion}
                </option>
              ))}
            </select>
          </div>
          <div className="taller-acciones">
            <button
              type="button"
              className="taller-boton-primario"
              disabled={!nombre.trim() || !institucionSlug || !email.includes('@')}
              onClick={() => setPaso('momento1')}
            >
              Empezar
            </button>
          </div>
        </section>
      )}

      {paso === 'momento1' && (
        <section className="tarjeta">
          <h2>Momento 1 · Sus resultados</h2>
          <div className="taller-acciones" style={{ marginTop: 4, marginBottom: 4 }}>
            <a href={urlPanelResultados} target="_blank" rel="noreferrer" className="taller-boton-primario">
              📊 Abrir el panel de {nombreInstitucion || 'mi institución'} ↗
            </a>
          </div>
          <ol className="cta-prompt-pasos">
            <li>Explora tu panel de resultados (botón de arriba, se abre en otra pestaña).</li>
            <li>
              Ve a <strong>Acierto por pregunta</strong> y selecciona un área — abajo aparecen solas las 3 preguntas con menor acierto.
            </li>
            <li>Toma una captura completa del gráfico y de esas 3 tarjetas de detalle.</li>
            <li>Copia el prompt de abajo y pégalo junto con tu captura en tu IA de preferencia.</li>
          </ol>
          <BotonCopiarPrompt texto={PROMPT_IA} />
          <pre className="cta-prompt-texto">{PROMPT_IA}</pre>

          <div className="taller-preguntas" style={{ marginTop: 20 }}>
            <p className="tarjeta-subtitulo" style={{ marginBottom: 10 }}>
              Con lo que te respondió la IA sobre una de esas 3 preguntas, completa:
            </p>
            <div className="taller-campo">
              <label htmlFor="competenciaM1">Competencia trabajada</label>
              <input
                id="competenciaM1"
                type="text"
                placeholder="Ej.: Razonamiento y argumentación"
                value={competenciaM1}
                onChange={(e) => setCompetenciaM1(e.target.value)}
              />
            </div>
            <div className="taller-campo">
              <label htmlFor="afirmacionM1">Afirmación</label>
              <textarea id="afirmacionM1" rows={2} value={afirmacionM1} onChange={(e) => setAfirmacionM1(e.target.value)} />
            </div>
            <div className="taller-campo">
              <label htmlFor="accionM1">¿Qué acción vas a realizar, según lo que te sugirió la IA?</label>
              <textarea id="accionM1" rows={3} value={accionM1} onChange={(e) => setAccionM1(e.target.value)} />
              <span className="etiqueta-tenue">Esto queda guardado y va incluido en tu PDF final — es lo que le compartes al facilitador.</span>
            </div>
          </div>

          {error && <p className="taller-error">{error}</p>}
          <div className="taller-acciones">
            <button
              type="button"
              className="taller-boton-primario"
              disabled={enviando || !competenciaM1.trim() || !afirmacionM1.trim() || !accionM1.trim()}
              onClick={confirmarMomento1}
            >
              {enviando ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </section>
      )}

      {paso === 'esperando' && (
        <section className="tarjeta">
          <h2>Buen trabajo</h2>
          <p className="tarjeta-subtitulo">Tu Momento 1 quedó registrado. Esperen la indicación del facilitador para continuar al Momento 2.</p>
          <div className="taller-acciones">
            <button type="button" className="taller-boton-primario" onClick={() => setPaso('m2-paso1')}>
              Continuar al Momento 2
            </button>
          </div>
        </section>
      )}

      {paso === 'm2-paso1' && (
        <section className="tarjeta">
          <h2>Momento 2 · Paso 1 — ¿Dónde está hoy mi tríada?</h2>
          <p className="tarjeta-subtitulo">Elige una situación real de tu institución:</p>
          <div className="taller-situaciones">
            {SITUACIONES.map((s) => (
              <button
                key={s}
                type="button"
                className={`taller-situacion-btn ${situacion === s ? 'es-activo' : ''}`}
                onClick={() => setSituacion(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="taller-preguntas">
            {PREGUNTAS_GUIA.map(({ clave, texto }) => (
              <div className="taller-campo" key={clave}>
                <label htmlFor={clave}>{texto}</label>
                <textarea
                  id={clave}
                  rows={2}
                  value={respuestas[clave]}
                  onChange={(e) => setRespuestas((r) => ({ ...r, [clave]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="taller-desafio">
            <span className="etiqueta-tenue">Tu desafío de liderazgo</span>
            <p className="cta-prompt-pasos-desafio">
              ¿Cómo podría transformar{' '}
              <input
                type="text"
                value={desafioQue}
                onChange={(e) => setDesafioQue(e.target.value)}
                placeholder="______"
                className="taller-desafio-input"
              />{' '}
              para lograr que{' '}
              <input
                type="text"
                value={desafioPara}
                onChange={(e) => setDesafioPara(e.target.value)}
                placeholder="______"
                className="taller-desafio-input"
              />
              ?
            </p>
          </div>

          <div className="taller-acciones">
            <button
              type="button"
              className="taller-boton-primario"
              disabled={!situacion || !desafioQue.trim() || !desafioPara.trim()}
              onClick={() => setPaso('m2-paso2')}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {paso === 'm2-paso2' && (
        <section className="tarjeta">
          <h2>Momento 2 · Paso 2 — Pregúntele a la IA lo que usted todavía no está viendo</h2>
          <p className="tarjeta-subtitulo">
            Reemplaza <code>[describir situación]</code> por lo que escribiste en el paso 1 y pégalo en tu IA de preferencia.
          </p>
          <BotonCopiarPrompt texto={PROMPT_MOMENTO2_PASO2} />
          <pre className="cta-prompt-texto">{PROMPT_MOMENTO2_PASO2}</pre>
          <div className="taller-acciones">
            <button type="button" className="taller-boton-secundario" onClick={() => setPaso('m2-paso1')}>
              Atrás
            </button>
            <button type="button" className="taller-boton-primario" onClick={() => setPaso('m2-paso3')}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {paso === 'm2-paso3' && (
        <section className="tarjeta">
          <h2>Momento 2 · Paso 3 · El reto — Diseño una solución para los tres, no para uno</h2>
          <BotonCopiarPrompt texto={PROMPT_MOMENTO2_PASO3} />
          <pre className="cta-prompt-texto">{PROMPT_MOMENTO2_PASO3}</pre>
          <p className="tarjeta-subtitulo">No adoptes la primera propuesta tal cual — compárala con estos tres criterios:</p>
          <div className="taller-criterios">
            {CRITERIOS.map((c) => (
              <div className="critcard-taller" key={c.clave}>
                <div className="critcard-taller-k">{c.clave}</div>
                <p>{c.pregunta}</p>
              </div>
            ))}
          </div>
          <div className="taller-acciones">
            <button type="button" className="taller-boton-secundario" onClick={() => setPaso('m2-paso2')}>
              Atrás
            </button>
            <button type="button" className="taller-boton-primario" onClick={() => setPaso('m2-paso4')}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {paso === 'm2-paso4' && (
        <section className="tarjeta">
          <h2>Momento 2 · Paso 4 · Producto final — Mi estrategia 3×3</h2>
          <p className="tarjeta-subtitulo">Con base en lo que te propuso la IA y tu propio criterio, construye tu ruta final.</p>
          <div className="taller-estrategia-grid">
            {CUADRANTES_ESTRATEGIA.map(({ clave, titulo, pregunta }) => (
              <div className="taller-campo" key={clave}>
                <label htmlFor={clave}>
                  {titulo} <span className="etiqueta-tenue">— {pregunta}</span>
                </label>
                <textarea
                  id={clave}
                  rows={3}
                  value={estrategia[clave]}
                  onChange={(e) => setEstrategia((s) => ({ ...s, [clave]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          {error && <p className="taller-error">{error}</p>}
          <div className="taller-acciones">
            <button type="button" className="taller-boton-secundario" onClick={() => setPaso('m2-paso3')}>
              Atrás
            </button>
            <button
              type="button"
              className="taller-boton-primario"
              disabled={enviando || Object.values(estrategia).some((v) => !v.trim())}
              onClick={enviarEstrategiaFinal}
            >
              {enviando ? 'Enviando...' : 'Enviar mi estrategia'}
            </button>
          </div>
        </section>
      )}

      {paso === 'enviado' && (
        <section className="tarjeta">
          <h2>¡Listo!</h2>
          <p className="tarjeta-subtitulo">
            Tu estrategia 3×3 quedó registrada. En breve te llega a <strong>{email}</strong> un PDF con toda tu ruta del Momento 1 y el
            Momento 2. En los dos momentos la IA les ayudó a ver más — la decisión y el liderazgo siguen siendo suyos.
          </p>
        </section>
      )}
    </main>
  );
}
