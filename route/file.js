const express = require('express');

const FileController = require('../controller/file');
const FileModel = require('../model/file');

const router = express.Router();

const {
  get,
  insert,
  remove,
  update,
} = new FileController(FileModel);

router.get('/get/:id', get);
router.post('/insert', insert);
router.delete('/remove', remove);
router.put('/update', update);

module.exports = router;
