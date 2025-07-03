const express = require('express');
const app = express();
const routerProductos = require('./routes/productos');

// leer JSON (req.body)
app.use(express.json());

// router de productos - /api/productos
app.use('/api/productos', routerProductos);

// ruta principal (inicio) 
app.get('/', (req, res) => {
    res.send('API de Tienda en Funcionamiento');
});

const PORT = 3000;

// iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});