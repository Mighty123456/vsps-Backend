const HomeContent = require('../models/HomeContent');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Helper function to handle errors
const handleError = (res, error, message = 'An error occurred') => {
  console.error(error);
  res.status(500).json({ success: false, message });
};

// Get home content
exports.getHomeContent = async (req, res) => {
  try {
    console.log('Fetching home content...');
    let homeContent = await HomeContent.findOne();
    
    if (!homeContent) {
      console.log('No home content found, creating default...');
      homeContent = new HomeContent({
        title: '',
        description: '',
        heroSlider: [],
        introduction: {
          heading: '',
          description: '',
          highlights: [],
          download: {
            label: '',
            url: '',
            fileName: ''
          }
        },
        about: {
          heading: '',
          description: '',
          image: '',
          features: []
        },
        leadership: {
          heading: '',
          description: '',
          members: [],
          note: ''
        }
      });
      
      try {
        await homeContent.save();
        console.log('Default home content created successfully');
      } catch (saveError) {
        console.error('Error saving default home content:', saveError);
        return res.status(500).json({
          success: false,
          message: 'Error creating default home content',
          error: saveError.message
        });
      }
    }

    console.log('Home content fetched successfully:', homeContent);
    res.status(200).json({ 
      success: true, 
      data: homeContent,
      message: 'Home content fetched successfully'
    });
  } catch (error) {
    console.error('Error in getHomeContent:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching home content',
      error: error.message 
    });
  }
};

// Update home content
exports.updateHomeContent = async (req, res) => {
  try {
    console.log('Updating home content...');
    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      homeContent = new HomeContent();
    }

    // Handle image upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file, 'website-content/home');
        homeContent.image = result.secure_url;
        console.log('Image uploaded to Cloudinary:', result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading image to Cloudinary',
          error: uploadError.message
        });
      }
    }

    homeContent.title = req.body.title || homeContent.title;
    homeContent.description = req.body.description || homeContent.description;
    homeContent.about.title = req.body.aboutTitle || homeContent.about.title;
    homeContent.about.description = req.body.aboutDescription || homeContent.about.description;
    
    if (req.body.features) {
      try {
        homeContent.about.features = JSON.parse(req.body.features);
      } catch (error) {
        console.error('Error parsing features:', error);
        return res.status(400).json({ success: false, message: 'Invalid features format' });
      }
    }
    
    homeContent.stats = req.body.stats || homeContent.stats;

    await homeContent.save();
    console.log('Home content updated successfully');
    res.json({ success: true, data: homeContent });
  } catch (error) {
    console.error('Error updating home content:', error);
    res.status(500).json({ success: false, message: 'Error updating home content' });
  }
};

// Handle hero slides
exports.handleHeroSlide = async (req, res) => {
  try {
    console.log('Handling hero slide...', {
      method: req.method,
      slideId: req.params.id,
      body: req.body,
      file: req.file
    });

    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      console.log('No home content found, creating new...');
      homeContent = new HomeContent();
    }

    // Initialize heroSlider if it doesn't exist
    if (!homeContent.heroSlider) {
      console.log('Initializing heroSlider array...');
      homeContent.heroSlider = [];
    }

    console.log('Current heroSlider:', homeContent.heroSlider);

    let imageUrl = null;
    
    // Handle file upload if present
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file, 'website-content/slides');
        imageUrl = result.secure_url;
        console.log('Slide image uploaded to Cloudinary:', imageUrl);
      } catch (uploadError) {
        console.error('Error uploading slide image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error uploading slide image to Cloudinary',
          error: uploadError.message
        });
      }
    }

    if (req.method === 'PUT' && req.params.id) {
      console.log('Updating slide with ID:', req.params.id);
      
      // Find the slide by ID
      const slideIndex = homeContent.heroSlider.findIndex(slide => {
        const slideId = slide._id ? slide._id.toString() : null;
        console.log('Comparing slide ID:', slideId, 'with request ID:', req.params.id);
        return slideId === req.params.id;
      });

      if (slideIndex === -1) {
        console.log('Slide not found with ID:', req.params.id);
        console.log('Available slides:', homeContent.heroSlider.map(slide => ({
          id: slide._id ? slide._id.toString() : null,
          title: slide.title
        })));
        return res.status(404).json({ success: false, message: 'Slide not found' });
      }

      console.log('Found slide at index:', slideIndex);

      // Delete old image from Cloudinary if a new one is being uploaded
      if (imageUrl && homeContent.heroSlider[slideIndex].image) {
        try {
          const publicId = homeContent.heroSlider[slideIndex].image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`website-content/slides/${publicId}`);
          console.log('Old slide image deleted from Cloudinary');
        } catch (error) {
          console.error('Error deleting old slide image:', error);
        }
      }

      // Update slide with new data
      const updatedSlide = {
        _id: homeContent.heroSlider[slideIndex]._id, // Preserve the existing _id
        title: req.body.title || homeContent.heroSlider[slideIndex].title,
        description: req.body.description || homeContent.heroSlider[slideIndex].description,
        isActive: req.body.isActive === 'true',
        order: req.body.order || homeContent.heroSlider[slideIndex].order,
        image: imageUrl || req.body.image || homeContent.heroSlider[slideIndex].image
      };

      console.log('Updating slide with data:', updatedSlide);
      homeContent.heroSlider[slideIndex] = updatedSlide;
    } else if (req.method === 'POST') {
      // Add new slide
      const newSlide = {
        title: req.body.title,
        description: req.body.description,
        isActive: req.body.isActive === 'true',
        order: req.body.order || 0,
        image: imageUrl || req.body.image
      };

      console.log('Adding new slide:', newSlide);
      homeContent.heroSlider.push(newSlide);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request method' });
    }

    // Save the updated content
    await homeContent.save();
    console.log('Hero slide handled successfully:', {
      method: req.method,
      slideId: req.params.id,
      imageUrl: imageUrl || req.body.image
    });

    res.json({ 
      success: true, 
      data: homeContent.heroSlider,
      message: req.method === 'PUT' ? 'Slide updated successfully' : 'Slide added successfully'
    });
  } catch (error) {
    console.error('Error handling hero slide:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error handling hero slide',
      error: error.message 
    });
  }
};

