const express = require('express');

const FileSystemController = require('../controller/fileSystem');
const FileSystemModel = require('../model/fileSystem');

const router = express.Router();

const {
  get,
  insert,
  move,
  remove,
  rename,
} = new FileSystemController(FileSystemModel);

router.get('/get', get);
router.post('/insert', insert);
router.put('/move', move);
router.delete('/remove', remove);
router.put('/rename', rename);

module.exports = router;
