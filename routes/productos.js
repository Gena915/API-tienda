const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '..', 'data', 'infoProductos.json');
const ventasPath = path.join(__dirname, '..', 'data', 'ventas.json');

// Leer todos los productos
router.get('/', (req, res) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    const productos = JSON.parse(data);
    res.json(productos);
  });
});

// Leer producto por código
router.get('/:codigo', (req, res) => {
  const codigoBuscado = req.params.codigo;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    const productos = JSON.parse(data);
    const producto = productos.find(p => p.codigo === codigoBuscado);

    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    res.json(producto);
  });
});

// Agregar nuevo producto
router.post('/', (req, res) => {
  const nuevoProducto = req.body;

  if (!nuevoProducto.codigo || !nuevoProducto.nombre || !nuevoProducto.precio || nuevoProducto.stock == null) {
    return res.status(400).json({ mensaje: 'Faltan datos del producto' });
  }

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    const productos = JSON.parse(data);
    const existe = productos.find(p => p.codigo === nuevoProducto.codigo);
    if (existe) return res.status(400).json({ mensaje: 'Ya existe un producto con ese código' });

    productos.push(nuevoProducto);

    fs.writeFile(filePath, JSON.stringify(productos, null, 2), (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al guardar producto' });

      res.status(201).json({ mensaje: 'Producto agregado correctamente', producto: nuevoProducto });
    });
  });
});

// Vender producto
router.post('/vender/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  const cantidad = Number(req.body.cantidad) || 1;

  if (cantidad <= 0) {
    return res.status(400).json({ mensaje: 'Cantidad insuficiente' });
  }

  fs.readFile(filePath, 'utf8', (err, dataProductos) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    let productos;
    try {
      productos = JSON.parse(dataProductos);
    } catch {
      return res.status(500).json({ mensaje: 'Error al parsear productos' });
    }

    const producto = productos.find(p => p.codigo === codigo);

    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    if (producto.stock < cantidad) return res.status(400).json({ mensaje: 'Stock insuficiente' });

    producto.stock -= cantidad;

    fs.writeFile(filePath, JSON.stringify(productos, null, 2), (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al actualizar stock' });

      fs.readFile(ventasPath, 'utf8', (err, dataVentas) => {
        let ventas;
        try {
          ventas = err ? { totalVendido: 0 } : JSON.parse(dataVentas);
        } catch {
          ventas = { totalVendido: 0 };
        }

        ventas.totalVendido += producto.precio * cantidad;

        fs.writeFile(ventasPath, JSON.stringify(ventas, null, 2), (err) => {
          if (err) return res.status(500).json({ mensaje: 'Error al registrar venta' });

          res.json({ mensaje: 'Venta registrada', producto });
        });
      });
    });
  });
});
// Resetear ventas
router.post('/reset-ventas', (req, res) => {
  const nuevoEstado = { totalVendido: 0 };

  fs.writeFile(ventasPath, JSON.stringify(nuevoEstado, null, 2), (err) => {
    if (err) return res.status(500).json({ mensaje: 'Error al reiniciar ventas' });

    res.json({ mensaje: 'Ventas reiniciadas correctamente', ventas: nuevoEstado });
  });
});

// Reponer producto
router.post('/reponer/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  const cantidad = req.body.cantidad || 1;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    const productos = JSON.parse(data);
    const producto = productos.find(p => p.codigo === codigo);

    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    producto.stock += cantidad;

    fs.writeFile(filePath, JSON.stringify(productos, null, 2), (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al actualizar producto' });

      res.json({ mensaje: 'Stock actualizado', producto });
    });
  });
});

// Actualizar producto
router.put('/:codigo', (req, res) => {
  const codigo = req.params.codigo;
  const productoActualizado = req.body;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    const productos = JSON.parse(data);
    const index = productos.findIndex(p => p.codigo === codigo);

    if (index === -1) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    productos[index] = { ...productos[index], ...productoActualizado };

    fs.writeFile(filePath, JSON.stringify(productos, null, 2), (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al guardar producto' });

      res.json({ mensaje: 'Producto actualizado', producto: productos[index] });
    });
  });
});

// Eliminar producto
router.delete('/:codigo', (req, res) => {
  const codigo = req.params.codigo;

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ mensaje: 'Error al leer productos' });

    let productos = JSON.parse(data);
    const index = productos.findIndex(p => p.codigo === codigo);

    if (index === -1) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    const productoEliminado = productos.splice(index, 1)[0];

    fs.writeFile(filePath, JSON.stringify(productos, null, 2), (err) => {
      if (err) return res.status(500).json({ mensaje: 'Error al guardar archivo' });

      res.json({ mensaje: 'Producto eliminado correctamente', producto: productoEliminado });
    });
  });
});

module.exports = router;
