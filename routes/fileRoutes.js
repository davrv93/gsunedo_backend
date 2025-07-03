const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const minioClient = require('../minioClient');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });

    const bucket = process.env.ADM_MINIO_BUCKET;
    const originalExt = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${originalExt}`;
    const filePath = req.file.path;

    // Subir archivo a MinIO
    await minioClient.fPutObject(bucket, filename, filePath, {
      'Content-Type': req.file.mimetype
    });

    // Eliminar archivo temporal local
    fs.unlinkSync(filePath);

  const publicUrl = `${process.env.ADM_MINIO_ENDPOINT}/${bucket}/${filename}`;
    res.json({ message: 'Archivo subido a MinIO', filePath: publicUrl });
  } catch (err) {
    console.error("Error subiendo a MinIO:", err);
    res.status(500).json({ message: 'Error subiendo a MinIO', error: err.message });
  }
});

module.exports = router;
