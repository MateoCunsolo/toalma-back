
const express = require('express');
const router = express.Router();
const ingredientsCategoriesController = require('../controllers/ingredients-categoires-controller');

router.post('/create', ingredientsCategoriesController.createIngredientCategory);
router.get('/', ingredientsCategoriesController.getIngredientCategories);
router.get('/:id', ingredientsCategoriesController.getIngredientCategoryById);
router.put('/update/:id', ingredientsCategoriesController.updateIngredientCategoryById);
router.delete('/delete/:id', ingredientsCategoriesController.deleteIngredientCategoryById);






module.exports = router;