const express = require('express');
const router = express.Router();
const ingredientsController = require('../controllers/ingredients-controller');
const authGuard = require('../middlewares/authGuard');

router.post('/create', authGuard, ingredientsController.createIngredient);
router.get('/', authGuard, ingredientsController.getIngredients);
router.get('/:id', authGuard, ingredientsController.getIngredientById);
router.get('/:id/compras', authGuard, ingredientsController.getIngredientPurchases);
router.get('/:id/auditoria', authGuard, ingredientsController.getIngredientAudit);
router.put('/compras/:id', authGuard, ingredientsController.updateIngredientPurchase);
router.delete('/compras/:id', authGuard, ingredientsController.deleteIngredientPurchase);
router.put('/update/:id', authGuard, ingredientsController.updateIngredientById);
router.put('/update-stock/:id', authGuard, ingredientsController.adjustIngredientStock);
router.delete('/delete/:id', authGuard, ingredientsController.deleteIngredientById);

module.exports = router;