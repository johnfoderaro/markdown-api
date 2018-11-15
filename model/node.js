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
    // required: [true, '`parent` is required'],
  },
  children: {
    type: [Object],
    default: undefined,
    lowercase: true,
    required: [true, '`children` is required'],
  },
  id: {
    type: ObjectId,
  },
});

const Node = mongoose.model('Node', nodeSchema);

module.exports = Node;
