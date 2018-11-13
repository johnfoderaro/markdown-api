const express = require('express');
const fileController = require('../controller/file');

const router = express.Router();

const {
  addFile,
  deleteFile,
  getFile,
  renameFile,
} = fileController;

router.get('/get/:id', getFile);
router.post('/add', addFile);
router.delete('/delete', deleteFile);
router.put('/rename', renameFile);

module.exports = router;
