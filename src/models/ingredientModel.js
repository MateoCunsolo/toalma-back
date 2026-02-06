const { json } = require('body-parser');
const db = require('../../database/db');

const calculateEquivalence = (unidadComprada, unidadDeMedida) => {
    if (!unidadComprada || !unidadDeMedida) {
        return 0;
    }

    if (unidadComprada === 'Litros' && unidadDeMedida === 'Mililitros') {
        return 1000;
    }
    if (unidadComprada === 'Kilos' && unidadDeMedida === 'Gramos') {
        return 1000;
    }
    if (unidadComprada === 'Kilos' && unidadDeMedida === 'Kilos') {
        return 1;
    }
    if (unidadComprada === 'Mililitros' && unidadDeMedida === 'Mililitros') {
        return 1;
    }
    if (unidadComprada === 'Gramos' && unidadDeMedida === 'Gramos') {
        return 1;
    }
    if (unidadComprada === 'Litros' && unidadDeMedida === 'Gotas') {
        return 25000;
    }
    if (unidadComprada === 'Litros' && unidadDeMedida === 'Litros') {
        return 1;
    }
    if (unidadComprada === 'Mililitros' && unidadDeMedida === 'Gotas') {
        return 25;
    }
    if (unidadComprada === 'Gotas' && unidadDeMedida === 'Gotas') {
        return 1;
    }

    return 0;
};

const ensurePurchaseTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS INGREDIENTE_COMPRA (
            idCompra INT AUTO_INCREMENT PRIMARY KEY,
            idIngrediente INT NOT NULL,
            proveedor VARCHAR(255) NOT NULL,
            precio DECIMAL(10,2) NOT NULL,
            cantidad DECIMAL(10,2) NOT NULL,
            unidad VARCHAR(50) NOT NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_ingrediente (idIngrediente)
        )
    `);
};

const ensureAuditTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS INGREDIENTE_AUDIT (
            idAudit INT AUTO_INCREMENT PRIMARY KEY,
            idIngrediente INT NOT NULL,
            accion VARCHAR(50) NOT NULL,
            delta DECIMAL(10,2) NOT NULL,
            precio DECIMAL(10,2) NULL,
            proveedor VARCHAR(255) NULL,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_ingrediente (idIngrediente)
        )
    `);
};

const recalcFromPurchases = async (idIngrediente, equivalencia, currentPrecio, currentCosto) => {
    await ensurePurchaseTable();
    const [rows] = await db.query(
        'SELECT precio, cantidad FROM INGREDIENTE_COMPRA WHERE idIngrediente = ?',
        [idIngrediente]
    );
    const unitPrices = rows
        .filter((row) => Number(row.cantidad || 0) > 0)
        .map((row) => Number(row.precio || 0) / Number(row.cantidad || 1));
    if (unitPrices.length > 0) {
        const maxUnitPrice = Math.max(...unitPrices);
        const costo = maxUnitPrice / Number(equivalencia || 1);
        return { precioComprado: maxUnitPrice, costo };
    }
    return { precioComprado: currentPrecio, costo: currentCosto };
};

