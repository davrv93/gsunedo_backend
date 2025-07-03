const express = require('express');
const cors = require('cors');
const fileRoutes = require('./routes/fileRoutes');
const formRoutes = require('./routes/formRoutes');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/files', fileRoutes);
app.use('/api/form', formRoutes);

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
