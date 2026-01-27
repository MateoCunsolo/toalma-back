const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authGuard = (req, res, next) => {
    const token = req.headers['authorization'] ? req.headers['authorization'].split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
};
module.exports = authGuard;
