/**
 * Backend mínimo (Google Apps Script Web App) para la herramienta /taller del
 * sitio: recibe el check-in del Momento 1 y el envío del Momento 2 por POST,
 * los guarda como filas en un Google Sheet dedicado a seguimiento del taller
 * (NO uno de los 13 Sheets de resultados por institución), y al terminar el
 * Momento 2 genera un PDF con toda la ruta del rector (resultados del
 * Momento 1 + estrategia del Momento 2) y lo envía por correo con MailApp.
 *
 * Cuota de MailApp: la cuenta que despliega el Web App (Execute as: Me) tiene
 * un límite diario de correos salientes (100/día en una cuenta gratuita de
 * Gmail, más en Workspace) — de sobra para un taller de 12 instituciones,
 * pero tenlo presente si se reutiliza este script para algo de mayor volumen.
 *
 * Nunca se comparte este Sheet como "cualquiera con el enlace" — el único
 * punto de acceso público es este Web App, así que quien no tenga el enlace
 * del Web App no puede leer ni escribir nada.
 *
 * YA DESPLEGADO (2026-09-15). Vive dentro de la carpeta de Drive
 * "Capacitación rectores IA" (https://drive.google.com/drive/folders/1FZCg3Evmt-Cak-BAgfDUzQztlheCKCZs),
 * cuenta edurural.osorio.alejandro@gmail.com:
 * - Sheet de seguimiento: https://docs.google.com/spreadsheets/d/1sdxaAbtxd0JTrFoVLB2gcZEz5QUmvMdOU_m5xyZQFBA/edit
 * - Web App (URL /exec, para VITE_APPS_SCRIPT_URL en site/.env):
 *   https://script.google.com/macros/s/AKfycbyfs1DHcw67SzMehnY-xlqi4glClHeT6KzfrDcwhOajxvfUvc7aHMJWONmEVZjWOmjUow/exec
 *
 * Si hay que rehacer el despliegue desde cero (otra cuenta, otro entorno):
 * 1. Crear el Sheet de seguimiento con las 2 pestañas de arriba (encabezados:
 *    ver CAMPOS_MOMENTO1 / CAMPOS_MOMENTO2 abajo) y pegar su ID en SHEET_ID.
 * 2. Desde esta carpeta: clasp login && clasp push (si no hay .clasp.json
 *    todavía, antes: clasp create-script --type webapp --title "..." --rootDir .).
 * 3. clasp create-deployment (o redeploy con update-deployment). El primer
 *    acceso al /exec SIEMPRE requiere abrirlo una vez en un navegador ya
 *    logueado con la cuenta dueña del script y aceptar el aviso de
 *    "Autorizar acceso" — ni clasp run ni curl pueden hacer ese clic.
 * 4. Pegar la URL /exec en site/.env como VITE_APPS_SCRIPT_URL.
 *
 * LOS 13 SHEETS DE RESULTADOS (2026-09-15): ya creados y con sheetId real en
 * site/src/data/mapaInstituciones.json — se generaron con un endpoint
 * temporal ('setup-crear-institucion' en doPost + función crearSheetInstitucion,
 * ya removidos de este archivo tras usarse una sola vez) que recibía cada
 * institución por POST (datos extraídos de Info_Comite/*.xlsx) y usaba
 * SpreadsheetApp.create + DriveApp para crear, llenar, compartir como
 * "cualquiera con el enlace: lector" y mover el Sheet a la carpeta
 * "Capacitación rectores IA". Igual que con el Sheet de seguimiento, la
 * primera vez que el código usó DriveApp pidió una reautorización interactiva
 * (Ejecutar una función de prueba desde el editor, no vía Web App). Si hace
 * falta recrear o agregar una institución más adelante, este es el patrón a
 * reusar: no hay que reinventar la migración de datos, solo restaurar
 * temporalmente ese endpoint.
 */

// Sheet "Seguimiento Taller IA Rectores" ya creado y configurado dentro de
// la carpeta de Drive "Capacitación rectores IA":
// https://docs.google.com/spreadsheets/d/1sdxaAbtxd0JTrFoVLB2gcZEz5QUmvMdOU_m5xyZQFBA/edit
const SHEET_ID = '1sdxaAbtxd0JTrFoVLB2gcZEz5QUmvMdOU_m5xyZQFBA';
const TAB_MOMENTO1 = 'Momento1';
const TAB_MOMENTO2 = 'Momento2';

const CAMPOS_MOMENTO1 = ['timestamp', 'institucion', 'nombre', 'competencia', 'afirmacion', 'accion'];
const CAMPOS_MOMENTO2 = [
  'timestamp', 'institucion', 'nombre', 'situacion',
  'pregunta1', 'pregunta2', 'pregunta3', 'pregunta4', 'pregunta5',
  'desafio', 'estrategiaEstudiante', 'estrategiaFamilia', 'estrategiaEscuela', 'estrategiaIa',
];

function doGet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const cuerpo = {
    momento1: leerFilas(ss.getSheetByName(TAB_MOMENTO1)),
    momento2: leerFilas(ss.getSheetByName(TAB_MOMENTO2)),
  };
  return respuestaJson(cuerpo);
}

function doPost(e) {
  let datos;
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    return respuestaJson({ ok: false, error: 'JSON inválido' });
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);
  if (datos.tipo === 'momento1') {
    escribirFila(ss.getSheetByName(TAB_MOMENTO1), CAMPOS_MOMENTO1, datos);
  } else if (datos.tipo === 'momento2') {
    escribirFila(ss.getSheetByName(TAB_MOMENTO2), CAMPOS_MOMENTO2, datos);
  } else if (datos.tipo === 'reporte-final') {
    generarYEnviarInforme(datos);
  } else {
    return respuestaJson({ ok: false, error: 'tipo desconocido: ' + datos.tipo });
  }
  return respuestaJson({ ok: true });
}

