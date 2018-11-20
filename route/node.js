const express = require('express');

const NodeController = require('../controller/node');
const NodeModel = require('../model/node');

const router = express.Router();

const {
  insertNode,
  deleteNode,
  getTree,
  renameNode,
} = new NodeController(NodeModel);

router.get('/get', getTree);
router.post('/add', insertNode);
router.delete('/delete', deleteNode);
router.put('/rename', renameNode);

module.exports = router;
