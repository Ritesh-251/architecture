const mongoose = require('mongoose');

// Mirrors the serialized format from exportSerialized() in model.js:
// { floorplan: { version, corners, walls, rooms, wallTextures, floorTextures, ... }, items: [...] }

const designSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled Design',
    },
    thumbnail: {
      type: String, // base64 or URL
      default: null,
    },
    floorplan: {
      type: mongoose.Schema.Types.Mixed, // corners, walls, rooms, textures
      default: {},
    },
    items: {
      type: [mongoose.Schema.Types.Mixed], // placed furniture/fixtures
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Design', designSchema);
