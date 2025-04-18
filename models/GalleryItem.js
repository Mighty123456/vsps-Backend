const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['photo', 'video'],
    required: true
  },
  url: String,
  thumbnail: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['weddings', 'corporate', 'birthdays', 'social', 'graduation', 'private'],
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to increment likes
galleryItemSchema.methods.incrementLikes = async function() {
  this.likes += 1;
  return this.save();
};

// Method to toggle featured status
galleryItemSchema.methods.toggleFeatured = async function() {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

module.exports = mongoose.model('GalleryItem', galleryItemSchema);