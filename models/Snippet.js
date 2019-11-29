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
  type: {
    type: String
  },
  files: {
    type: Array,
    required: true
  },
  settings: {
    type: Object,
    required: true
  },
  fork: {
    type: Object
  }
});

module.exports = mongoose.model("Snippet", SnippetSchema);

