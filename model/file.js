const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
    required: [true, '`name` is required'],
  },
  data: {
    type: String,
  },
}, { collection: 'markdown-api files' });

const FileModel = mongoose.model('File', fileSchema);

module.exports = FileModel;
