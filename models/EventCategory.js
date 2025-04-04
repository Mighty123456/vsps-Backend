const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  includes: [{ type: String, required: true }],
  isPopular: { type: Boolean, default: false }
});

const eventCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  capacity: { type: String, required: true },
  image: { type: String, required: true },
  membershipPricing: {
    samajMember: { type: String, required: true },
    nonSamajMember: { type: String, required: true }
  },
  features: [{ type: String, required: true }],
  packages: [packageSchema],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Method to toggle category status
eventCategorySchema.methods.toggleStatus = async function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Method to update packages
eventCategorySchema.methods.updatePackages = async function(packages) {
  this.packages = packages;
  return this.save();
};

module.exports = mongoose.model('EventCategory', eventCategorySchema);