const db = require('../../database/db');

const Categoria = {
  getAll: async () => {
    try {
      const [result] = await db.query('SELECT * FROM CATEGORIA_PRODUCTO');
      return result;
    } catch (error) {
      console.error('Error al obtener las categorías:', error);
      throw new Error('Error al obtener las categorías');
    }
  },

  create: async (nombre) => {
    console.log(nombre);
    try {
      const query = 'INSERT INTO CATEGORIA_PRODUCTO (nombre) VALUES (?)';
      const [result] = await db.query(query, [nombre]);
      return { message: 'Categoría creada con éxito', insertId: result.insertId };
    } catch (error) {
      console.error('Error al crear la categoría:', error);
      throw new Error('Error al crear la categoría');
    }
  },

  deleteById: async (idCategoria) => {
    try {
      const [productos] = await db.query('SELECT * FROM PRODUCTO WHERE idCategoria = ?', [idCategoria]);
      if (productos.length > 0) {
        return { error: 'No se puede eliminar la categoría porque tiene productos asociados' };
      }

      const [result] = await db.query('DELETE FROM CATEGORIA_PRODUCTO WHERE idCategoria = ?', [idCategoria]);
      return result.affectedRows ? { message: 'Categoría eliminada con éxito' } : { error: 'No se encontró la categoría para eliminar' };
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      throw new Error('Error al eliminar la categoría');
    }
  }
};

module.exports = Categoria;
