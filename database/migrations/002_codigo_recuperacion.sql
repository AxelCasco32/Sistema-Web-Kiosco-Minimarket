-- =====================================================================
-- Migración 002: código de recuperación de contraseña del Admin
-- Correr UNA vez sobre una base existente (o usar: node scripts/resetAdmin.js,
-- que la aplica sola si falta).
-- =====================================================================
ALTER TABLE `usuarios`
  ADD COLUMN `codigo_recuperacion_hash` VARCHAR(255) DEFAULT NULL AFTER `Activo`;
