const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// Alcance requerido para leer hojas de cálculo
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

// Cargar credenciales desde el archivo
function loadCredentials() {
  return JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
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

// Flujo principal
(async function main() {
  try {
    const credentials = loadCredentials();
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Generar un nuevo token
    await getNewToken(oAuth2Client);
  } catch (err) {
    console.error('Error en el flujo principal:', err);
  }
})();
