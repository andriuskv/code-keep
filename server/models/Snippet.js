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
  },
  user: Object
});

SnippetSchema.methods.getSnippet = function() {
  return {
    id: this.id,
    created: this.created,
    title: this.title,
    description: this.description,
    type: this.type,
    userId: this.userId,
    settings: this.settings,
    files: this.files,
    fork: this.fork
  };
};

SnippetSchema.set("toJSON", {
  transform: (doc, snippet) => {
    delete snippet._id;
    delete snippet.__v;
  }
});

module.exports = mongoose.model("Snippet", SnippetSchema);

