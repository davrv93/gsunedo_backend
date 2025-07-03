const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');
const ADMIN_HASHED_PASSWORD = '$2b$10$Xk.B8ZzXpsBG5SCom/EJt.VGD9smVWy0Ag.1SWsOZFIqzw7C39t2.';
const bcrypt = require('bcryptjs');

const storedHash = '$2b$10$Xk.B8ZzXpsBG5SCom/EJt.VGD9smVWy0Ag.1SWsOZFIqzw7C39t2.'; // ejemplo para "UPeU2025!datos"

router.post('/api/auth/check', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Falta contraseña' });

  const valid = await bcrypt.compare(password, storedHash);
  if (!valid) return res.status(401).json({ message: 'No autorizado' });

  res.json({ success: true });
});

router.post('/auth', (req, res) => {
  const { password } = req.body;

bcrypt.hash('UPeU2025!datos', 10).then(hash => console.log(hash));

  bcrypt.compare(password, ADMIN_HASHED_PASSWORD, (err, isMatch) => {
      console.log("Contraseña recibida:", password);
  console.log("¿Coincide?:", isMatch);
    if (err) return res.status(500).json({ message: 'Error en la validación' });
    if (!isMatch) return res.status(401).json({ message: 'No autorizado' });

    res.json({ message: 'Autenticado' });
  });
});

router.post('/submit', (req, res) => {
  const {
    tipoDocumento, numeroDocumento, grado, descripcion,
    universidad, lugar, pais, archivo, presigned_url
  } = req.body;

  const query = `INSERT INTO grados (
    tipo_documento, numero_documento, grado, descripcion,
    universidad, lugar, pais, archivo, presigned_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(query, [
    tipoDocumento, numeroDocumento, grado, descripcion,
    universidad, lugar, pais, archivo, presigned_url
  ], function (err) {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    res.json({ message: 'Guardado', id: this.lastID });
  });
});

router.get('/all', (req, res) => {
  const filters = {
    tipo_documento: req.query.tipo_documento || null,
    grado: req.query.grado || null,
    lugar: req.query.lugar || null
  };

  let whereClauses = [];
  let params = [];

  if (filters.tipo_documento) {
    whereClauses.push("tipo_documento = ?");
    params.push(filters.tipo_documento);
  }

  if (filters.grado) {
    whereClauses.push("grado = ?");
    params.push(filters.grado);
  }

  if (filters.lugar) {
    whereClauses.push("lugar = ?");
    params.push(filters.lugar);
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  db.all(`SELECT * FROM grados ${whereSQL} ORDER BY fecha DESC`, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    res.json(rows);
  });
});


router.put('/update/:id', (req, res) => {
  const id = req.params.id;
  const {
    tipo_documento, numero_documento, grado, descripcion,
    universidad, lugar, pais
  } = req.body;

  const query = `UPDATE grados SET
    tipo_documento = ?, numero_documento = ?, grado = ?, descripcion = ?,
    universidad = ?, lugar = ?, pais = ?
    WHERE id = ?`;

  db.run(query, [
    tipo_documento, numero_documento, grado, descripcion,
    universidad, lugar, pais, id
  ], function (err) {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    res.json({ message: 'Actualizado correctamente' });
  });
});


router.get('/page', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search.toLowerCase()}%` : null;

  const filters = {
    tipo_documento: req.query.tipo_documento || null,
    grado: req.query.grado || null,
    lugar: req.query.lugar || null
  };

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push(`(
      LOWER(tipo_documento) LIKE ? OR
      LOWER(numero_documento) LIKE ? OR
      LOWER(grado) LIKE ? OR
      LOWER(universidad) LIKE ?
    )`);
    params.push(search, search, search, search);
  }

  if (filters.tipo_documento) {
    whereClauses.push("tipo_documento = ?");
    params.push(filters.tipo_documento);
  }

  if (filters.grado) {
    whereClauses.push("grado = ?");
    params.push(filters.grado);
  }

  if (filters.lugar) {
    whereClauses.push("lugar = ?");
    params.push(filters.lugar);
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  db.get(`SELECT COUNT(*) as total FROM grados ${whereSQL}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });

    db.all(
      `SELECT * FROM grados ${whereSQL} ORDER BY fecha DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
      (err, rows) => {
        if (err) return res.status(500).json({ message: 'DB error', error: err.message });

        res.json({
          data: rows,
          total: countResult.total,
          page,
          pageSize: limit
        });
      }
    );
  });
});

module.exports = router;
