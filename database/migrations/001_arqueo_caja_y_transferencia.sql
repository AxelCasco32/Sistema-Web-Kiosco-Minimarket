-- =====================================================================
-- Migración 001: arqueo de caja (faltantes) y pago por transferencia
-- Correr UNA vez sobre una base existente:
--   mysql -u root -p kiosco_db < database/migrations/001_arqueo_caja_y_transferencia.sql
-- (Si la base se crea desde cero con schema.sql, no hace falta.)
-- =====================================================================

-- 1) Columnas nuevas en turnos_caja
ALTER TABLE `turnos_caja`
  ADD COLUMN `Fondo_Inicial` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `Hora_Cierre`,
  ADD COLUMN `Efectivo_Contado` DECIMAL(12,2) DEFAULT NULL AFTER `Total_Tarjeta`,
  ADD COLUMN `Diferencia` DECIMAL(12,2) DEFAULT NULL
    COMMENT 'Efectivo_Contado - Total_Efectivo. Negativo = faltante' AFTER `Efectivo_Contado`;

-- 2) Recuperar el fondo inicial de los turnos que ya existían.
--    Antes se guardaba en Total_Efectivo mientras el turno estaba abierto,
--    y al cerrar se pisaba con (fondo + ventas en efectivo).
UPDATE `turnos_caja` SET `Fondo_Inicial` = IFNULL(`Total_Efectivo`, 0)
WHERE `Estado` = 'Abierto';

UPDATE `turnos_caja` t
SET t.`Fondo_Inicial` = GREATEST(0, IFNULL(t.`Total_Efectivo`, 0) - IFNULL((
  SELECT SUM(v.`Total_Venta`) FROM `venta` v
  WHERE v.`id_turno` = t.`idturnos_caja` AND LOWER(v.`Metodo_Pago`) = 'efectivo'
), 0))
WHERE t.`Estado` = 'Cerrado';

-- 3) Permitir ventas por transferencia
ALTER TABLE `venta`
  MODIFY `Metodo_Pago` ENUM('Efectivo','QR','Tarjeta','Transferencia') NOT NULL;
