const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// MongoDB Schema
const FileSchema = new mongoose.Schema({
  url: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
});
const File = mongoose.models.File || mongoose.model('File', FileSchema);

// Connection function - har request pe call hogi
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGO_URI);
};

// Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Root
app.get('/', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: "Server running",
      mongo: mongoose.connection.readyState === 1 ? "Connected ✅" : "Disconnected ❌"
    });
  } catch (err) {
    res.json({
      status: "Server running",
      mongo: "Disconnected ❌",
      error: err.message
    });
  }
});

// Get files
app.get('/api/files', async (req, res) => {
  try {
    await connectDB();
    const files = await File.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    await connectDB();
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'file_sharing_app' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const newFile = await File.create({
      url: result.secure_url,
      name: req.file.originalname
    });

    res.json(newFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;