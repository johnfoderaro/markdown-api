const express = require('express');

const FileSystemController = require('../controller/fileSystem');
const FileSystemModel = require('../model/fileSystem');

const router = express.Router();

const {
  insertNode,
  deleteNode,
  getTree,
  renameNode,
} = new FileSystemController(FileSystemModel);

router.get('/get', getTree);
router.post('/add', insertNode);
router.delete('/delete', deleteNode);
router.put('/rename', renameNode);

module.exports = router;
