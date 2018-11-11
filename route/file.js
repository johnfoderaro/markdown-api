const express = require('express');
const fileController = require('../controller/file');

const router = express.Router();

const { addFile, deleteFile, renameFile } = fileController;

router.post('/add', addFile);
router.post('/delete', deleteFile);
router.post('/rename', renameFile);

module.exports = router;
