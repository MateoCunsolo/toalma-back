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
  getById: async (idUsuario) => {
    if (!idUsuario || isNaN(idUsuario)) {
      return { error: 'ID inválido' };
    }
    try {
      const query = 'SELECT idUsuario, nombre, apellido, correo_electronico FROM USUARIO WHERE idUsuario = ?';
      const [result] = await db.query(query, [idUsuario]);
      return result.length ? result[0] : { error: 'No se encontró el usuario' };
    } catch (error) {
      console.error('Error al buscar el usuario por ID:', error);
      throw new Error('Error al buscar el usuario');
    }
  },
  updateProfile: async (idUsuario, profile) => {
    if (!idUsuario || isNaN(idUsuario)) {
      return { error: 'ID inválido' };
    }
    const { nombre, apellido, correo_electronico } = profile;
    if (!nombre || !apellido || !correo_electronico) {
      return { error: 'Todos los campos son obligatorios' };
    }
    try {
      const query = 'UPDATE USUARIO SET nombre = ?, apellido = ?, correo_electronico = ? WHERE idUsuario = ?';
      const [result] = await db.query(query, [nombre, apellido, correo_electronico, idUsuario]);
      return result.affectedRows ? { message: 'Perfil actualizado' } : { error: 'No se pudo actualizar el perfil' };
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      throw new Error('Error al actualizar el perfil');
    }
  },
  updatePassword: async (idUsuario, currentPassword, newPassword) => {
    if (!idUsuario || isNaN(idUsuario)) {
      return { error: 'ID inválido' };
    }
    if (!currentPassword || !newPassword) {
      return { error: 'Contraseñas inválidas' };
    }
    try {
      const query = 'SELECT contrasena FROM USUARIO WHERE idUsuario = ?';
      const [result] = await db.query(query, [idUsuario]);
      if (!result.length) {
        return { error: 'No se encontró el usuario' };
      }
      const storedPassword = result[0].contrasena;
      const isValid = await bcrypt.compare(currentPassword, storedPassword);
      if (!isValid) {
        return { error: 'Contraseña actual incorrecta' };
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const [updateResult] = await db.query('UPDATE USUARIO SET contrasena = ? WHERE idUsuario = ?', [hashedPassword, idUsuario]);
      return updateResult.affectedRows ? { message: 'Contraseña actualizada' } : { error: 'No se pudo actualizar la contraseña' };
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error);
      throw new Error('Error al actualizar la contraseña');
    }
  },
  getProfitPercentage: async (idUsuario = 1) => {
    try {
      const query = 'SELECT porcentaje_ganancia FROM USUARIO WHERE idUsuario = ?';
      const [result] = await db.query(query, [idUsuario]);
      if (!result.length) {
        return { error: 'No se encontró el usuario' };
      }
      return { porcentaje_ganancia: Number(result[0].porcentaje_ganancia ?? 100) };
    } catch (error) {
      console.error('Error al obtener porcentaje de ganancia:', error);
      throw new Error('Error al obtener porcentaje de ganancia');
    }
  },
  updateProfitPercentage: async (porcentaje, idUsuario = 1) => {
    if (typeof porcentaje !== 'number' || Number.isNaN(porcentaje) || porcentaje < 0) {
      return { error: 'El porcentaje de ganancia es inválido' };
    }
    try {
      const query = 'UPDATE USUARIO SET porcentaje_ganancia = ? WHERE idUsuario = ?';
      const [result] = await db.query(query, [porcentaje, idUsuario]);
      return result.affectedRows ? { message: 'Porcentaje actualizado' } : { error: 'No se pudo actualizar el porcentaje' };
    } catch (error) {
      console.error('Error al actualizar porcentaje de ganancia:', error);
      throw new Error('Error al actualizar porcentaje de ganancia');
    }
  },
};

module.exports = Usuario;
