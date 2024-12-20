const express = require('express');
const { getCategorias, createCategoria, deleteCategoriaById } = require('../controllers/products-categories-controller');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');

router.get('/', authGuard,getCategorias);
router.post('/create', authGuard,createCategoria);
router.delete('/delete/:id', authGuard, deleteCategoriaById);

module.exports = router;
