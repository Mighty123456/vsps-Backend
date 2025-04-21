const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['photo', 'video'],
    required: true
  },
  url: String,
  thumbnail: String,
  category: {
    type: String,
    enum: ['weddings', 'corporate', 'birthdays', 'social', 'graduation', 'private'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to toggle featured status
galleryItemSchema.methods.toggleFeatured = async function() {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

module.exports = mongoose.model('GalleryItem', galleryItemSchema);