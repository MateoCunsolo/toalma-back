const db = require('../../database/db');

const CategoriaIngrediente = {
    // Obtener todas las categorías de ingredientes
    getAll: async () => {
        try {
            const query = 'SELECT * FROM CATEGORIA_INGREDIENTE';
            const [result] = await db.query(query);
            return result;
        } catch (error) {
            console.error('Error al obtener todas las categorías de ingredientes:', error);
            return { success: false, message: 'Hubo un error al obtener las categorías de ingredientes.' };
        }
    },

    // Crear una nueva categoría de ingrediente
    create: async (categoria) => {
        try {
            if (!categoria || !categoria.nombre) {
                return { success: false, message: 'El nombre de la categoría es obligatorio.' };
            }

            const query = 'INSERT INTO CATEGORIA_INGREDIENTE (nombre) VALUES (?)';
            const [result] = await db.query(query, [categoria.nombre]);

            if (result.affectedRows > 0) {
                return { success: true, message: 'Categoría creada correctamente.', data: { idCategoriaIngrediente: result.insertId } };
            }

            return { success: false, message: 'No se pudo crear la categoría.' };
        } catch (error) {
            console.error('Error al crear la categoría de ingrediente:', error);
            return { success: false, message: 'Hubo un error al crear la categoría de ingrediente.' };
        }
    },

    // Eliminar una categoría de ingrediente por ID
    delete: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            const query = 'DELETE FROM CATEGORIA_INGREDIENTE WHERE idCategoriaIngrediente = ?';
            const [result] = await db.query(query, [id]);

            if (result.affectedRows > 0) {
                return { success: true, message: `Categoría con ID ${id} eliminada correctamente.` };
            }

            return { success: false, message: `No se encontró la categoría con ID ${id}.` };
        } catch (error) {
            console.error(`Error al eliminar la categoría con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al eliminar la categoría de ingrediente.' };
        }
    },

    // Actualizar una categoría de ingrediente por ID
    update: async (id, categoria) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            if (!categoria || !categoria.nombre) {
                return { success: false, message: 'El nombre de la categoría es obligatorio.' };
            }

            const query = 'UPDATE CATEGORIA_INGREDIENTE SET nombre = ? WHERE idCategoriaIngrediente = ?';
            const [result] = await db.query(query, [categoria.nombre, id]);

            if (result.affectedRows > 0) {
                return { success: true, message: `Categoría con ID ${id} actualizada correctamente.` };
            }

            return { success: false, message: `No se encontró la categoría con ID ${id}.` };
        } catch (error) {
            console.error(`Error al actualizar la categoría con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al actualizar la categoría de ingrediente.' };
        }
    },

    // Obtener una categoría por ID
    getById: async (id) => {
        try {
            if (!id || isNaN(id)) {
                return { success: false, message: 'ID inválido.' };
            }

            const query = 'SELECT * FROM CATEGORIA_INGREDIENTE WHERE idCategoriaIngrediente = ?';
            const [rows] = await db.query(query, [id]);

            if (rows.length === 0) {
                return { success: false, message: `No se encontró la categoría con ID ${id}.` };
            }

            return { success: true, data: rows[0] };
        } catch (error) {
            console.error(`Error al obtener la categoría con ID ${id}:`, error);
            return { success: false, message: 'Hubo un error al obtener la categoría de ingrediente.' };
        }
    }
};

module.exports = CategoriaIngrediente;
