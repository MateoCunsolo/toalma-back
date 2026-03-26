const db = require('../../database/db');
const Producto = require('./productModel');

function aggregateQtyByProduct(items) {
  const map = new Map();
  for (const row of items) {
    const id = Number(row.idProducto);
    const q = Number(row.cantidad);
    if (!Number.isFinite(id) || id < 1) {
      return { error: 'idProducto inválido' };
    }
    if (!Number.isFinite(q) || q < 1 || !Number.isInteger(q)) {
      return { error: 'La cantidad debe ser un entero mayor a 0' };
    }
    map.set(id, (map.get(id) || 0) + q);
  }
  if (map.size === 0) {
    return { error: 'La venta debe incluir al menos un producto' };
  }
  return map;
}

async function loadPricingSnapshots(productIds) {
  const snap = new Map();
  for (const id of productIds) {
    const p = await Producto.getOne(id);
    if (p.error) {
      return { error: p.error };
    }
    snap.set(id, {
      precioUnitario: Number(p.precioUnitario ?? p.precio ?? 0),
      costoUnitario: Number(p.costoUnitario ?? 0)
    });
  }
  return snap;
}

async function readStocksConn(conn, productIds) {
  const stocks = new Map();
  for (const id of productIds) {
    const [rows] = await conn.query('SELECT stock FROM PRODUCTO WHERE idProductos = ?', [id]);
    if (!rows.length) {
      return { error: `No existe el producto ${id}` };
    }
    stocks.set(id, Number(rows[0].stock || 0));
  }
  return stocks;
}

