const db = require('../../database/db');
const { create } = require('./userModel');

const Producto = {

  create: async (product) => {
    const { idCategoria, nombre, stock, descripcion, imagen, ingredientes } = product;

    // Validaciones de campos
    if (!idCategoria || !nombre || !stock || !descripcion || !imagen || !ingredientes) {
      return { error: 'Faltan campos obligatorios: '
        + (idCategoria ? '' : 'idCategoria ')
        + (nombre ? '' : 'nombre ')
        + (stock ? '' : 'stock ')
        + (descripcion ? '' : 'descripcion ')
        + (imagen ? '' : 'imagen ')
        + (ingredientes ? '' : 'ingredientes')
       };
    }

    if (typeof stock !== 'number' || stock < 0) {
      return { error: 'El stock debe ser un número mayor o igual a 0' };
    }

    if (typeof descripcion !== 'string') {
      return { error: 'La descripción es inválida' };
    }

    if (typeof imagen !== 'string') {
      return { error: 'La URL de la imagen es inválida' };
    }

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return { error: 'Los ingredientes son inválidos' };
    }

    let costoXIngrediente = 0.0;
    for (let i = 0; i < ingredientes.length; i++) {
      let [ingredient] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [ingredientes[i].idIngrediente]);
      if (ingredient.length === 0) {
        return { error: `No existe el ingrediente con ID ${ingredientes[i].idIngrediente}` };
      }
      costoXIngrediente = costoXIngrediente + ingredientes[i].cantidadUsada * ingredient[0].costo;
      console.log('Costo por ingrediente:', costoXIngrediente);
    }

    const [ganancia] = await db.query('SELECT porcentaje_ganancia FROM USUARIO WHERE idUsuario = 1');
    if (ganancia.length === 0) {
      return { error: 'No se pudo obtener la ganancia del usuario' };
    }
    let precioFinal = costoXIngrediente * (1 + (ganancia[0].porcentaje_ganancia / 100));
    console.log('Precio final:', precioFinal);
    try {
      // Insertar el producto con idCategoria
      const queryProducto = `
            INSERT INTO PRODUCTO (idCategoria, nombre, precio, stock, descripcion, imagen) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;


      const valuesProducto = [idCategoria, nombre, precioFinal, stock, descripcion, imagen];
      const [result] = await db.query(queryProducto, valuesProducto);
      const idProducto = result.insertId;

      // Asociar los ingredientes al producto y actualizar stock
      for (let i = 0; i < ingredientes.length; i++) {
        let ingredienteFor = ingredientes[i];

        // Verificar si el ingrediente existe
        let [ingredient] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [ingredienteFor.idIngrediente]);
        if (ingredient.length === 0) {
          return { error: `No existe el ingrediente con ID ${ingredienteFor.idIngrediente}` };
        }

        // Acceder al objeto del ingrediente
        let ingredienteData = ingredient[0];

        // console.log('Ingrediente encontrado:', ingredienteData);

        // Insertar relación producto-ingrediente
        let queryProductoXIngrediente = `
          INSERT INTO PRODUCTO_X_INGREDIENTE (idProducto, idIngrediente, cantidadUsada) 
          VALUES (?, ?, ?)
        `;
        let resultRelation = await db.query(queryProductoXIngrediente, [idProducto, ingredienteFor.idIngrediente, ingredienteFor.cantidadUsada]);

        if (resultRelation.affectedRows === 0) {
          return { error: 'No se pudo asociar el ingrediente al producto' };
        }

        // Actualizar stock del ingrediente
        let newStock = 0.0;

        if (ingredienteData.unidadComprada !== ingredienteData.unidadDeMedida) {
          if (!ingredienteData.equivalencia || ingredienteData.equivalencia === 0) {
            return { error: `La equivalencia no está definida para el ingrediente con ID ${ingredienteFor.idIngrediente}` };
          }
          newStock = parseFloat(ingredienteData.cantidadComprada) - (ingredienteFor.cantidadUsada / ingredienteData.equivalencia);
        } else {
          newStock = parseFloat(ingredienteData.cantidadComprada) - parseFloat(ingredienteFor.cantidadUsada);
        }

        if (newStock < 0) {
          return { error: `El stock del ingrediente con ID ${ingredienteFor.idIngrediente} no puede ser negativo` };
        }

        let resultUpdate = await db.query('UPDATE INGREDIENTE SET cantidadComprada = ? WHERE idIngrediente = ?', [newStock, ingredienteFor.idIngrediente]);
        if (resultUpdate.affectedRows === 0) {
          return { error: `No se pudo actualizar el stock del ingrediente con ID ${ingredienteFor.idIngrediente}` };
        }
        console.log('Stock actualizado con éxito');
      }

      console.log('Producto creado con éxito');
      return { message: 'Producto creado con éxito', insertId: idProducto };
    } catch (error) {
      console.error('Error al crear el producto:', error);
      throw new Error('Error al crear el producto');
    }
  },
  
  updateProduct: async (idProductos, product) => {
  },


  getAll: async () => {
    try {
      const [result] = await db.query('SELECT * FROM PRODUCTO');

      for (let i = 0; i < result.length; i++) {
        const [ingredientes] = await db.query(
          'SELECT INGREDIENTE.nombre, PRODUCTO_X_INGREDIENTE.cantidadUsada FROM INGREDIENTE JOIN PRODUCTO_X_INGREDIENTE ON INGREDIENTE.idIngrediente = PRODUCTO_X_INGREDIENTE.idIngrediente WHERE PRODUCTO_X_INGREDIENTE.idProducto = ?',
          [result[i].idProductos]
        );
        result[i].ingredientes = ingredientes;
      }

      return result;
    } catch (error) {
      console.error('Error al obtener los productos:', error);
      throw new Error('Error al obtener los productos');
    }
  },

  getOne: async (idProductos) => {
    try {
      const [result] = await db.query('SELECT * FROM PRODUCTO WHERE idProductos = ?', [idProductos]);

      if (result.length === 0) {
        return { error: 'No existe ese producto' };
      }

      const [ingredientes] = await db.query(
        'SELECT INGREDIENTE.nombre, PRODUCTO_X_INGREDIENTE.cantidadUsada FROM INGREDIENTE JOIN PRODUCTO_X_INGREDIENTE ON INGREDIENTE.idIngrediente = PRODUCTO_X_INGREDIENTE.idIngrediente WHERE PRODUCTO_X_INGREDIENTE.idProducto = ?',
        [idProductos]
      );

      result[0].ingredientes = ingredientes;
      return result[0];
    } catch (error) {
      console.error('Error al obtener el producto:', error);
      throw new Error('Error al obtener el producto');
    }
  },

  getByCategory: async (categoria) => {
    try {
      const [result] = await db.query('SELECT * FROM PRODUCTO WHERE idCategoria = ?', [categoria]);
      return result;
    } catch (error) {
      console.error('Error al obtener productos por categoría:', error);
      throw new Error('Error al obtener productos por categoría');
    }
  },

  updateStock: async (idProductos, stock) => {
    if (typeof stock !== 'number' || stock < 0) {
      return { error: 'El stock debe ser un número mayor o igual a 0' };
    }

    try {
      const [result] = await db.query('UPDATE PRODUCTO SET stock = ? WHERE idProductos = ?', [stock, idProductos]);
      return result.affectedRows ? { message: 'Stock actualizado con éxito' } : { error: 'No se pudo actualizar el stock' };
    } catch (error) {
      console.error('Error al actualizar el stock:', error);
      throw new Error('Error al actualizar el stock');
    }
  },

  updatePrice: async (idProductos, price) => {
    if (typeof price !== 'number' || price < 0) {
      return { error: 'El precio debe ser un número mayor o igual a 0' };
    }

    try {
      const [result] = await db.query('UPDATE PRODUCTO SET precio = ? WHERE idProductos = ?', [price, idProductos]);
      return result.affectedRows ? { message: 'Precio actualizado con éxito' } : { error: 'No se pudo actualizar el precio' };
    } catch (error) {
      console.error('Error al actualizar el precio:', error);
      throw new Error('Error al actualizar el precio');
    }
  },

  updateDescription: async (idProductos, descripcion) => {
    if (!descripcion || typeof descripcion !== 'string') {
      return { error: 'La descripción es inválida' };
    }

    try {
      const [result] = await db.query('UPDATE PRODUCTO SET descripcion = ? WHERE idProductos = ?', [descripcion, idProductos]);
      return result.affectedRows ? { message: 'Descripción actualizada con éxito' } : { error: 'No se pudo actualizar la descripción' };
    } catch (error) {
      console.error('Error al actualizar la descripción:', error);
      throw new Error('Error al actualizar la descripción');
    }
  },

  updateImage: async (idProductos, imagen) => {
    if (!imagen || typeof imagen !== 'string') {
      return { error: 'La URL de la imagen es inválida' };
    }

    try {
      const [result] = await db.query('UPDATE PRODUCTO SET imagen = ? WHERE idProductos = ?', [imagen, idProductos]);
      return result.affectedRows ? { message: 'Imagen actualizada con éxito' } : { error: 'No se pudo actualizar la imagen' };
    } catch (error) {
      console.error('Error al actualizar la imagen:', error);
      throw new Error('Error al actualizar la imagen');
    }
  },

  deleteProduct: async (idProductos) => {
    try {
      const [product] = await db.query('SELECT * FROM PRODUCTO WHERE idProductos = ?', [idProductos]);

      if (product.length === 0) {
        return { error: 'No existe el producto' };
      }

      await db.query('DELETE FROM PRODUCTO_X_INGREDIENTE WHERE idProducto = ?', [idProductos]);
      const [deleteResult] = await db.query('DELETE FROM PRODUCTO WHERE idProductos = ?', [idProductos]);

      return deleteResult.affectedRows ? { message: 'Producto eliminado con éxito' } : { error: 'No se pudo eliminar el producto' };
    } catch (error) {
      console.error('Error al eliminar el producto:', error);
      throw new Error('Error al eliminar el producto');
    }
  }
};

module.exports = Producto;
