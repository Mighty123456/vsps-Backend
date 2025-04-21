const mongoose = require('mongoose');

// Hero Slide Schema
const heroSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const highlightSchema = new mongoose.Schema({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  }
});

const downloadSchema = new mongoose.Schema({
  label: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  }
});

const featureSchema = new mongoose.Schema({
  icon: {
    type: String,
    default: 'fa-check'
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const teamMemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
});

// Main Home Content Schema
const homeContentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  heroSlider: {
    type: [heroSlideSchema],
    default: []
  },
  introduction: {
    heading: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    highlights: {
      type: [highlightSchema],
      default: []
    },
    download: {
      type: downloadSchema,
      default: {}
    }
  },
  about: {
    heading: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    features: {
      type: [featureSchema],
      default: []
    }
  },
  leadership: {
    heading: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    note: {
      type: String,
      default: ''
    },
    members: {
      type: [teamMemberSchema],
      default: []
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomeContent', homeContentSchema); 