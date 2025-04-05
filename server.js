const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); 
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bodyParser = require('body-parser');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contact');
const path = require('path');
const contentRoutes = require('./routes/contentRoutes');
const multer = require('multer');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();

// Middleware first
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// For Configuring  multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

// Add this near the top of your file
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log when a file is accessed from the uploads directory
app.use('/uploads', (req, res, next) => {
  console.log(`Accessing file: ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/bookings', bookingRoutes);

app.use('/api/contact', contactRoutes);

app.use('/api/content', contentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
