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
const formRoutes = require('./routes/formRoutes');
const studentAwardRoutes = require('./routes/studentAwardRoutes');
const multer = require('multer');
const fs = require('fs');
const homeContentRoutes = require('./routes/homeContentRoutes');

dotenv.config();
connectDB();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Add CORS headers for image requests
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', corsOptions.origin);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Body parser configuration
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch(e) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid JSON' 
      });
    }
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Add a middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// For Configuring  multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept images and videos
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|webm|mov)$/)) {
      return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Update the uploads directory configuration
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Add error handling for static files
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(uploadsDir, req.url);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/content', homeContentRoutes);
app.use('/api/admin/forms', formRoutes);
app.use('/api/student-awards', studentAwardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));