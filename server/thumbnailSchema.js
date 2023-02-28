const mongoose = require("mongoose");

const thumbnailSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  viewCount: {
    type: Number,
    required: true
  },
  publishedAfter: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  likeCount: {
    type: Number,
    required: true
  },
  commentCount: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("Thumbnail", thumbnailSchema);
