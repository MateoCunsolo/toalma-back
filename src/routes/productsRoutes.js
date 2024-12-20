const express = require('express');
const productosController = require('../controllers/products-controller');
const router = express.Router();
const authGuard = require('../middlewares/authGuard');

//CREAR
router.post('/create', authGuard,productosController.createProducto);

//OBETENER
router.get('/', productosController.getProductos);
router.get('/:id', productosController.getProductoById);
router.get('/categoria/:categoria', productosController.getProductosByCategory);

//ACTUALIZAR
router.put('/update/all-imagenes', authGuard, productosController.updateALLIMG);
router.put('/update/stock/:id', authGuard, productosController.updateProductoStockById);
router.put('/update/precio/:id', authGuard, productosController.updateProductoPriceById);
router.put('/update/descripcion/:id', authGuard, productosController.updateProductoDescriptionById);
router.put('/update/nombre/:id', authGuard, productosController.updateProductoNameById);
router.put('/update/imagen/:id', authGuard, productosController.updateProductoImgById);
router.put('/update/categoria/:id', authGuard, productosController.updateProductoCategoryById);
router.put('/update/:id', authGuard, productosController.updateProductoById); 

//ELIMINAR
router.delete('/delete/:id', authGuard, productosController.deleteProductoById);

module.exports = router;
