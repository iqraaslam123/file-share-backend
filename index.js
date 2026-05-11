const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
// Cloudinary Configuration
cloudinary.config({
cloud_name: process.env.CLOUD_NAME, api_key: process.env.API_KEY, api_secret: process.env.API_SECRET
});
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));
// MongoDB Schema
const FileSchema = new mongoose.Schema({
url: String, name: String, createdAt: { type: Date, default: Date.now }
});
const File = mongoose.model('File', FileSchema);
// Storage Engine
const storage = new CloudinaryStorage({
cloudinary: cloudinary, params: { folder: 'file_sharing_app' }
});
const upload = multer({ storage: storage });
// Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
try {
const newFile = await File.create({ url: req.file.path, name: req.file.originalname});
res.json(newFile);
} catch (error) {
res.status(500).json({ error: error.message });
}
});
app.get('/api/files', async (req, res) => {
const files = await File.find().sort({ createdAt: -1 });
res.json(files);
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));