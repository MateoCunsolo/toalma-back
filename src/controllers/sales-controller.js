const Ventas = require('../models/salesModel');

const listSales = async (req, res) => {
  try {
    const rows = await Ventas.listSummaries();
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al listar ventas' });
  }
};

const getResumen = async (req, res) => {
  try {
    const totalGananciaReal = await Ventas.totalGananciaReal();
    res.status(200).json({ totalGananciaReal });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener la ganancia' });
  }
};

const getSale = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const data = await Ventas.getById(id);
    if (data.error) {
      return res.status(404).json(data);
    }
    res.status(200).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
};

const createSale = async (req, res) => {
  try {
    const result = await Ventas.create(req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear la venta' });
  }
};

const updateSale = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await Ventas.update(id, req.body);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar la venta' });
  }
};

const deleteSale = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await Ventas.remove(id);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.status(200).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar la venta' });
  }
};

module.exports = {
  listSales,
  getResumen,
  getSale,
  createSale,
  updateSale,
  deleteSale
};
