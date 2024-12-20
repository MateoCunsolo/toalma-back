const ingrdient = require('../models/ingredientModel');

const getIngredients = async (req, res) => {
    try {
        const ingredients = await ingrdient.getAll();
        res.status(200).json(ingredients);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener ingredientes' });
    }
};

const createIngredient = async (req, res) => {
    try {
        const ingredient = req.body;
        const result = await ingrdient.createIngredient(ingredient);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error});
    }
};

const deleteIngredientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ingrdient.deleteIngredient(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
};

const getIngredientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await ingrdient.getOne(id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
};

const updateIngredientById = async (req, res) => {
    try {
        const { id } = req.params;
        const ingredient = req.body;
        const result = await ingrdient.updateIngredient(id, ingredient);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error });
    }
};

module.exports = { getIngredients, createIngredient, deleteIngredientById, getIngredientById, updateIngredientById };