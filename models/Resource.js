const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['planning', 'decoration', 'checklists', 'guides'] 
  },
  icon: { type: String, required: true },
  downloadLink: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: String, required: true },
  downloadCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String, required: true },
  readTime: { type: String, required: true },
  category: { type: String },
  views: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Method to increment download count
resourceSchema.methods.incrementDownloadCount = async function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to increment article views
articleSchema.methods.incrementViews = async function() {
  this.views += 1;
  return this.save();
};

module.exports = {
  Resource: mongoose.model('Resource', resourceSchema),
  Article: mongoose.model('Article', articleSchema)
};