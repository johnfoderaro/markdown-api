const express = require('express');

const FileController = require('../controller/file');
const FileModel = require('../model/file');

const router = express.Router();

const {
  addFile,
  deleteFile,
  getFile,
  renameFile,
} = new FileController(FileModel);

router.get('/get/:id', getFile);
router.post('/add', addFile);
router.delete('/delete', deleteFile);
router.put('/rename', renameFile);

module.exports = router;
