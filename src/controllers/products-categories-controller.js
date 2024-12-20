const Categoria = require('../models/products-categories-model');

const getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.getAll();
    res.status(200).json(categorias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const createCategoria = async (req, res) => {
  console.log(req.body);
  try {
    const { nombre } = req.body;
    const result = await Categoria.create(nombre);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const deleteCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Categoria.deleteById(id);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error });
  }
}


module.exports = { getCategorias, createCategoria, deleteCategoriaById};
