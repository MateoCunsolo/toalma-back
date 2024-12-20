const db = require('../../database/db');
const bcrypt = require('bcryptjs');

const Usuario = {
  // Buscar un usuario por correo electrónico
  getByEmail: async (email) => {
    if (!email || typeof email !== 'string') {
      return { error: 'El correo electrónico es inválido' };
    }

    try {
      const query = 'SELECT * FROM USUARIO WHERE correo_electronico = ?';
      const [result] = await db.query(query, [email]);
      return result.length ? result[0] : { error: 'No se encontró el usuario' };
    } catch (error) {
      console.error('Error al buscar el usuario por email:', error);
      throw new Error('Error al buscar el usuario');
    }
  },

  // Validar la contraseña
  validatePassword: async (inputPassword, storedPassword) => {
    if (!inputPassword || !storedPassword) {
      return { error: 'Contraseña inválida' };
    }

    try {
      return await bcrypt.compare(inputPassword, storedPassword);
    } catch (error) {
      console.error('Error al validar la contraseña:', error);
      throw new Error('Error al validar la contraseña');
    }
  },

  // Crear un nuevo usuario
  create: async (nombre, apellido, correo_electronico, contrasena) => {
    if (!nombre || !apellido || !correo_electronico || !contrasena) {
      return { error: 'Todos los campos son obligatorios' };
    }

    try {
      // Hashear la contraseña antes de guardarla
      const hashedPassword = await bcrypt.hash(contrasena, 10);

      const query = 'INSERT INTO USUARIO (nombre, apellido, correo_electronico, contrasena) VALUES (?, ?, ?, ?)';
      const [result] = await db.query(query, [nombre, apellido, correo_electronico, hashedPassword]);
      
      return { message: 'Usuario creado con éxito', insertId: result.insertId };
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw new Error('Error al crear el usuario');
    }
  },
};

module.exports = Usuario;