/**
 * Arma un informe en PDF (resultados del Momento 1 + ruta del Momento 2) y lo
 * envía por correo al rector. Si el envío falla, el error queda en los logs
 * de ejecución de Apps Script, pero no afecta el registro ya guardado en el
 * Sheet (doPost ya escribió la fila del Momento 2 antes de llegar aquí).
 */
function generarYEnviarInforme(d) {
  const html = construirHtmlInforme(d);
  const pdf = Utilities.newBlob(html, 'text/html', 'informe.html')
    .getAs('application/pdf')
    .setName('Informe taller IA - ' + d.institucionNombre + '.pdf');

  MailApp.sendEmail({
    to: d.email,
    subject: 'Tu informe del taller "La IA como copiloto de la gestión directiva"',
    body:
      'Hola ' + d.nombre + ',\n\n' +
      'Adjunto va tu informe con los resultados del Momento 1 (' + d.institucionNombre + ' frente a Manizales) ' +
      'y la estrategia 3×3 que construiste en el Momento 2.\n\n' +
      'Comité de Cafeteros de Caldas · Área de Educación',
    attachments: [pdf],
  });
}

function escaparHtml(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function construirHtmlInforme(d) {
  const filasAreas = (d.areas || [])
    .map(function (a) {
      return '<tr><td>' + escaparHtml(a.nombre) + '</td><td>' + escaparHtml(a.institucion) + '</td><td>' + escaparHtml(a.manizales) + '</td></tr>';
    })
    .join('');

  const listaCompetencias = (d.competenciasDebiles || [])
    .map(function (c) {
      return '<li><strong>' + escaparHtml(c.competencia) + '</strong>: ' + escaparHtml(c.afirmacion) + '</li>';
    })
    .join('');

  return (
    '<html><body style="font-family:Arial, sans-serif; color:#1f2933; line-height:1.5;">' +
    '<h1 style="color:#0d9488;">Taller &quot;La IA como copiloto de la gestión directiva&quot;</h1>' +
    '<h2>' + escaparHtml(d.institucionNombre) + ' — ' + escaparHtml(d.nombre) + '</h2>' +
    '<h3>Momento 1 · Resultados frente a Manizales</h3>' +
    '<p>Puntaje global: <strong>' + escaparHtml(d.puntajeGlobal) + '</strong> (Manizales: ' + escaparHtml(d.puntajeGlobalManizales) + ')</p>' +
    '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">' +
    '<tr><th>Área</th><th>Institución</th><th>Manizales</th></tr>' + filasAreas + '</table>' +
    '<h4>Competencias donde más se necesita reforzar</h4>' +
    '<ul>' + listaCompetencias + '</ul>' +
    '<p><strong>Competencia trabajada:</strong> ' + escaparHtml(d.momento1Competencia) + '</p>' +
    '<p><strong>Afirmación:</strong> ' + escaparHtml(d.momento1Afirmacion) + '</p>' +
    '<p><strong>Acción a realizar (según la IA):</strong> ' + escaparHtml(d.momento1Accion) + '</p>' +
    '<h3>Momento 2 · Su tríada</h3>' +
    '<p><strong>Situación elegida:</strong> ' + escaparHtml(d.situacion) + '</p>' +
    '<p><strong>¿Qué está ocurriendo?</strong> ' + escaparHtml(d.pregunta1) + '</p>' +
    '<p><strong>¿A quién afecta?</strong> ' + escaparHtml(d.pregunta2) + '</p>' +
    '<p><strong>¿Qué estamos haciendo actualmente?</strong> ' + escaparHtml(d.pregunta3) + '</p>' +
    '<p><strong>¿Qué no está funcionando?</strong> ' + escaparHtml(d.pregunta4) + '</p>' +
    '<p><strong>¿Qué necesitaríamos cambiar?</strong> ' + escaparHtml(d.pregunta5) + '</p>' +
    '<p><strong>Desafío de liderazgo:</strong> ' + escaparHtml(d.desafio) + '</p>' +
    '<h3>Mi estrategia 3×3</h3>' +
    '<p><strong>Estudiante:</strong> ' + escaparHtml(d.estrategiaEstudiante) + '</p>' +
    '<p><strong>Familia:</strong> ' + escaparHtml(d.estrategiaFamilia) + '</p>' +
    '<p><strong>Escuela:</strong> ' + escaparHtml(d.estrategiaEscuela) + '</p>' +
    '<p><strong>IA como apoyo:</strong> ' + escaparHtml(d.estrategiaIa) + '</p>' +
    '<p style="margin-top:24px;color:#7b8794;font-size:12px;">Comité de Cafeteros de Caldas · Área de Educación</p>' +
    '</body></html>'
  );
}

function escribirFila(hoja, campos, datos) {
  hoja.appendRow(campos.map((campo) => (campo in datos ? datos[campo] : '')));
}

function leerFilas(hoja) {
  if (!hoja || hoja.getLastRow() < 2) return [];
  const valores = hoja.getDataRange().getValues();
  const encabezados = valores[0];
  return valores.slice(1).map((fila) => {
    const obj = {};
    encabezados.forEach((clave, i) => { obj[clave] = fila[i]; });
    return obj;
  });
}

function respuestaJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
