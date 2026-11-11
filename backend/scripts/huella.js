// scripts/huella.js
// Muestra la huella de la contraseña de la base del .env (no la contraseña),
// para compararla con la que muestra el log del servidor publicado.
//   node scripts/huella.js
require('dotenv').config();
const crypto = require('crypto');
const pw = String(process.env.DB_PASSWORD || '').trim();
console.log(`contraseña=${pw.length} caracteres huella=${crypto.createHash('sha256').update(pw).digest('hex').slice(0, 8)}`);
