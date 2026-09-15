// Cliente para guardar y leer el seguimiento del taller (check-in de
// Momento 1 y envíos de Momento 2). Sin backend propio: el "servidor" es un
// Google Apps Script Web App (ver ../../../apps-script/Code.gs) que lee y
// escribe un Google Sheet que NUNCA se comparte como "cualquiera con el
// enlace" — a diferencia de los Sheets de resultados, este solo se puede
// leer o escribir a través del Web App.
//
// Mientras VITE_APPS_SCRIPT_URL no esté configurada (el Web App aún no se
// ha desplegado), esta capa cae a un modo de simulación en localStorage, así
// que /taller y /panel-facilitador son usables y probables de punta a punta
// desde ya. En cuanto exista la URL real, el cambio es automático — nada en
// los componentes cambia.
import type { CheckInMomento1, EnvioMomento2, ReporteFinal, SeguimientoTaller } from './tiposTaller';

const URL_APPS_SCRIPT = import.meta.env.VITE_APPS_SCRIPT_URL;
const CLAVE_SIMULACION = 'taller-ia-rectores-simulacion-v1';

function leerSimulacion(): SeguimientoTaller {
  try {
    const crudo = localStorage.getItem(CLAVE_SIMULACION);
    return crudo ? JSON.parse(crudo) : { momento1: [], momento2: [] };
  } catch {
    return { momento1: [], momento2: [] };
  }
}

function guardarSimulacion(datos: SeguimientoTaller) {
  try {
    localStorage.setItem(CLAVE_SIMULACION, JSON.stringify(datos));
  } catch {
    // localStorage no disponible (modo privado, cuota llena, etc.) — se
    // pierde el registro simulado, pero la UI no debe romperse por esto.
  }
}

async function enviarApps(tipo: 'momento1' | 'momento2' | 'reporte-final', datos: object): Promise<void> {
  // text/plain evita el preflight OPTIONS, que los Web Apps de Apps Script
  // no manejan de forma confiable entre orígenes.
  await fetch(URL_APPS_SCRIPT!, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ tipo, ...datos }),
  });
  // Un Web App de Apps Script no siempre deja leer la respuesta entre
  // orígenes: se asume éxito si el POST no lanzó error de red. La
  // confirmación real de que quedó guardado se ve en /panel-facilitador.
}

export async function enviarCheckInMomento1(datos: Omit<CheckInMomento1, 'timestamp'>): Promise<void> {
  const conFecha: CheckInMomento1 = { ...datos, timestamp: new Date().toISOString() };
  if (!URL_APPS_SCRIPT) {
    const actual = leerSimulacion();
    actual.momento1.push(conFecha);
    guardarSimulacion(actual);
    return;
  }
  return enviarApps('momento1', conFecha);
}

export async function enviarMomento2(datos: Omit<EnvioMomento2, 'timestamp'>): Promise<void> {
  const conFecha: EnvioMomento2 = { ...datos, timestamp: new Date().toISOString() };
  if (!URL_APPS_SCRIPT) {
    const actual = leerSimulacion();
    actual.momento2.push(conFecha);
    guardarSimulacion(actual);
    return;
  }
  return enviarApps('momento2', conFecha);
}

export async function enviarReporteFinal(datos: ReporteFinal): Promise<void> {
  if (!URL_APPS_SCRIPT) {
    // En simulación local no hay cómo enviar un correo real — se deja
    // constancia en consola para poder revisar el payload durante desarrollo.
    console.info('[simulación] reporte final que se enviaría por correo:', datos);
    return;
  }
  return enviarApps('reporte-final', datos);
}

export async function obtenerSeguimiento(): Promise<SeguimientoTaller> {
  if (!URL_APPS_SCRIPT) {
    return leerSimulacion();
  }
  const res = await fetch(URL_APPS_SCRIPT);
  if (!res.ok) throw new Error('No se pudo cargar el seguimiento del taller.');
  return res.json();
}

export const usandoSimulacionLocal = !URL_APPS_SCRIPT;
