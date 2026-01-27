const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings-controller');
const authGuard = require('../middlewares/authGuard');

router.get('/ganancia', authGuard, settingsController.getProfitPercentage);
router.put('/ganancia', authGuard, settingsController.updateProfitPercentage);

module.exports = router;
