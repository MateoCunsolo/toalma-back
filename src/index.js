require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


// ============================================== Middlewares ================================================
app.use(express.json());
app.use(cors());


// ============================================ Importacion Rutas ============================================

// Users
const authRoutes = require('./routes/authRoutes');

//Products
const productsRoutes = require('./routes/productsRoutes');
const productsCategoriesRoutes = require('./routes/products-categories-routes');

//Ingredients
const ingredientsRoutes = require('./routes/ingredients-routes');
const ingredientsCategoriesRoutes = require('./routes/ingredients-categories-routes');


// ================================================= Rutas ==================================================

// Ruta principal
app.get('/', (req, res) => {
    res.status(200).send('TOALMA DATABASE');
});

// Rutas de productos
app.use('/productos', productsRoutes);
app.use('/categorias-productos', productsCategoriesRoutes);

// Rutas de ingredientes
app.use('/ingredientes', ingredientsRoutes);
app.use('/categorias-ingredientes', ingredientsCategoriesRoutes);

// Rutas de usuarios
app.use('/auth', authRoutes);

// Manejo de rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});


// ============================================== Puerto ===================================================
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
