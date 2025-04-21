const HomeContent = require('../models/HomeContent');
const fs = require('fs');
const GalleryItem = require('../models/GalleryItem');
const { uploadToCloudinary } = require('../config/cloudinary');
const cloudinary = require('cloudinary');

// Helper function to format image path
const formatImagePath = (filename) => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Get content (assumes single document)
exports.getHomeContent = async (req, res) => {
  try {
    let content = await HomeContent.findOne();
    
    // If no content exists, create initial content
    if (!content) {
      content = new HomeContent({
        heroSlider: [
          {
            image: '/public/assets/13.jpg',
            title: 'Elegant Party Venues',
            description: 'Perfect settings for your special occasions',
            isActive: true
          },
          {
            image: '/public/assets/4.jpg',
            title: 'Wedding Celebrations',
            description: 'Create unforgettable moments',
            isActive: true
          },
          {
            image: '/public/assets/15.jpg',
            title: 'Corporate Events',
            description: 'Professional spaces for business gatherings',
            isActive: true
          }
        ],
        introduction: {
          heading: 'Welcome to VSPS',
          description: 'Experience luxury and elegance at its finest in our state-of-the-art party plot. Located in the heart of the city, we offer the perfect venue for all your special occasions, from weddings and corporate events to birthday celebrations and social gatherings.',
          highlights: [
            {
              icon: 'FaCalendar',
              title: '500+ Events',
              subtitle: 'Successfully Hosted'
            },
            {
              icon: 'FaUsers',
              title: '1000+ Capacity',
              subtitle: 'Spacious Venue'
            },
            {
              icon: 'FaGem',
              title: 'Premium Services',
              subtitle: 'World-class Amenities'
            },
            {
              icon: 'FaClock',
              title: '24/7 Support',
              subtitle: 'Always Available'
            }
          ],
          download: {
            label: 'Download Instructions (PDF)',
            url: '/path/to/your/file.pdf',
            fileName: 'Vadi_PartyPlot_Instructions.pdf'
          }
        },
        about: {
          heading: 'About VSPS',
          description: 'For over a decade, Royal Party Plot has been the premier destination for memorable celebrations in our city. Our journey began with a simple vision: to create a space where moments turn into cherished memories.',
          image: '/public/assets/20.jpg',
          features: [
            {
              title: 'Luxurious Amenities',
              description: 'State-of-the-art facilities including modern kitchen, spacious parking, and premium decor.'
            },
            {
              title: 'Professional Team',
              description: 'Dedicated event coordinators and staff to ensure your event runs smoothly.'
            },
            {
              title: 'Customizable Packages',
              description: 'Flexible event packages to suit your specific needs and budget.'
            }
          ]
        },
        leadership: {
          heading: 'Our Leadership',
          description: 'Meet the visionary behind VSPS Party Plot who has transformed the event hosting experience.',
          members: [
            {
              name: 'Wadi Pramukh',
              title: 'Founder & Visionary',
              image: '/public/assets/21.jpg'
            },
            {
              name: 'Wadi Pramukh',
              title: 'At VSPS Event',
              image: '/public/assets/22.jpg'
            }
          ],
          note: 'Under the guidance of Wadi Pramukh, VSPS has become synonymous with excellence in event hosting. His dedication to quality and customer satisfaction has shaped our venue into what it is today.'
        }
      });

      try {
        await content.save();
        console.log('Initial home content created successfully');
      } catch (saveError) {
        console.error('Error saving initial content:', saveError);
        // Even if save fails, return the content object
        return res.json({
          success: true,
          message: 'No content found, using default structure',
          data: content
        });
      }
    }

    res.json({
      success: true,
      message: 'Content fetched successfully',
      data: content
    });
  } catch (error) {
    console.error('Error in getHomeContent:', error);
    // Return a default structure even if there's an error
    res.json({
      success: true,
      message: 'Using default structure due to error',
      data: {
        heroSlider: [],
        introduction: {
          heading: 'Welcome to VSPS',
          description: 'Experience luxury and elegance at its finest in our state-of-the-art party plot.',
          highlights: [],
          download: {
            label: 'Download Instructions (PDF)',
            url: '/path/to/your/file.pdf',
            fileName: 'Vadi_PartyPlot_Instructions.pdf'
          }
        },
        about: {
          heading: 'About VSPS',
          description: 'For over a decade, Royal Party Plot has been the premier destination for memorable celebrations in our city.',
          image: '/uploads/default.jpg',
          features: []
        },
        leadership: {
          heading: 'Our Leadership',
          description: 'Meet the visionary behind VSPS Party Plot who has transformed the event hosting experience.',
          members: [],
          note: 'Under the guidance of Wadi Pramukh, VSPS has become synonymous with excellence in event hosting.'
        }
      }
    });
  }
};

exports.createOrUpdateHomeContent = async (req, res) => {
  try {
    let content = await HomeContent.findOne();
    if (!content) content = new HomeContent(req.body);
    else Object.assign(content, req.body);
    await content.save();
    res.json({
      success: true,
      message: 'Home content updated successfully',
      homeContent: content
    });
  } catch (error) {
    console.error('Error updating home content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating home content',
      error: error.message
    });
  }
};

// Slide: Add
exports.addSlide = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    let content = await HomeContent.findOne();
    if (!content) {
      content = new HomeContent({
        slides: [],
        stats: [],
        about: {
          title: 'Welcome',
          description: 'Default description',
          image: '/uploads/default.jpg',
          features: []
        }
      });
    }

    const slide = {
      title: req.body.title,
      description: req.body.description,
      image: formatImagePath(req.file.filename),
      isActive: req.body.isActive === 'true',
      order: content.slides.length
    };

    content.slides.push(slide);
    await content.save();

    res.json({
      success: true,
      message: 'Slide added successfully',
      data: content
    });
  } catch (error) {
    console.error('Error adding slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding slide',
      error: error.message
    });
  }
};

