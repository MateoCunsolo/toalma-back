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

    let costoXIngredienteUnitario = 0.0;
    for (let i = 0; i < ingredientes.length; i++) {
      let [ingredient] = await db.query('SELECT * FROM INGREDIENTE WHERE idIngrediente = ?', [ingredientes[i].idIngrediente]);
      if (ingredient.length === 0) {
        return { error: `No existe el ingrediente con ID ${ingredientes[i].idIngrediente}` };
      }
      if (!ingredientes[i].cantidadUsada || ingredientes[i].cantidadUsada <= 0) {
        return { error: `La cantidad usada del ingrediente con ID ${ingredientes[i].idIngrediente} es inválida` };
      }
      costoXIngredienteUnitario = costoXIngredienteUnitario + ingredientes[i].cantidadUsada * ingredient[0].costo;
      console.log('Costo unitario acumulado:', costoXIngredienteUnitario);
    }

    const [ganancia] = await db.query('SELECT porcentaje_ganancia FROM USUARIO WHERE idUsuario = 1');
    let porcentajeGanancia = 100;
    if (ganancia.length === 0) {
      console.log('No se pudo obtener la ganancia del usuario. Se usará 100%.');
    } else {
      porcentajeGanancia = Number(ganancia[0].porcentaje_ganancia ?? 100);
    }
    const costoUnitario = costoXIngredienteUnitario;
    let precioFinal = costoUnitario * (1 + (porcentajeGanancia / 100));
    console.log('Ganancia aplicada (%):', porcentajeGanancia);
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

        // Insertar relación producto-ingrediente (cantidad por unidad)
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
        const cantidadTotalUsada = ingredienteFor.cantidadUsada * stock;

        if (ingredienteData.unidadComprada !== ingredienteData.unidadDeMedida) {
          if (!ingredienteData.equivalencia || ingredienteData.equivalencia === 0) {
            return { error: `La equivalencia no está definida para el ingrediente con ID ${ingredienteFor.idIngrediente}` };
          }
          const totalDisponible = parseFloat(ingredienteData.cantidadComprada) * ingredienteData.equivalencia;
          if (cantidadTotalUsada > totalDisponible) {
            return { error: `No hay stock suficiente del ingrediente con ID ${ingredienteFor.idIngrediente}` };
          }
          newStock = parseFloat(ingredienteData.cantidadComprada) - (cantidadTotalUsada / ingredienteData.equivalencia);
        } else {
          if (cantidadTotalUsada > parseFloat(ingredienteData.cantidadComprada)) {
            return { error: `No hay stock suficiente del ingrediente con ID ${ingredienteFor.idIngrediente}` };
          }
          newStock = parseFloat(ingredienteData.cantidadComprada) - parseFloat(cantidadTotalUsada);
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
      const [ganancia] = await db.query('SELECT porcentaje_ganancia FROM USUARIO WHERE idUsuario = 1');
      const porcentajeGanancia = ganancia.length ? Number(ganancia[0].porcentaje_ganancia ?? 100) : 100;

      for (let i = 0; i < result.length; i++) {
        const [ingredientes] = await db.query(
          'SELECT INGREDIENTE.nombre, INGREDIENTE.costo, PRODUCTO_X_INGREDIENTE.cantidadUsada FROM INGREDIENTE JOIN PRODUCTO_X_INGREDIENTE ON INGREDIENTE.idIngrediente = PRODUCTO_X_INGREDIENTE.idIngrediente WHERE PRODUCTO_X_INGREDIENTE.idProducto = ?',
          [result[i].idProductos]
        );
        result[i].ingredientes = ingredientes;
        const costoUnitario = ingredientes.reduce((acc, item) => acc + (Number(item.cantidadUsada || 0) * Number(item.costo || 0)), 0);
        const precioUnitario = costoUnitario * (1 + (porcentajeGanancia / 100));
        result[i].costoUnitario = costoUnitario;
        result[i].precioUnitario = precioUnitario;
        result[i].precio = precioUnitario;
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

      const [ganancia] = await db.query('SELECT porcentaje_ganancia FROM USUARIO WHERE idUsuario = 1');
      const porcentajeGanancia = ganancia.length ? Number(ganancia[0].porcentaje_ganancia ?? 100) : 100;

      const [ingredientes] = await db.query(
        'SELECT INGREDIENTE.nombre, INGREDIENTE.costo, PRODUCTO_X_INGREDIENTE.cantidadUsada FROM INGREDIENTE JOIN PRODUCTO_X_INGREDIENTE ON INGREDIENTE.idIngrediente = PRODUCTO_X_INGREDIENTE.idIngrediente WHERE PRODUCTO_X_INGREDIENTE.idProducto = ?',
        [idProductos]
      );

      result[0].ingredientes = ingredientes;
      const costoUnitario = ingredientes.reduce((acc, item) => acc + (Number(item.cantidadUsada || 0) * Number(item.costo || 0)), 0);
      const precioUnitario = costoUnitario * (1 + (porcentajeGanancia / 100));
      result[0].costoUnitario = costoUnitario;
      result[0].precioUnitario = precioUnitario;
      result[0].precio = precioUnitario;
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

  updateStockWithIngredients: async (idProductos, deltaStock) => {
    if (typeof deltaStock !== 'number' || Number.isNaN(deltaStock) || deltaStock <= 0) {
      return { error: 'El aumento de stock debe ser un número mayor a 0' };
    }

    try {
      const [product] = await db.query('SELECT * FROM PRODUCTO WHERE idProductos = ?', [idProductos]);
      if (!product.length) {
        return { error: 'No existe el producto' };
      }

      const [ingredientes] = await db.query(
        'SELECT INGREDIENTE.idIngrediente, INGREDIENTE.cantidadComprada, INGREDIENTE.unidadComprada, INGREDIENTE.unidadDeMedida, INGREDIENTE.equivalencia, PRODUCTO_X_INGREDIENTE.cantidadUsada FROM INGREDIENTE JOIN PRODUCTO_X_INGREDIENTE ON INGREDIENTE.idIngrediente = PRODUCTO_X_INGREDIENTE.idIngrediente WHERE PRODUCTO_X_INGREDIENTE.idProducto = ?',
        [idProductos]
      );

      if (!ingredientes.length) {
        return { error: 'No hay ingredientes asociados para aumentar stock' };
      }

      for (const ing of ingredientes) {
        const requerido = Number(ing.cantidadUsada || 0) * deltaStock;
        const equivalencia = Number(ing.equivalencia || 1);
        const disponible = ing.unidadComprada === ing.unidadDeMedida
          ? Number(ing.cantidadComprada || 0)
          : Number(ing.cantidadComprada || 0) * equivalencia;

        if (requerido > disponible) {
          return { error: `Stock insuficiente de ingrediente ${ing.idIngrediente}` };
        }
      }

      for (const ing of ingredientes) {
        const requerido = Number(ing.cantidadUsada || 0) * deltaStock;
        const equivalencia = Number(ing.equivalencia || 1);
        const nuevoStock = ing.unidadComprada === ing.unidadDeMedida
          ? Number(ing.cantidadComprada || 0) - requerido
          : Number(ing.cantidadComprada || 0) - (requerido / equivalencia);

        const [updateIng] = await db.query('UPDATE INGREDIENTE SET cantidadComprada = ? WHERE idIngrediente = ?', [nuevoStock, ing.idIngrediente]);
        if (!updateIng.affectedRows) {
          return { error: `No se pudo actualizar el stock del ingrediente ${ing.idIngrediente}` };
        }
      }

      const nuevoStockProducto = Number(product[0].stock || 0) + deltaStock;
      const [updateProduct] = await db.query('UPDATE PRODUCTO SET stock = ? WHERE idProductos = ?', [nuevoStockProducto, idProductos]);
      if (!updateProduct.affectedRows) {
        return { error: 'No se pudo actualizar el stock del producto' };
      }

      return { message: 'Stock del producto actualizado', stock: nuevoStockProducto };
    } catch (error) {
      console.error('Error al actualizar stock del producto:', error);
      throw new Error('Error al actualizar stock del producto');
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
