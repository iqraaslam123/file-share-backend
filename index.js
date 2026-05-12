const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

// MongoDB Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log("MongoDB Error:", err.message));
// MongoDB Connection
let mongoStatus = "Disconnected";
let mongoError = "";

mongoose.connect(process.env.MONGO_URI)
  .then(() => { mongoStatus = "Connected"; })
  .catch(err => { 
    mongoStatus = "Disconnected";
    mongoError = err.message;
  });

// Root route
app.get('/', (req, res) => {
  res.json({
    status: "Server running",
    mongo: mongoStatus,
    mongoError: mongoError,
    env: {
      mongo_uri: process.env.MONGO_URI ? "Set ✅" : "Missing ❌",
      cloud_name: process.env.CLOUD_NAME ? "Set ✅" : "Missing ❌",
      api_key: process.env.API_KEY ? "Set ✅" : "Missing ❌",
      api_secret: process.env.API_SECRET ? "Set ✅" : "Missing ❌",
    }
  });
});
// MongoDB Schema
const FileSchema = new mongoose.Schema({
  url: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);

// Multer - Memory Storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Root route - test ke liye
app.get('/', (req, res) => {
  res.json({
    status: "Server running",
    mongo: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    env: {
      mongo_uri: process.env.MONGO_URI ? "Set ✅" : "Missing ❌",
      cloud_name: process.env.CLOUD_NAME ? "Set ✅" : "Missing ❌",
      api_key: process.env.API_KEY ? "Set ✅" : "Missing ❌",
      api_secret: process.env.API_SECRET ? "Set ✅" : "Missing ❌",
    }
  });
});

// Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
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

app.get('/api/files', async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));