const Usuario = require('../models/userModel');

const getProfitPercentage = async (req, res) => {
  try {
    const result = await Usuario.getProfitPercentage(1);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.status(200).json({ porcentaje_ganancia: result.porcentaje_ganancia });
  } catch (error) {
    console.error('Error al obtener porcentaje de ganancia:', error.message);
    res.status(500).json({ error: 'Error al obtener porcentaje de ganancia' });
  }
};

const updateProfitPercentage = async (req, res) => {
  try {
    const { porcentaje_ganancia } = req.body;
    const porcentaje = Number(porcentaje_ganancia);
    const result = await Usuario.updateProfitPercentage(porcentaje, 1);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.status(200).json({ message: result.message, porcentaje_ganancia: porcentaje });
  } catch (error) {
    console.error('Error al actualizar porcentaje de ganancia:', error.message);
    res.status(500).json({ error: 'Error al actualizar porcentaje de ganancia' });
  }
};

module.exports = { getProfitPercentage, updateProfitPercentage };
