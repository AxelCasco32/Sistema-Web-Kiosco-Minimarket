// scripts/resetAdmin.js
// Utilidad de mantenimiento: usa la misma conexión del .env que el backend.
//
//   node scripts/resetAdmin.js                     -> lista los usuarios Admin
//   node scripts/resetAdmin.js <usuario> <clave>   -> cambia la clave de ese usuario (y lo reactiva)
//   node scripts/resetAdmin.js --crear <usuario> <clave> -> crea un Admin nuevo
//
// Además, aplica la migración 001 (arqueo de caja / transferencia) si todavía falta.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../src/config/db');

async function columnasDe(tabla) {
  const [filas] = await sequelize.query(`SHOW COLUMNS FROM \`${tabla}\``);
  return filas.map((f) => f.Field);
}

async function aplicarMigracion001() {
  const cols = await columnasDe('turnos_caja');
  if (!cols.includes('Fondo_Inicial')) {
    console.log('Aplicando migración 001 en turnos_caja...');
    await sequelize.query(
      "ALTER TABLE `turnos_caja` ADD COLUMN `Fondo_Inicial` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `Hora_Cierre`"
    );
    await sequelize.query(
      "UPDATE `turnos_caja` SET `Fondo_Inicial` = IFNULL(`Total_Efectivo`, 0) WHERE `Estado` = 'Abierto'"
    );
    await sequelize.query(
      "UPDATE `turnos_caja` t SET t.`Fondo_Inicial` = GREATEST(0, IFNULL(t.`Total_Efectivo`, 0) - IFNULL((" +
        "SELECT SUM(v.`Total_Venta`) FROM `venta` v WHERE v.`id_turno` = t.`idturnos_caja` AND LOWER(v.`Metodo_Pago`) = 'efectivo'" +
        "), 0)) WHERE t.`Estado` = 'Cerrado'"
    );
  }
  if (!cols.includes('Efectivo_Contado')) {
    await sequelize.query(
      "ALTER TABLE `turnos_caja` ADD COLUMN `Efectivo_Contado` DECIMAL(12,2) DEFAULT NULL AFTER `Total_Tarjeta`"
    );
  }
  if (!cols.includes('Diferencia')) {
    await sequelize.query(
      "ALTER TABLE `turnos_caja` ADD COLUMN `Diferencia` DECIMAL(12,2) DEFAULT NULL AFTER `Efectivo_Contado`"
    );
  }

  const [[metodo]] = await sequelize.query("SHOW COLUMNS FROM `venta` LIKE 'Metodo_Pago'");
  if (metodo && /^enum/i.test(metodo.Type) && !/transferencia/i.test(metodo.Type)) {
    await sequelize.query(
      "ALTER TABLE `venta` MODIFY `Metodo_Pago` ENUM('Efectivo','QR','Tarjeta','Transferencia') NOT NULL"
    );
  }
  console.log('Migración 001: OK');
}

async function main() {
  const args = process.argv.slice(2);
  await sequelize.authenticate();
  console.log(`Conectado a ${process.env.DB_HOST} / ${process.env.DB_NAME}`);

  await aplicarMigracion001();

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
