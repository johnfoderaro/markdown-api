const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const nodeSchema = new mongoose.Schema({
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
    required: [true, '`parent` is required'],
  },
  chidren: {
    type: [Object],
    lowercase: true,
    required: [true, '`children` is required'],
  },
  id: {
    type: ObjectId,
    required: [true, '`id` is required'],
  },
});

const Node = mongoose.model('Node', nodeSchema);

module.exports = Node;
