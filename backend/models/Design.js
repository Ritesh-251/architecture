const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, default: 'Untitled Design' },
    thumbnail: { type: String, default: null },
    floorplan: { type: mongoose.Schema.Types.Mixed, default: {} },
    items:     { type: [mongoose.Schema.Types.Mixed], default: [] },
    floorCount: { type: Number, default: 1 },
    isPublic:   { type: Boolean, default: false },
    shareToken: { type: String, default: null, index: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Design', designSchema);

