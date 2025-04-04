const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import models
const HomeContent = require('../models/HomeContent');
const EventCategory = require('../models/EventCategory');
const GalleryItem = require('../models/GalleryItem');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Helper function
const handleError = (res, error, message = 'An error occurred') => {
  console.error(error);
  res.status(500).json({ success: false, message });
};

// Add all your routes here (same as in your original code)
// HOME CONTENT ENDPOINTS
router.get('/home', async (req, res) => {
  try {
    let homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      homeContent = new HomeContent({
        slides: [],
        stats: [
          { icon: 'users', count: '0', label: 'Members' },
          { icon: 'calendar', count: '0', label: 'Events' },
          { icon: 'building', count: '0', label: 'Venues' },
          { icon: 'star', count: '0', label: 'Years of Service' }
        ],
        about: {
          title: 'Welcome to VSPS',
          description: 'Default description',
          image: '/uploads/default.jpg',
          features: []
        }
      });
      await homeContent.save();
    }
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to fetch home content');
  }
});

router.put('/home/:id', upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.about.image = `/uploads/${req.file.filename}`;
    }
    
    const updatedContent = await HomeContent.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!updatedContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }
    
    res.json(updatedContent);
  } catch (error) {
    handleError(res, error, 'Failed to update home content');
  }
});

// Slides CRUD
router.post('/home/slides', upload.single('image'), async (req, res) => {
  try {
    const { title, description, isActive } = req.body;
    const homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const newSlide = {
      image: `/uploads/${req.file.filename}`,
      title,
      description,
      isActive: isActive === 'true',
      order: homeContent.slides.length
    };
    
    homeContent.slides.push(newSlide);
    await homeContent.save();
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to add slide');
  }
});

router.put('/home/slides/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;
    
    const homeContent = await HomeContent.findOne();
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }

    const slideIndex = homeContent.slides.findIndex(
      slide => slide._id.toString() === id
    );

    if (slideIndex === -1) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const updatedSlide = {
      ...homeContent.slides[slideIndex].toObject(),
      title,
      description,
      isActive: isActive === 'true'
    };

    if (req.file) {
      updatedSlide.image = `/uploads/${req.file.filename}`;
    }

    homeContent.slides[slideIndex] = updatedSlide;
    await homeContent.save();
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to update slide');
  }
});

router.delete('/home/slides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }

    const slideIndex = homeContent.slides.findIndex(
      slide => slide._id.toString() === id
    );

    if (slideIndex === -1) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    homeContent.slides.splice(slideIndex, 1);
    await homeContent.save();
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to delete slide');
  }
});

// Leadership CRUD operations
router.post('/home/leadership', upload.single('image'), async (req, res) => {
  try {
    const { name, role, description } = req.body;
    const homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const newLeader = {
      name,
      role,
      description,
      image: `/uploads/${req.file.filename}`
    };
    
    homeContent.leadership.push(newLeader);
    await homeContent.save();
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to add leader');
  }
});

router.put('/home/leadership/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, description } = req.body;
    
    const homeContent = await HomeContent.findOne();
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }

    const leaderIndex = homeContent.leadership.findIndex(
      leader => leader._id.toString() === id
    );

    if (leaderIndex === -1) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    const updatedLeader = {
      ...homeContent.leadership[leaderIndex].toObject(),
      name,
      role,
      description
    };

    if (req.file) {
      updatedLeader.image = `/uploads/${req.file.filename}`;
    }

    homeContent.leadership[leaderIndex] = updatedLeader;
    await homeContent.save();
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to update leader');
  }
});

router.delete('/home/leadership/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }

    const leaderIndex = homeContent.leadership.findIndex(
      leader => leader._id.toString() === id
    );

    if (leaderIndex === -1) {
      return res.status(404).json({ error: 'Leader not found' });
    }

    homeContent.leadership.splice(leaderIndex, 1);
    await homeContent.save();
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to delete leader');
  }
});

// About Section Update
router.put('/home/about', upload.single('image'), async (req, res) => {
  try {
    const homeContent = await HomeContent.findOne();
    if (!homeContent) {
      return res.status(404).json({ error: 'Home content not found' });
    }

    const { title, description, features } = req.body;
    
    const updatedAbout = {
      ...homeContent.about.toObject(),
      title,
      description,
      features: JSON.parse(features)
    };

    if (req.file) {
      updatedAbout.image = `/uploads/${req.file.filename}`;
    }

    homeContent.about = updatedAbout;
    await homeContent.save();
    
    res.json(homeContent);
  } catch (error) {
    handleError(res, error, 'Failed to update about section');
  }
});

// Add other necessary routes for event categories and gallery items
router.get('/event-categories', async (req, res) => {
  try {
    const categories = await EventCategory.find();
    res.json(categories);
  } catch (error) {
    handleError(res, error, 'Failed to fetch event categories');
  }
});

router.get('/gallery', async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const items = await GalleryItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
});

router.post('/gallery', upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, type } = req.body;
    const newItem = new GalleryItem({
      type,
      url: type === 'photo' ? `/uploads/${req.file.filename}` : null,
      thumbnail: type === 'video' ? `/uploads/${req.file.filename}` : null,
      title,
      description,
      category
    });
    await newItem.save();
    res.json(newItem);
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ error: 'Failed to create gallery item' });
  }
});

router.put('/gallery/:id', upload.single('file'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates[req.body.type === 'photo' ? 'url' : 'thumbnail'] = `/uploads/${req.file.filename}`;
    }
    const updatedItem = await GalleryItem.findByIdAndUpdate(
      req.params.id, 
      updates, 
      { new: true }
    );
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  try {
    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
});

// Add other CRUD routes following similar pattern

module.exports = router; 