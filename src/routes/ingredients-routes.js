const express = require('express');
const router = express.Router();
const ingredientsController = require('../controllers/ingredients-controller');
const authGuard = require('../middlewares/authGuard');

router.post('/create', authGuard, ingredientsController.createIngredient);
router.get('/', authGuard, ingredientsController.getIngredients);
router.get('/:id', authGuard, ingredientsController.getIngredientById);
router.put('/update/:id', authGuard, ingredientsController.updateIngredientById);
router.delete('/delete/:id', authGuard, ingredientsController.deleteIngredientById);

module.exports = router;