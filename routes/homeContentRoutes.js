const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  getHomeContent,
  updateHomeContent,
  handleHeroSlide,
  deleteHeroSlide,
  updateAbout,
  updateIntroduction,
  updateLeadership,
  deleteLeadershipMember
} = require('../controllers/homeContentController');

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Home content routes - Match exact client paths
router.get('/home', getHomeContent);
router.post('/home', upload.single('image'), updateHomeContent);

// Hero slide routes
router.post('/home/hero-slide', upload.single('image'), handleHeroSlide);
router.put('/home/hero-slide/:id', upload.single('image'), handleHeroSlide);
router.delete('/home/hero-slide/:id', deleteHeroSlide);

// About section routes
router.put('/home/about', upload.single('image'), updateAbout);

// Introduction section routes
router.put('/home/introduction', upload.single('image'), updateIntroduction);

// Leadership section routes
router.put('/home/leadership', upload.any(), updateLeadership);
router.delete('/home/leadership/members/:id', deleteLeadershipMember);

module.exports = router; 