-- Ejecutar una vez en la base del proyecto (MySQL).
-- Registro de ventas: encabezado + líneas con snapshot de precio y costo.

CREATE TABLE IF NOT EXISTS VENTA (
  idVenta INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL,
  clienteNombre VARCHAR(255) NOT NULL,
  observaciones TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS VENTA_DETALLE (
  idDetalle INT AUTO_INCREMENT PRIMARY KEY,
  idVenta INT NOT NULL,
  idProducto INT NOT NULL,
  cantidad INT NOT NULL,
  precioUnitario DECIMAL(14, 4) NOT NULL,
  costoUnitario DECIMAL(14, 4) NOT NULL,
  CONSTRAINT fk_venta_detalle_venta FOREIGN KEY (idVenta) REFERENCES VENTA (idVenta) ON DELETE CASCADE,
  CONSTRAINT fk_venta_detalle_producto FOREIGN KEY (idProducto) REFERENCES PRODUCTO (idProductos)
);

CREATE INDEX idx_venta_detalle_venta ON VENTA_DETALLE (idVenta);
CREATE INDEX idx_venta_fecha ON VENTA (fecha);
