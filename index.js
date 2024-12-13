const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Alcance requerido para leer hojas de cálculo
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = './token.json';

// Cargar credenciales desde el archivo
function loadCredentials() {
  return JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
}

// Obtener un cliente OAuth2 autorizado
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  console.log("oAuth2Client .....")
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  console.log("oAuth2Client",oAuth2Client)

  // Intenta cargar el token desde el archivo
  if (fs.existsSync(TOKEN_PATH)) {
    console.log("existsSync")
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    console.log("token",token)
    oAuth2Client.setCredentials(token);
    console.log("oAuth2Client3:",oAuth2Client)
    return oAuth2Client;
  }

  // Si no hay token, solicita uno nuevo
  return getNewToken(oAuth2Client);
}

// Solicitar un nuevo token al usuario
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Autoriza esta aplicación visitando esta URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
    rl.question('Introduce el código que aparece después de autorizar: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return reject('Error al obtener el token:', err);
        oAuth2Client.setCredentials(token);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('Token guardado en:', TOKEN_PATH);
        resolve(oAuth2Client);
      });
    });
  });
}

// Leer datos de Google Sheets
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = '1gIsIrEHxakIzGVw2uoB1V8_FZzc4pDJl2L8hfqdN3SM';
  const range = 'preguntas!A:R'; // Ajusta el rango según tu hoja

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    const rows = res.data.values;
    if (rows.length) {
      console.log('Datos de la hoja:');
      rows.forEach((row) => {
        console.log(row);
      });
    } else {
      console.log('No se encontraron datos.');
    }
  } catch (err) {
    console.error('Error al leer la hoja:', err);
  }
}

// Flujo principal
(async function main() {
  try {
    const credentials = loadCredentials();
    const auth = await authorize(credentials);
    await readSheet(auth);
  } catch (err) {
    console.error('Error en el flujo principal:', err);
  }
})();