const Ingredient = {
    // Obtener todos los ingredientes
    getAll: async () => {
        try {
            const query = 'SELECT * FROM INGREDIENTE';
            const [rows] = await db.query(query);
            if (rows.length === 0) {
                return { success: false, message: 'No se encontraron ingredientes.' };
            }
            return rows;
        } catch (error) {
            console.error('Error en obtener todos los ingredientes:', error);
            return { success: false, message: 'Hubo un error al obtener los ingredientes.' };
        }
    },

    // Obtener ingrediente por ID
    getById: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            const query = 'SELECT * FROM INGREDIENTE WHERE idIngrediente = ?';
            const [rows] = await db.query(query, [id]);

            if (rows.length === 0) {
                return { success: false, message: `No se encontró el ingrediente con ID ${id}.` };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error(`Error en obtener ingrediente con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al obtener el ingrediente.' };
        }
    },

    // Crear un nuevo ingrediente
    createIngredient: async (ingredient) => {
        try {
            // Validación de los datos
            if (!ingredient.nombre || !ingredient.cantidadComprada || !ingredient.precioComprado) {
                return { success: false, message: 'Faltan campos obligatorios (nombre, cantidadComprada, precioComprado).' };
            }

            const { nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, idCategoriaIngrediente, proveedor } = ingredient;
            const equivalencia = calculateEquivalence(unidadComprada, unidadDeMedida);

            if (!equivalencia) {
                return { success: false, message: 'No se pudo calcular la equivalencia con las unidades seleccionadas.' };
            }

            const precioUnitario = Number(precioComprado) / Number(cantidadComprada);
            let costoActual = precioUnitario / equivalencia;

            const query = 'INSERT INTO INGREDIENTE (nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, costo, idCategoriaIngrediente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await db.query(query, [nombre, cantidadComprada, unidadComprada, precioUnitario, unidadDeMedida, equivalencia, costoActual, idCategoriaIngrediente]);

            if (result.affectedRows > 0) {
                await ensurePurchaseTable();
                await db.query(
                    'INSERT INTO INGREDIENTE_COMPRA (idIngrediente, proveedor, precio, cantidad, unidad) VALUES (?, ?, ?, ?, ?)',
                    [result.insertId, proveedor || 'Sin proveedor', precioComprado, cantidadComprada, unidadComprada]
                );
                return { success: true, message: 'Ingrediente creado correctamente.', data: { idIngrediente: result.insertId } };
            }

            return { success: false, message: 'No se pudo crear el ingrediente.' };
        } catch (error) {
            console.error('Error al crear el ingrediente:', error);
            return { success: false, message: 'Hubo un error al crear el ingrediente.' };
        }
    },

    // Eliminar un ingrediente por ID
    deleteIngredient: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            const query = 'DELETE FROM INGREDIENTE WHERE idIngrediente = ?';
            const [result] = await db.query(query, [id]);

            if (result.affectedRows > 0) {
                return { success: true, message: `Ingrediente con ID ${id} eliminado correctamente.` };
            }

            return { success: false, message: `No se encontró el ingrediente con ID ${id}.` };
        } catch (error) {
            console.error(`Error al eliminar el ingrediente con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al eliminar el ingrediente.' };
        }
    },

    // Actualizar un ingrediente por ID
    updateIngredient: async (id, ingredient) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            // Validación de los datos
            if (!ingredient.nombre || !ingredient.cantidadComprada || !ingredient.precioComprado) {
                return { success: false, message: 'Faltan campos obligatorios (nombre, cantidadComprada, precioComprado).' };
            }

            const [currentRows] = await db.query('SELECT unidadComprada, unidadDeMedida FROM INGREDIENTE WHERE idIngrediente = ?', [id]);
            if (!currentRows.length) {
                return { success: false, message: `No se encontró el ingrediente con ID ${id}.` };
            }
            const current = currentRows[0];
            const [purchaseCount] = await db.query('SELECT COUNT(1) AS total FROM INGREDIENTE_COMPRA WHERE idIngrediente = ?', [id]);
            if (purchaseCount[0]?.total > 0) {
                if (ingredient.unidadComprada !== current.unidadComprada || ingredient.unidadDeMedida !== current.unidadDeMedida) {
                    return { success: false, message: 'No se puede cambiar la unidad si ya hay historial de compras.' };
                }
            }

            const { nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, imagen, idCategoriaIngrediente } = ingredient;
            const equivalencia = calculateEquivalence(unidadComprada, unidadDeMedida);

            if (!equivalencia) {
                return { success: false, message: 'No se pudo calcular la equivalencia con las unidades seleccionadas.' };
            }

            const costo = Number(precioComprado) / Number(equivalencia);

            const query = 'UPDATE INGREDIENTE SET nombre = ?, cantidadComprada = ?, unidadComprada = ?, precioComprado = ?, unidadDeMedida = ?, equivalencia = ?, costo = ?, imagen = ?, idCategoriaIngrediente = ? WHERE idIngrediente = ?';
            const [result] = await db.query(query, [nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, costo, imagen, idCategoriaIngrediente, id]);

            if (result.affectedRows > 0) {
                return { success: true, message: 'Ingrediente actualizado correctamente.' };
            }

            return { success: false, message: `No se encontró el ingrediente con ID ${id}.` };
        } catch (error) {
            console.error(`Error al actualizar el ingrediente con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al actualizar el ingrediente.' };
        }
    }
    ,
    bulkUpdateCategory: async (ingredientIds, idCategoriaIngrediente) => {
        try {
            if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
                return { success: false, message: 'Debes seleccionar al menos un ingrediente.' };
            }
            if (!idCategoriaIngrediente || isNaN(idCategoriaIngrediente)) {
                return { success: false, message: 'La categoría es inválida.' };
            }

            const ids = ingredientIds.map((value) => Number(value)).filter((value) => !Number.isNaN(value));
            if (ids.length === 0) {
                return { success: false, message: 'No hay ingredientes válidos para actualizar.' };
            }

            const [categoryRows] = await db.query(
                'SELECT idCategoriaIngrediente FROM CATEGORIA_INGREDIENTE WHERE idCategoriaIngrediente = ?',
                [Number(idCategoriaIngrediente)]
            );
            if (!categoryRows.length) {
                return { success: false, message: 'La categoría no existe.' };
            }

            const placeholders = ids.map(() => '?').join(',');
            const [existing] = await db.query(
                `SELECT idIngrediente FROM INGREDIENTE WHERE idIngrediente IN (${placeholders})`,
                ids
            );
            if (!existing.length) {
                return { success: false, message: 'No se encontraron ingredientes para actualizar.' };
            }

            const query = `UPDATE INGREDIENTE SET idCategoriaIngrediente = ? WHERE idIngrediente IN (${placeholders})`;
            const [result] = await db.query(query, [Number(idCategoriaIngrediente), ...ids]);

            if (result.affectedRows > 0) {
                await ensureAuditTable();
                const auditValues = existing.map((row) => [row.idIngrediente, 'CAMBIO_CATEGORIA', 0, null, null]);
                const auditPlaceholders = auditValues.map(() => '(?, ?, ?, ?, ?)').join(',');
                await db.query(
                    `INSERT INTO INGREDIENTE_AUDIT (idIngrediente, accion, delta, precio, proveedor) VALUES ${auditPlaceholders}`,
                    auditValues.flat()
                );
                return { success: true, message: 'Categorías actualizadas correctamente.' };
            }

            return { success: false, message: 'No se actualizaron ingredientes.' };
        } catch (error) {
            console.error('Error al actualizar categorías en lote:', error);
            return { success: false, message: 'Hubo un error al actualizar las categorías.' };
        }
    },
    adjustStock: async (id, delta, proveedor, precioComprado) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }
            if (!delta || Number.isNaN(delta)) {
                return { success: false, message: 'La cantidad es inválida.' };
            }

            const [rows] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [id]);
            if (!rows.length) {
                return { success: false, message: `No se encontró el ingrediente con ID ${id}.` };
            }

            const ingrediente = rows[0];
            const equivalencia = ingrediente.equivalencia || 1;
            const deltaComprado = Number(delta);

            const nuevaCantidad = Number(ingrediente.cantidadComprada) + deltaComprado;
            if (nuevaCantidad < 0) {
                return { success: false, message: 'El stock no puede ser negativo.' };
            }

            let precioFinal = ingrediente.precioComprado;
            let costoFinal = ingrediente.costo;

            if (delta > 0) {
                const precioCompraTotal = Number(precioComprado);
                if (!precioCompraTotal || Number.isNaN(precioCompraTotal) || precioCompraTotal <= 0) {
                    return { success: false, message: 'El precio es inválido.' };
                }

                if (!ingrediente.equivalencia || ingrediente.equivalencia === 0) {
                    return { success: false, message: 'Equivalencia inválida para recalcular el costo.' };
                }
                const precioUnitarioCompra = precioCompraTotal / deltaComprado;
                const precioUnitarioAnterior = Number(ingrediente.precioComprado || 0);
                precioFinal = Math.max(precioUnitarioAnterior, precioUnitarioCompra);
                costoFinal = precioFinal / Number(ingrediente.equivalencia || 1);

                await ensurePurchaseTable();
                await db.query(
                    'INSERT INTO INGREDIENTE_COMPRA (idIngrediente, proveedor, precio, cantidad, unidad) VALUES (?, ?, ?, ?, ?)',
                    [id, proveedor || 'Sin proveedor', precioCompraTotal, Number(delta), ingrediente.unidadComprada]
                );
            }

            const [result] = await db.query(
                'UPDATE INGREDIENTE SET cantidadComprada = ?, precioComprado = ?, costo = ? WHERE idIngrediente = ?',
                [nuevaCantidad, precioFinal, costoFinal, id]
            );
            if (result.affectedRows > 0) {
                await ensureAuditTable();
                await db.query(
                    'INSERT INTO INGREDIENTE_AUDIT (idIngrediente, accion, delta, precio, proveedor) VALUES (?, ?, ?, ?, ?)',
                    [id, 'COMPRA', Number(delta), Number(precioComprado), proveedor || null]
                );
                return { success: true, message: 'Stock actualizado correctamente.' };
            }

            return { success: false, message: 'No se pudo actualizar el stock.' };
        } catch (error) {
            console.error(`Error al ajustar stock del ingrediente con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al ajustar el stock.' };
        }
    },
    getPurchases: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }
            await ensurePurchaseTable();
            const [rows] = await db.query(
                'SELECT idCompra, proveedor, precio, cantidad, unidad, fecha FROM INGREDIENTE_COMPRA WHERE idIngrediente = ? ORDER BY fecha DESC LIMIT 50',
                [id]
            );
            return rows;
        } catch (error) {
            console.error(`Error al obtener compras del ingrediente ${id}:`, error);
            return { success: false, message: 'Hubo un error al obtener el historial.' };
        }
    },
    getAudit: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }
            await ensureAuditTable();
            const [rows] = await db.query(
                'SELECT idAudit, accion, delta, precio, proveedor, fecha FROM INGREDIENTE_AUDIT WHERE idIngrediente = ? ORDER BY fecha DESC LIMIT 50',
                [id]
            );
            return rows;
        } catch (error) {
            console.error(`Error al obtener auditoría del ingrediente ${id}:`, error);
            return { success: false, message: 'Hubo un error al obtener la auditoría.' };
        }
    },
    updatePurchase: async (idCompra, payload) => {
        try {
            if (!idCompra || isNaN(idCompra)) {
                return { success: false, message: 'ID inválido.' };
            }
            const { proveedor, precio, cantidad, unidad, fecha } = payload;
            if (!proveedor || !precio || !cantidad || !unidad || !fecha) {
                return { success: false, message: 'Completa todos los campos.' };
            }
            await ensurePurchaseTable();
            const [current] = await db.query('SELECT * FROM INGREDIENTE_COMPRA WHERE idCompra = ?', [idCompra]);
            if (!current.length) {
                return { success: false, message: 'No se encontró la compra.' };
            }
            const compraActual = current[0];
            const [ingRows] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [compraActual.idIngrediente]);
            if (!ingRows.length) {
                return { success: false, message: 'No se encontró el ingrediente.' };
            }
            const ingrediente = ingRows[0];
            if (unidad !== ingrediente.unidadComprada) {
                return { success: false, message: 'La unidad debe coincidir con la unidad de compra del ingrediente.' };
            }

            const deltaCantidad = Number(cantidad) - Number(compraActual.cantidad);
            const nuevaCantidadComprada = Number(ingrediente.cantidadComprada || 0) + deltaCantidad;
            if (nuevaCantidadComprada < 0) {
                return { success: false, message: 'El stock no puede quedar negativo.' };
            }

            const [updateIng] = await db.query('UPDATE INGREDIENTE SET cantidadComprada = ? WHERE idIngrediente = ?', [nuevaCantidadComprada, ingrediente.idIngrediente]);
            if (!updateIng.affectedRows) {
                return { success: false, message: 'No se pudo ajustar el stock.' };
            }

            const [result] = await db.query(
                'UPDATE INGREDIENTE_COMPRA SET proveedor = ?, precio = ?, cantidad = ?, unidad = ?, fecha = ? WHERE idCompra = ?',
                [proveedor, precio, cantidad, unidad, fecha, idCompra]
            );
            if (result.affectedRows) {
                await ensureAuditTable();
                if (ingrediente.idIngrediente) {
                    await db.query(
                        'INSERT INTO INGREDIENTE_AUDIT (idIngrediente, accion, delta, precio, proveedor) VALUES (?, ?, ?, ?, ?)',
                        [ingrediente.idIngrediente, 'UPDATE_COMPRA', Number(cantidad), Number(precio), proveedor]
                    );
                }
                const recalculated = await recalcFromPurchases(ingrediente.idIngrediente, ingrediente.equivalencia, ingrediente.precioComprado, ingrediente.costo);
                await db.query(
                    'UPDATE INGREDIENTE SET precioComprado = ?, costo = ? WHERE idIngrediente = ?',
                    [recalculated.precioComprado, recalculated.costo, ingrediente.idIngrediente]
                );
                return { success: true, message: 'Compra actualizada.' };
            }
            return { success: false, message: 'No se pudo actualizar.' };
        } catch (error) {
            console.error(`Error al actualizar compra ${idCompra}:`, error);
            return { success: false, message: 'Hubo un error al actualizar la compra.' };
        }
    }
    ,
    deletePurchase: async (idCompra) => {
        try {
            if (!idCompra || isNaN(idCompra)) {
                return { success: false, message: 'ID inválido.' };
            }
            await ensurePurchaseTable();

            const [rows] = await db.query('SELECT * FROM INGREDIENTE_COMPRA WHERE idCompra = ?', [idCompra]);
            if (!rows.length) {
                return { success: false, message: 'No se encontró la compra.' };
            }
            const compra = rows[0];

            const [ingredients] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [compra.idIngrediente]);
            if (!ingredients.length) {
                return { success: false, message: 'No se encontró el ingrediente.' };
            }
            const ingrediente = ingredients[0];
            const deltaComprado = Number(compra.cantidad);

            const nuevaCantidad = Number(ingrediente.cantidadComprada) - deltaComprado;
            if (nuevaCantidad < 0) {
                return { success: false, message: 'No se puede eliminar: dejaría stock negativo.' };
            }

            const [updateIng] = await db.query('UPDATE INGREDIENTE SET cantidadComprada = ? WHERE idIngrediente = ?', [nuevaCantidad, compra.idIngrediente]);
            if (!updateIng.affectedRows) {
                return { success: false, message: 'No se pudo ajustar el stock.' };
            }

            const [result] = await db.query('DELETE FROM INGREDIENTE_COMPRA WHERE idCompra = ?', [idCompra]);
            if (result.affectedRows) {
                await ensureAuditTable();
                await db.query(
                    'INSERT INTO INGREDIENTE_AUDIT (idIngrediente, accion, delta, precio, proveedor) VALUES (?, ?, ?, ?, ?)',
                    [compra.idIngrediente, 'DELETE_COMPRA', Number(compra.cantidad), Number(compra.precio), compra.proveedor]
                );
                const [ingRows] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [compra.idIngrediente]);
                if (ingRows.length) {
                    const ingrediente = ingRows[0];
                    const recalculated = await recalcFromPurchases(ingrediente.idIngrediente, ingrediente.equivalencia, ingrediente.precioComprado, ingrediente.costo);
                    await db.query(
                        'UPDATE INGREDIENTE SET precioComprado = ?, costo = ? WHERE idIngrediente = ?',
                        [recalculated.precioComprado, recalculated.costo, ingrediente.idIngrediente]
                    );
                }
            }
            return result.affectedRows ? { success: true, message: 'Compra eliminada.' } : { success: false, message: 'No se pudo eliminar la compra.' };
        } catch (error) {
            console.error(`Error al eliminar compra ${idCompra}:`, error);
            return { success: false, message: 'Hubo un error al eliminar la compra.' };
        }
    }
};

module.exports = Ingredient;

