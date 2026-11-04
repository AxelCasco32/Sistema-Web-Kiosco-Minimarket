// config/migraciones.js
// Aplica sobre la base los cambios de estructura que todavía falten.
// Se ejecuta solo al arrancar el backend (server.js) y desde scripts/resetAdmin.js,
// así una base compartida (Clever Cloud) queda al día sin correr SQL a mano.
// Cada paso revisa antes si el cambio ya existe, por lo que es seguro repetirlo.
const sequelize = require('./db');

async function columnasDe(tabla) {
  const [filas] = await sequelize.query(`SHOW COLUMNS FROM \`${tabla}\``);
  return filas.map((f) => f.Field);
}

async function aplicarMigracion001() {
  const cols = await columnasDe('turnos_caja');
  if (!cols.includes('Fondo_Inicial')) {
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
}

async function aplicarMigracion002() {
  const cols = await columnasDe('usuarios');
  if (!cols.includes('codigo_recuperacion_hash')) {
    await sequelize.query(
      "ALTER TABLE `usuarios` ADD COLUMN `codigo_recuperacion_hash` VARCHAR(255) DEFAULT NULL AFTER `Activo`"
    );
  }
}

async function aplicarMigraciones() {
  await aplicarMigracion001();
  await aplicarMigracion002();
}

module.exports = { aplicarMigraciones };
