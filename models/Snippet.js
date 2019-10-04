const mongoose = require("mongoose");

const SnippetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  files: {
    type: Array,
    required: true
  },
  settings: {
    type: Object,
    required: true
  }
});

module.exports = mongoose.model("Snippet", SnippetSchema);

