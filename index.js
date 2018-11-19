const express = require('express');
const mongoose = require('mongoose');

const fileRouter = require('./route/file');

const NodeModel = require('./model/node');
const NodeController = require('./controller/node');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/file', fileRouter);
app.listen(port, () => console.log(`express istending on ${port}`));

mongoose.connect('mongodb://localhost/node-test', { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', () => console.error('connection error'));
db.once('open', async () => {
  const nodeController = new NodeController(NodeModel);
  const req = {
    body: {
      name: 'test02',
      type: 'file',
      parent: 'root',
      id: '5be7a5bcc5b4ff4eb7334fa9',
    },
  };
  const res = {};
  res.sendStatus = d => console.log(d);
  res.send = d => console.log(d);
  const next = e => console.error(e);
  await nodeController.getTree(req, res, next);
  console.log('connected to mongodb');
});
