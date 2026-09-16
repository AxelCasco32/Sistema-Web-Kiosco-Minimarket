-- =====================================================================
-- Sistema Web Kiosco/Minimarket - Base de Datos (CORREGIDA)
-- Basado en el diagrama entregado, con fixes aplicados para Sprint 1
-- Cambios respecto al dump original:
--   1) FIX CRITICO: FK usuarios -> roles apuntaba mal (usaba id_Usuario)
--   2) UNIQUE en usuarios.Usuario (login)
--   3) UNIQUE en productos.Cod_barra (velocidad + evita duplicados)
--   4) UNIQUE en clientes.Cuit_DNI (velocidad + evita duplicados)
--   5) AUTO_INCREMENT agregado en roles.id_Rol, venta.id_Venta,
--      detalle_venta.id_detalle
--   6) Columna huerfana turnos_cajacol eliminada
--   7) Charset unificado a utf8mb4
--   8) Renombrado Contraseña -> password_hash (evita problemas de
--      encoding/migraciones entre entornos)
--   9) Timestamps createdAt/updatedAt agregados (Sequelize los usa
--      por defecto; se dejan explicitos para claridad)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Tabla: roles
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_Rol` INT NOT NULL AUTO_INCREMENT,
  `Nombre` ENUM('Admin','Cajero') NOT NULL,
  PRIMARY KEY (`id_Rol`),
  UNIQUE KEY `uq_roles_nombre` (`Nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `roles` (`Nombre`) VALUES ('Admin'), ('Cajero');

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id_Usuario` INT NOT NULL AUTO_INCREMENT,
  `id_Rol` INT NOT NULL,
  `Nombre` VARCHAR(45) NOT NULL,
  `Apellido` VARCHAR(45) NOT NULL,
  `Usuario` VARCHAR(45) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `Activo` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_Usuario`),
  UNIQUE KEY `uq_usuarios_usuario` (`Usuario`),
  KEY `fk_usuario_rol_idx` (`id_Rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_Rol`) REFERENCES `roles` (`id_Rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla: clientes
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id_Cliente` INT NOT NULL AUTO_INCREMENT,
  `Tipo_Cliente` ENUM('Juridico','Fisico') NOT NULL DEFAULT 'Fisico',
  `Cuit_DNI` VARCHAR(12) DEFAULT NULL,
  `Nombre_razon_social` VARCHAR(145) NOT NULL,
  `Domicilio` VARCHAR(200) DEFAULT NULL,
  `Telefono` VARCHAR(45) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_Cliente`),
  UNIQUE KEY `uq_clientes_cuit_dni` (`Cuit_DNI`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla: productos
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `productos`;
CREATE TABLE `productos` (
  `idProductos` INT NOT NULL AUTO_INCREMENT,
  `Cod_barra` VARCHAR(45) NOT NULL,
  `Nombre` VARCHAR(145) NOT NULL,
  `Precio_costo` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Precio_Venta` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Stock` INT NOT NULL DEFAULT 0,
  `Activo` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idProductos`),
  UNIQUE KEY `uq_productos_cod_barra` (`Cod_barra`),
  KEY `idx_productos_stock` (`Stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla: turnos_caja
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `turnos_caja`;
CREATE TABLE `turnos_caja` (
  `idturnos_caja` INT NOT NULL AUTO_INCREMENT,
  `id_Usuario` INT NOT NULL,
  `Hora_Apertura` DATETIME NOT NULL,
  `Hora_Cierre` DATETIME DEFAULT NULL,
  `Total_Efectivo` DECIMAL(12,2) DEFAULT 0.00,
  `Total_Tarjeta` DECIMAL(12,2) DEFAULT 0.00,
  `Estado` ENUM('Abierto','Cerrado') NOT NULL DEFAULT 'Abierto',
  PRIMARY KEY (`idturnos_caja`),
  KEY `fk_id_usuario_idx` (`id_Usuario`),
  CONSTRAINT `fk_id_usuario` FOREIGN KEY (`id_Usuario`) REFERENCES `usuarios` (`id_Usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla: venta
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `venta`;
CREATE TABLE `venta` (
  `id_Venta` INT NOT NULL AUTO_INCREMENT,
  `id_turno` INT NOT NULL,
  `id_cliente` INT DEFAULT NULL,
  `Fecha_Hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Metodo_Pago` ENUM('Efectivo','QR','Tarjeta') NOT NULL,
  `Monto` DECIMAL(12,2) NOT NULL,
  `Vuelto` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `Total_Venta` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id_Venta`),
  KEY `fk_id_turnos_idx` (`id_turno`),
  KEY `fk_id_cliente_idx` (`id_cliente`),
  CONSTRAINT `fk_id_turnos` FOREIGN KEY (`id_turno`) REFERENCES `turnos_caja` (`idturnos_caja`),
  CONSTRAINT `fk_id_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes` (`id_Cliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- Tabla: detalle_venta
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `detalle_venta`;
CREATE TABLE `detalle_venta` (
  `id_detalle` INT NOT NULL AUTO_INCREMENT,
  `id_venta` INT NOT NULL,
  `id_producto` INT NOT NULL,
  `Cantidad` INT NOT NULL,
  `Precio_unitario` DECIMAL(12,2) NOT NULL,
  `Subtotal` DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `fk_detalle_venta_idx` (`id_venta`),
  KEY `fk_id_producto_idx` (`id_producto`),
  CONSTRAINT `fk_detalle_venta` FOREIGN KEY (`id_venta`) REFERENCES `venta` (`id_Venta`),
  CONSTRAINT `fk_id_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`idProductos`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- NOTAS PARA SPRINT 1:
--   - Solo necesitas `roles` y `usuarios` funcionando para login + JWT.
--   - El resto de las tablas ya estan listas para los siguientes sprints
--     (2: productos, 3: venta/detalle_venta, 4: turnos_caja).
--   - Los INSERT de `roles` ya vienen precargados (Admin=1, Cajero=2)
--     para que puedas hardcodear el seed del primer usuario admin.
-- =====================================================================