// Slide: Update
exports.updateSlide = async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      });
    }

    const index = content.slides.findIndex(s => s._id.toString() === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    const updated = {
      ...content.slides[index].toObject(),
      title: req.body.title,
      description: req.body.description,
      isActive: req.body.isActive === 'true'
    };

    if (req.file) {
      updated.image = formatImagePath(req.file.filename);
    }

    content.slides[index] = updated;
    await content.save();

    res.json({
      success: true,
      message: 'Slide updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating slide',
      error: error.message
    });
  }
};

// Slide: Delete
exports.deleteSlide = async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      });
    }

    const slideIndex = content.slides.findIndex(slide => 
      slide._id && slide._id.toString() === req.params.id
    );

    if (slideIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    content.slides.splice(slideIndex, 1);
    await content.save();

    res.json({
      success: true,
      message: 'Slide deleted successfully',
      homeContent: content
    });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting slide',
      error: error.message
    });
  }
};

// About Section
exports.updateAbout = async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      });
    }

    const about = {
      title: req.body.title,
      description: req.body.description,
      image: req.file ? formatImagePath(req.file.filename) : content.about.image,
      features: req.body.features ? JSON.parse(req.body.features) : content.about.features
    };

    content.about = about;
    await content.save();

    res.json({
      success: true,
      message: 'About section updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating about section',
      error: error.message
    });
  }
};

// Leadership Add
exports.addLeader = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    let content = await HomeContent.findOne();
    if (!content) {
      content = new HomeContent({
        slides: [],
        stats: [],
        about: {
          title: 'Welcome',
          description: 'Default description',
          image: '/uploads/default.jpg',
          features: []
        }
      });
    }

    const leader = {
      name: req.body.name,
      role: req.body.role,
      description: req.body.description,
      image: formatImagePath(req.file.filename)
    };

    content.leadership.push(leader);
    await content.save();

    res.json({
      success: true,
      message: 'Leader added successfully',
      data: content
    });
  } catch (error) {
    console.error('Error adding leader:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding leader',
      error: error.message
    });
  }
};

// Leadership Update
exports.updateLeader = async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      });
    }

    const index = content.leadership.findIndex(l => l._id.toString() === req.params.id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Leader not found'
      });
    }

    const updated = {
      ...content.leadership[index].toObject(),
      name: req.body.name,
      role: req.body.role,
      description: req.body.description
    };

    if (req.file) {
      updated.image = formatImagePath(req.file.filename);
    }

    content.leadership[index] = updated;
    await content.save();

    res.json({
      success: true,
      message: 'Leader updated successfully',
      data: content
    });
  } catch (error) {
    console.error('Error updating leader:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leader',
      error: error.message
    });
  }
};

// Leadership Delete
exports.deleteLeader = async (req, res) => {
  try {
    const content = await HomeContent.findOne();
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Home content not found'
      });
    }

    const leaderIndex = content.leadership.findIndex(leader => 
      leader._id && leader._id.toString() === req.params.id
    );

    if (leaderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Leader not found'
      });
    }

    content.leadership.splice(leaderIndex, 1);
    await content.save();

    res.json({
      success: true,
      message: 'Leader deleted successfully',
      data: content
    });
  } catch (error) {
    console.error('Error deleting leader:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leader',
      error: error.message
    });
  }
};

// Get all gallery items
exports.getGalleryItems = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const items = await GalleryItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    res.status(500).json({ error: 'Failed to fetch gallery items' });
  }
};

// Create gallery item
exports.createGalleryItem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'File is required for new gallery items' 
      });
    }

    const { category, type } = req.body;

    if (!category || !type) {
      return res.status(400).json({
        success: false,
        message: 'Category and type are required'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file, 'gallery');
    
    const newItem = new GalleryItem({
      type,
      url: type === 'photo' ? result.secure_url : null,
      thumbnail: type === 'video' ? result.secure_url : null,
      category
    });

    await newItem.save();
    res.json({ 
      success: true, 
      data: newItem,
      message: 'Gallery item created successfully'
    });
  } catch (error) {
    console.error('Error creating gallery item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create gallery item',
      error: error.message 
    });
  }
};

// Update gallery item
exports.updateGalleryItem = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Gallery item ID is required' 
      });
    }

    const existingItem = await GalleryItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gallery item not found' 
      });
    }

    const updates = {
      category: req.body.category || existingItem.category,
      type: req.body.type || existingItem.type
    };

    if (req.file) {
      // Delete old file from Cloudinary if it exists
      if (existingItem.url || existingItem.thumbnail) {
        const oldUrl = existingItem.url || existingItem.thumbnail;
        const publicId = oldUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`gallery/${publicId}`);
      }

      // Upload new file to Cloudinary
      const result = await uploadToCloudinary(req.file, 'gallery');

      if (updates.type === 'photo') {
        updates.url = result.secure_url;
      } else {
        updates.thumbnail = result.secure_url;
      }
    }

    const updatedItem = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      data: updatedItem,
      message: 'Gallery item updated successfully'
    });
  } catch (error) {
    console.error('Error updating gallery item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update gallery item',
      error: error.message 
    });
  }
};

// Delete gallery item
exports.deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Gallery item not found' 
      });
    }

    // Delete from Cloudinary if there's a URL
    if (item.url || item.thumbnail) {
      const url = item.url || item.thumbnail;
      const publicId = url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`gallery/${publicId}`);
    }

    // Delete from database
    await GalleryItem.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete gallery item',
      error: error.message 
    });
  }
}; 