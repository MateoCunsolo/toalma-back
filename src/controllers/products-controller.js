const productoModel = require('../models/productModel');


//CREAR PRODUCTO
const createProducto = async (req, res) => {
  try {
    const producto = req.body;
    const result = await productoModel.create(producto);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al crear producto:', error.message);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};



//OBTENER PRODUCTOS
const getProductos = async (req, res) => {
  try {
    const productos = await productoModel.getAll();
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const getProductoById = async (req, res) => {
  console.log(req.params);
  try {
    const { id } = req.params;
    const producto = await productoModel.getOne(id);
    res.status(200).json(producto);
  } catch (error) {
    console.error('Error al obtener producto:', error.message);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const getProductosByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    const productos = await productoModel.getByCategory(categoria);
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error.message);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};



//ACTUALIZAR PRODUCTO
const updateProductoStockById = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = req.body.stock;
    const result = await productoModel.updateStock(id, stock);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

const updateProductoPriceById = async (req, res) => {
  try {
    const { id } = req.params;
    const price = req.body.price;
    const result = await productoModel.updatePrice(id, price);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
}

const updateProductoDescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const description = req.body.description;
    const result = await productoModel.updateDescription(id, description);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const updateProductoNameById = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name;
    const result = await productoModel.updateName(id, name);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const updateProductoImgById = async (req, res) => {
  try {
    const { id } = req.params;
    const img = req.body.img;
    const result = await productoModel.updateImg(id, img);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const updateProductoCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = req.body.category;
    const result = await productoModel.updateCategory(id, category);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const updateProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    const result = await productoModel.updateProduct(id, product);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al actualizar producto:', error.message);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};


//ELIMINAR
const deleteProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await productoModel.deleteProduct(id);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al eliminar producto:', error.message);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

const updateALLIMG = async (req, res) => {
  const productos = req.body;
  console.log(productos);
  if (!productos) {
    return res.status(400).json({ error: 'No se proporcionaron productos' });
  } else {
    try {
      productos.forEach(async (producto) => {
        const result = await productoModel.updateImg(producto.id, producto.imagen_url);
      });
      res.status(200).json({ message: 'Imagenes actualizadas con éxito' });
    } catch (error) {
      console.error('Error al actualizar imagenes:', error.message);
      res.status(500).json({ error: 'Error al actualizar imagenes' });
    }

  }
};



module.exports = {
  getProductos,
  getProductoById,
  getProductosByCategory,
  updateProductoStockById,
  updateProductoPriceById,
  updateProductoDescriptionById,
  updateProductoNameById,
  updateProductoImgById,
  updateProductoCategoryById,
  updateProductoById,
  createProducto,
  deleteProductoById,
  updateALLIMG
};
