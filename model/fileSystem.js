const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const fileSystemSchema = new mongoose.Schema({
  id: {
    type: ObjectId,
  },
  name: {
    type: String,
    lowercase: true,
    required: [true, '`name` is required'],
  },
  type: {
    type: String,
    lowercase: true,
    required: [true, '`type` is required'],
  },
  parent: {
    type: String,
    lowercase: true,
  },
  children: {
    type: [Object],
    lowercase: true,
    required: [true, '`children` is required'],
  },
}, { collection: 'markdown-api filesystem' });

const FileSystem = mongoose.model('FileSystem', fileSystemSchema);

module.exports = FileSystem;
