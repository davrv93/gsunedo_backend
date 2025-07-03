require('dotenv').config();
const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.ADM_MINIO_ENDPOINT,
  port: 443,
  useSSL: true,
  accessKey: process.env.ADM_MINIO_KEY,
  secretKey: "sk#LAD2022\\F1L3s",
  region: process.env.ADM_MINIO_REGION
});

module.exports = minioClient;
