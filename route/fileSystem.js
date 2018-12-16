const express = require('express');

const FileSystemController = require('../controller/fileSystem');
const FileSystemModel = require('../model/fileSystem');

const router = express.Router();

const {
  get,
  insert,
  remove,
  rename,
} = new FileSystemController(FileSystemModel);

router.get('/get', get);
router.post('/insert', insert);
router.delete('/remove/:parent/:name', remove);
router.put('/rename', rename);

module.exports = router;
