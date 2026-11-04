// scripts/resetAdmin.js
// Utilidad de mantenimiento: usa la misma conexión del .env que el backend.
//
//   node scripts/resetAdmin.js                     -> lista los usuarios Admin
//   node scripts/resetAdmin.js <usuario> <clave>   -> cambia la clave de ese usuario (y lo reactiva)
//   node scripts/resetAdmin.js --crear <usuario> <clave> -> crea un Admin nuevo
//
// Además, aplica las migraciones 001 (arqueo de caja / transferencia) y
// 002 (código de recuperación) si todavía faltan.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/db');
const { aplicarMigraciones } = require('../src/config/migraciones');


async function main() {
  const args = process.argv.slice(2);
  await sequelize.authenticate();
  console.log(`Conectado a ${process.env.DB_HOST} / ${process.env.DB_NAME}`);

  await aplicarMigraciones();
  console.log('Migraciones: OK');

  if (args[0] === '--crear') {
    const [usuario, clave] = args.slice(1);
    if (!usuario || !clave) throw new Error('Uso: node scripts/resetAdmin.js --crear <usuario> <clave>');
    const hash = await bcrypt.hash(clave, 10);
    await sequelize.query(
      'INSERT INTO usuarios (id_Rol, Nombre, Apellido, Usuario, password_hash, Activo) VALUES (1, ?, ?, ?, ?, 1)',
      { replacements: ['Admin', 'Kiosco', usuario, hash] }
    );
    console.log(`Admin "${usuario}" creado.`);
  } else if (args.length >= 2) {
    const [usuario, clave] = args;
    const hash = await bcrypt.hash(clave, 10);
    const [resultado] = await sequelize.query(
      'UPDATE usuarios SET password_hash = ?, Activo = 1 WHERE Usuario = ?',
      { replacements: [hash, usuario] }
    );
    if (!resultado.affectedRows) {
      console.log(`No existe el usuario "${usuario}". Corré el script sin argumentos para ver la lista.`);
    } else {
      console.log(`Clave de "${usuario}" actualizada.`);
    }
  }

  const [admins] = await sequelize.query(
    'SELECT u.Usuario, u.Nombre, u.Apellido, u.Activo FROM usuarios u JOIN roles r ON r.id_Rol = u.id_Rol WHERE r.Nombre = ?',
    { replacements: ['Admin'] }
  );
  console.log('\nUsuarios Admin:');
  if (!admins.length) console.log('  (ninguno) -> creá uno con: node scripts/resetAdmin.js --crear admin admin123');
  admins.forEach((a) => console.log(`  - ${a.Usuario} (${a.Nombre} ${a.Apellido})${a.Activo ? '' : ' [inactivo]'}`));
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
