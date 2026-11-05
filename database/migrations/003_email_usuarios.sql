-- =====================================================================
-- Migración 003: email de usuarios + código de recuperación por correo
-- El backend la aplica solo al arrancar (src/config/migraciones.js);
-- este archivo queda como referencia.
-- =====================================================================
ALTER TABLE `usuarios`
  ADD COLUMN `Email` VARCHAR(150) DEFAULT NULL AFTER `Usuario`,
  ADD UNIQUE KEY `uq_usuarios_email` (`Email`),
  ADD COLUMN `codigo_recuperacion_expira` DATETIME DEFAULT NULL AFTER `codigo_recuperacion_hash`,
  ADD COLUMN `codigo_recuperacion_intentos` INT NOT NULL DEFAULT 0 AFTER `codigo_recuperacion_expira`;

-- Anula los códigos del sistema anterior (no tenían vencimiento)
UPDATE `usuarios` SET `codigo_recuperacion_hash` = NULL
WHERE `codigo_recuperacion_hash` IS NOT NULL AND `codigo_recuperacion_expira` IS NULL;