// Delete hero slide
exports.deleteHeroSlide = async (req, res) => {
  try {
    console.log('Deleting hero slide...', req.params.id);
    const homeContent = await HomeContent.findOne();
    if (!homeContent) {
      return res.status(404).json({ success: false, message: 'Home content not found' });
    }

    const slideIndex = homeContent.heroSlider.findIndex(slide => slide._id.toString() === req.params.id);
    if (slideIndex === -1) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    // Delete image from Cloudinary if it exists
    if (homeContent.heroSlider[slideIndex].image) {
      try {
        const publicId = homeContent.heroSlider[slideIndex].image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`website-content/slides/${publicId}`);
        console.log('Slide image deleted from Cloudinary');
      } catch (error) {
        console.error('Error deleting slide image:', error);
        // Continue with deletion even if image deletion fails
      }
    }

    // Remove the slide
    homeContent.heroSlider.splice(slideIndex, 1);
    await homeContent.save();
    console.log('Hero slide deleted successfully');
    res.json({ 
      success: true, 
      data: homeContent.heroSlider,
      message: 'Slide deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hero slide:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting hero slide',
      error: error.message 
    });
  }
};

// Update about section
exports.updateAbout = async (req, res) => {
  try {
    console.log('Updating about section...', req.body);
    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      homeContent = new HomeContent();
    }

    // Update about section
    if (!homeContent.about) {
      homeContent.about = {};
    }

    // Update fields if they exist in request
    if (req.body.title) homeContent.about.title = req.body.title;
    if (req.body.description) homeContent.about.description = req.body.description;
    
    // Handle image upload
    if (req.file) {
      try {
        // Delete old image from Cloudinary if it exists
        if (homeContent.about.image) {
          const publicId = homeContent.about.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`website-content/about/${publicId}`);
        }

        // Upload new image
        const result = await uploadToCloudinary(req.file, 'website-content/about');
        homeContent.about.image = result.secure_url;
        console.log('About image updated in Cloudinary:', result.secure_url);
      } catch (uploadError) {
        console.error('Error updating about image in Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Error updating about image in Cloudinary',
          error: uploadError.message
        });
      }
    }

    // Handle features
    if (req.body.features) {
      try {
        const features = JSON.parse(req.body.features);
        homeContent.about.features = features;
      } catch (error) {
        console.error('Error parsing features:', error);
        return res.status(400).json({ success: false, message: 'Invalid features format' });
      }
    }

    await homeContent.save();
    console.log('About section updated successfully');
    res.json({ success: true, data: homeContent });
  } catch (error) {
    console.error('Error updating about section:', error);
    res.status(500).json({ success: false, message: 'Error updating about section' });
  }
};

// Update introduction section
exports.updateIntroduction = async (req, res) => {
  try {
    console.log('Updating introduction section...', req.body);
    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      homeContent = new HomeContent();
    }

    // Update introduction section
    if (!homeContent.introduction) {
      homeContent.introduction = {};
    }

    // Update fields if they exist in request
    if (req.body.heading) homeContent.introduction.heading = req.body.heading;
    if (req.body.description) homeContent.introduction.description = req.body.description;
    
    // Handle highlights
    if (req.body.highlights) {
      try {
        homeContent.introduction.highlights = JSON.parse(req.body.highlights);
      } catch (error) {
        console.error('Error parsing highlights:', error);
        return res.status(400).json({ success: false, message: 'Invalid highlights format' });
      }
    }

    // Handle download section
    if (req.body.download) {
      try {
        const downloadData = JSON.parse(req.body.download);
        console.log('Download data received:', downloadData);
        
        // Validate download data
        if (!downloadData.url) {
          console.error('No URL in download data');
          return res.status(400).json({ success: false, message: 'Download URL is required' });
        }

        // Update download section
        homeContent.introduction.download = {
          label: downloadData.label || '',
          fileName: downloadData.fileName || '',
          url: downloadData.url
        };
        
        console.log('Download section updated:', homeContent.introduction.download);
      } catch (error) {
        console.error('Error parsing download data:', error);
        return res.status(400).json({ success: false, message: 'Invalid download data format' });
      }
    }

    // Save the updated content
    await homeContent.save();
    console.log('Introduction section updated successfully');
    
    // Return the updated content
    res.json({ 
      success: true, 
      data: homeContent,
      message: 'Introduction section updated successfully'
    });
  } catch (error) {
    console.error('Error updating introduction section:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating introduction section',
      error: error.message 
    });
  }
};

