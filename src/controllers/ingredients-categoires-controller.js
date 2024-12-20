const ingredient_category = require('../models/ingredients-categories-model');

const getIngredientCategories = async (req, res) => {
    try {
        const ingredientCategories = await ingredient_category.getAll();
        res.status(200).json(ingredientCategories);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener categorías de ingredientes' });
    }
}

const createIngredientCategory = async (req, res) => {
    try {
        const ingredientCategory = req.body;
        const result = await ingredient_category.create(ingredientCategory);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error al crear categoría de ingrediente' });
    }
}

const deleteIngredientCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ingredient_category.delete(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
}

const getIngredientCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ingredient_category.getById(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
}

const updateIngredientCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredientCategory = req.body;
        const result = await ingredient_category.update(id, ingredientCategory);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
}

module.exports = { getIngredientCategories, createIngredientCategory, deleteIngredientCategoryById, getIngredientCategoryById, updateIngredientCategoryById };