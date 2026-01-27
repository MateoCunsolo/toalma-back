const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controller'); 
const authGuard = require('../middlewares/authGuard');

// Ruta POST para login
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authGuard, authController.getProfile);
router.put('/profile', authGuard, authController.updateProfile);
router.put('/password', authGuard, authController.changePassword);

module.exports = router;