// Update leadership section
exports.updateLeadership = async (req, res) => {
  try {
    console.log('Updating leadership section...', req.body);
    let homeContent = await HomeContent.findOne();
    if (!homeContent) {
      homeContent = new HomeContent();
    }

    // Initialize leadership if it doesn't exist
    if (!homeContent.leadership) {
      homeContent.leadership = {
        heading: '',
        description: '',
        members: [],
        note: ''
      };
    }

    // Update leadership section fields
    homeContent.leadership.heading = req.body.heading || homeContent.leadership.heading;
    homeContent.leadership.description = req.body.description || homeContent.leadership.description;
    homeContent.leadership.note = req.body.note || homeContent.leadership.note;

    // Parse members if it's a string
    let parsedMembers = req.body.members;
    if (typeof parsedMembers === 'string') {
      try {
        parsedMembers = JSON.parse(parsedMembers);
      } catch (e) {
        console.error('Error parsing members:', e);
        parsedMembers = [];
      }
    }

    // Create a map of existing members by their _id
    const existingMembersMap = new Map(
      homeContent.leadership.members.map(member => [member._id.toString(), member])
    );

    // Process each member from the request
    const updatedMembers = await Promise.all(parsedMembers.map(async (member, index) => {
      let updatedMember;
      
      // If member has an _id, find the existing member
      if (member._id) {
        const existingMember = existingMembersMap.get(member._id);
        if (existingMember) {
          updatedMember = existingMember;
          // Remove from map to track which members are being updated
          existingMembersMap.delete(member._id);
        }
      }

      // If no existing member found, create a new one
      if (!updatedMember) {
        updatedMember = {
          name: member.name,
          position: member.position,
          description: member.description,
          image: null
        };
      }

      // Handle image update
      const memberImage = req.files.find(file => file.fieldname === `memberImage${index}`);
      if (memberImage) {
        try {
          // Delete old image from Cloudinary if it exists
          if (updatedMember.image) {
            const publicId = updatedMember.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`website-content/leadership/members/${publicId}`);
            console.log('Old member image deleted from Cloudinary');
          }

          // Upload new image
          const result = await uploadToCloudinary(memberImage, 'website-content/leadership/members');
          updatedMember.image = result.secure_url;
          console.log('New member image uploaded to Cloudinary:', result.secure_url);
        } catch (uploadError) {
          console.error('Error updating member image in Cloudinary:', uploadError);
        }
      }

      // Update other fields
      updatedMember.name = member.name || updatedMember.name;
      updatedMember.position = member.position || updatedMember.position;
      updatedMember.description = member.description || updatedMember.description;

      return updatedMember;
    }));

    // Replace the members array with the updated members
    homeContent.leadership.members = updatedMembers;

    await homeContent.save();
    console.log('Leadership section updated successfully');
    res.json({ 
      success: true, 
      data: homeContent.leadership,
      message: 'Leadership section updated successfully'
    });

  } catch (error) {
    console.error('Error updating leadership section:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating leadership section',
      error: error.message 
    });
  }
};

// Delete leadership member
exports.deleteLeadershipMember = async (req, res) => {
  try {
    console.log('Deleting leadership member...', req.params.id);
    let homeContent = await HomeContent.findOne();
    
    if (!homeContent || !homeContent.leadership) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leadership section not found' 
      });
    }

    // Find the member to delete
    const memberIndex = homeContent.leadership.members.findIndex(
      member => member._id.toString() === req.params.id
    );

    if (memberIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Leadership member not found' 
      });
    }

    // Get the member to delete
    const memberToDelete = homeContent.leadership.members[memberIndex];

    // Delete the member's image from Cloudinary if it exists
    if (memberToDelete.image) {
      try {
        const publicId = memberToDelete.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`website-content/leadership/members/${publicId}`);
        console.log('Member image deleted from Cloudinary');
      } catch (error) {
        console.error('Error deleting member image from Cloudinary:', error);
      }
    }

    // Remove the member from the array
    homeContent.leadership.members.splice(memberIndex, 1);

    // Save the updated content
    await homeContent.save();
    console.log('Leadership member deleted successfully');
    
    res.json({ 
      success: true, 
      message: 'Leadership member deleted successfully',
      data: homeContent.leadership 
    });

  } catch (error) {
    console.error('Error deleting leadership member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting leadership member',
      error: error.message 
    });
  }
};

module.exports = exports; 