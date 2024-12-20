const jwt = require('jsonwebtoken');
const Usuario = require('../models/userModel');
const { JWT_SECRET } = process.env;

// Login
const login = async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  if (!correo_electronico || !contrasena) {
    return res.status(400).json({ error: 'Correo electrónico y contraseña son obligatorios' });
  }

  try {
    const usuario = await Usuario.getByEmail(correo_electronico);

    if (usuario.error) {
      return res.status(404).json({ error: 'Usuario con ese email no encontrado' });
    }

    const isPasswordValid = await Usuario.validatePassword(contrasena, usuario.contrasena);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo_electronico: usuario.correo_electronico,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({ message: 'LOGIN EXITOSO', token });
  } catch (error) {
    console.error('Error al autenticar:', error);
    res.status(500).json({ error: 'Error al autenticar' });
  }
};

// Register
const register = async (req, res) => {
  const { nombre, apellido, correo_electronico, contrasena } = req.body;

  if (!nombre || !apellido || !correo_electronico || !contrasena) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const usuarioExistente = await Usuario.getByEmail(correo_electronico);

    if (!usuarioExistente.error) {
      return res.status(400).json({ error: 'El correo electrónico ya está en uso' });
    }

    const result = await Usuario.create(nombre, apellido, correo_electronico, contrasena);

    res.status(201).json({ message: `REGISTRO EXITOSO ID: ${result.insertId}` });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ error: 'Error al registrar' });
  }
};

module.exports = { login, register };
