const express = require('express');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');
const salesController = require('../controllers/sales-controller');

router.get('/resumen', authGuard, salesController.getResumen);
router.get('/', authGuard, salesController.listSales);
router.get('/:id', authGuard, salesController.getSale);
router.post('/', authGuard, salesController.createSale);
router.put('/:id', authGuard, salesController.updateSale);
router.delete('/:id', authGuard, salesController.deleteSale);

module.exports = router;
