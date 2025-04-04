const mongoose = require('mongoose');

const homeContentSchema = new mongoose.Schema({
  // Hero Slider
  slides: [{
    image: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  }],

  // Introduction Stats
  stats: [{
    icon: { type: String, required: true },
    count: { type: String, required: true },
    label: { type: String, required: true }
  }],

  // About Section
  about: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    features: [{
      title: { type: String, required: true },
      description: { type: String, required: true }
    }]
  },

  // Leadership Section
  leadership: [{
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
  }],

  // Downloadable File
  downloadableFile: {
    title: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now }
  },

  // SEO Metadata
  seo: {
    title: { type: String },
    description: { type: String },
    keywords: { type: String }
  }
}, {
  timestamps: true
});

// Method to update hero slides
homeContentSchema.methods.updateSlides = async function(slides) {
  this.slides = slides;
  return this.save();
};

// Method to update about section
homeContentSchema.methods.updateAboutSection = async function(aboutData) {
  this.about = aboutData;
  return this.save();
};

module.exports = mongoose.model('HomeContent', homeContentSchema);