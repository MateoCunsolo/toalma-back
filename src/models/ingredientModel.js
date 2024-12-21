const { json } = require('body-parser');
const db = require('../../database/db');

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

            let costoActual = ingredient.precioComprado / ( ingredient.cantidadComprada * ingredient.equivalencia );
            const { nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, idCategoriaIngrediente } = ingredient;

            const query = 'INSERT INTO INGREDIENTE (nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, costo, idCategoriaIngrediente) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            const [result] = await db.query(query, [nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, costoActual, idCategoriaIngrediente]);

            if (result.affectedRows > 0) {
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

            const { nombre, cantidadComprada, unidadComprada, precioComprado, unidadDeMedida, equivalencia, costo, imagen, idCategoriaIngrediente } = ingredient;

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
};

module.exports = Ingredient;