const Ventas = {
  listSummaries: async () => {
    const [rows] = await db.query(
      `SELECT
        v.idVenta,
        v.fecha,
        v.clienteNombre,
        v.observaciones,
        v.createdAt,
        COALESCE(SUM(d.cantidad * d.precioUnitario), 0) AS totalVenta,
        COALESCE(SUM(d.cantidad * (d.precioUnitario - d.costoUnitario)), 0) AS gananciaVenta,
        COUNT(d.idDetalle) AS cantidadLineas
      FROM VENTA v
      LEFT JOIN VENTA_DETALLE d ON d.idVenta = v.idVenta
      GROUP BY v.idVenta, v.fecha, v.clienteNombre, v.observaciones, v.createdAt
      ORDER BY v.fecha DESC, v.idVenta DESC`
    );
    return rows;
  },

  totalGananciaReal: async () => {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(cantidad * (precioUnitario - costoUnitario)), 0) AS totalGananciaReal
       FROM VENTA_DETALLE`
    );
    return Number(rows[0]?.totalGananciaReal ?? 0);
  },

  getById: async (idVenta) => {
    const [ventas] = await db.query('SELECT * FROM VENTA WHERE idVenta = ?', [idVenta]);
    if (!ventas.length) {
      return { error: 'Venta no encontrada' };
    }
    const [detalle] = await db.query(
      `SELECT d.*, p.nombre AS nombreProducto
       FROM VENTA_DETALLE d
       JOIN PRODUCTO p ON p.idProductos = d.idProducto
       WHERE d.idVenta = ?
       ORDER BY d.idDetalle`,
      [idVenta]
    );
    return { venta: ventas[0], detalle };
  },

  create: async ({ fecha, clienteNombre, observaciones, items }) => {
    if (!clienteNombre || !String(clienteNombre).trim()) {
      return { error: 'El nombre del cliente es obligatorio' };
    }
    if (!fecha || !String(fecha).trim()) {
      return { error: 'La fecha es obligatoria' };
    }
    const agg = aggregateQtyByProduct(items);
    if (agg.error) {
      return agg;
    }
    const productIds = [...agg.keys()];
    const pricing = await loadPricingSnapshots(productIds);
    if (pricing.error) {
      return pricing;
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const stocks = await readStocksConn(conn, productIds);
      if (stocks.error) {
        await conn.rollback();
        return stocks;
      }
      for (const [pid, need] of agg) {
        if (stocks.get(pid) < need) {
          await conn.rollback();
          return { error: `Stock insuficiente para el producto ${pid}` };
        }
      }

      const obs = observaciones != null ? String(observaciones) : null;
      const [insV] = await conn.query(
        'INSERT INTO VENTA (fecha, clienteNombre, observaciones) VALUES (?, ?, ?)',
        [String(fecha).trim(), String(clienteNombre).trim(), obs]
      );
      const idVenta = insV.insertId;

      for (const [idProducto, cantidad] of agg) {
        const { precioUnitario, costoUnitario } = pricing.get(idProducto);
        await conn.query(
          `INSERT INTO VENTA_DETALLE (idVenta, idProducto, cantidad, precioUnitario, costoUnitario)
           VALUES (?, ?, ?, ?, ?)`,
          [idVenta, idProducto, cantidad, precioUnitario, costoUnitario]
        );
        const S0 = stocks.get(idProducto);
        const resStock = await Producto.setAbsoluteStockWithIngredientsConn(conn, idProducto, S0 - cantidad);
        if (resStock.error) {
          await conn.rollback();
          return { error: resStock.error };
        }
      }

      await conn.commit();
      return { message: 'Venta registrada', idVenta };
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return { error: 'Error al registrar la venta' };
    } finally {
      conn.release();
    }
  },

  remove: async (idVenta) => {
    const existing = await Ventas.getById(idVenta);
    if (existing.error) {
      return existing;
    }

    const agg = new Map();
    for (const row of existing.detalle) {
      const pid = Number(row.idProducto);
      const q = Number(row.cantidad);
      agg.set(pid, (agg.get(pid) || 0) + q);
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const stocks = await readStocksConn(conn, [...agg.keys()]);

      for (const [idProducto, cantidad] of agg) {
        const S0 = stocks.get(idProducto);
        const resStock = await Producto.setAbsoluteStockWithIngredientsConn(conn, idProducto, S0 + cantidad);
        if (resStock.error) {
          await conn.rollback();
          return { error: resStock.error };
        }
      }

      await conn.query('DELETE FROM VENTA WHERE idVenta = ?', [idVenta]);
      await conn.commit();
      return { message: 'Venta eliminada y stock restaurado' };
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return { error: 'Error al eliminar la venta' };
    } finally {
      conn.release();
    }
  },

  /**
   * Reemplaza cabecera y líneas; ajusta stock según diferencia old vs new.
   */
  update: async (idVenta, { fecha, clienteNombre, observaciones, items }) => {
    const current = await Ventas.getById(idVenta);
    if (current.error) {
      return current;
    }
    if (!clienteNombre || !String(clienteNombre).trim()) {
      return { error: 'El nombre del cliente es obligatorio' };
    }
    if (!fecha || !String(fecha).trim()) {
      return { error: 'La fecha es obligatoria' };
    }

    const oldAgg = new Map();
    for (const row of current.detalle) {
      const pid = Number(row.idProducto);
      const q = Number(row.cantidad);
      oldAgg.set(pid, (oldAgg.get(pid) || 0) + q);
    }

    const newAgg = aggregateQtyByProduct(items);
    if (newAgg.error) {
      return newAgg;
    }

    const allIds = new Set([...oldAgg.keys(), ...newAgg.keys()]);
    /** Precio/costo congelados de la venta actual por producto (primer renglón si hubiera duplicados legacy). */
    const historicByProduct = new Map();
    for (const row of current.detalle) {
      const pid = Number(row.idProducto);
      if (!historicByProduct.has(pid)) {
        historicByProduct.set(pid, {
          precioUnitario: Number(row.precioUnitario ?? 0),
          costoUnitario: Number(row.costoUnitario ?? 0)
        });
      }
    }

    const newProductIds = [...newAgg.keys()].filter((id) => !historicByProduct.has(id));
    const freshPricing = new Map();
    if (newProductIds.length) {
      const loaded = await loadPricingSnapshots(newProductIds);
      if (loaded.error) {
        return loaded;
      }
      for (const [k, v] of loaded) {
        freshPricing.set(k, v);
      }
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const stocks = await readStocksConn(conn, [...allIds]);
      if (stocks.error) {
        await conn.rollback();
        return stocks;
      }

      for (const idProducto of allIds) {
        const oldQ = oldAgg.get(idProducto) || 0;
        const newQ = newAgg.get(idProducto) || 0;
        const S0 = stocks.get(idProducto);
        if (S0 === undefined) {
          await conn.rollback();
          return { error: `No existe el producto ${idProducto}` };
        }
        const target = S0 + oldQ - newQ;
        if (target < 0) {
          await conn.rollback();
          return { error: `Stock insuficiente para aplicar los cambios (producto ${idProducto})` };
        }
        if (newQ > 0 || oldQ > 0) {
          const resStock = await Producto.setAbsoluteStockWithIngredientsConn(conn, idProducto, target);
          if (resStock.error) {
            await conn.rollback();
            return { error: resStock.error };
          }
        }
      }

      const obs = observaciones != null ? String(observaciones) : null;
      await conn.query('UPDATE VENTA SET fecha = ?, clienteNombre = ?, observaciones = ? WHERE idVenta = ?', [
        String(fecha).trim(),
        String(clienteNombre).trim(),
        obs,
        idVenta
      ]);

      await conn.query('DELETE FROM VENTA_DETALLE WHERE idVenta = ?', [idVenta]);

      for (const [idProducto, cantidad] of newAgg) {
        let precioUnitario;
        let costoUnitario;
        if (historicByProduct.has(idProducto)) {
          const h = historicByProduct.get(idProducto);
          precioUnitario = h.precioUnitario;
          costoUnitario = h.costoUnitario;
        } else {
          const snap = freshPricing.get(idProducto);
          if (!snap) {
            await conn.rollback();
            return { error: `No se pudo obtener precio del producto ${idProducto}` };
          }
          precioUnitario = snap.precioUnitario;
          costoUnitario = snap.costoUnitario;
        }
        await conn.query(
          `INSERT INTO VENTA_DETALLE (idVenta, idProducto, cantidad, precioUnitario, costoUnitario)
           VALUES (?, ?, ?, ?, ?)`,
          [idVenta, idProducto, cantidad, precioUnitario, costoUnitario]
        );
      }

      await conn.commit();
      return { message: 'Venta actualizada', idVenta };
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return { error: 'Error al actualizar la venta' };
    } finally {
      conn.release();
    }
  }
};

module.exports = Ventas;
