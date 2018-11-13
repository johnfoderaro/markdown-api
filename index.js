const express = require('express');
const mongoose = require('mongoose');

const fileRouter = require('./route/file');

const app = express();
const port = 3000;

app.use(express.json());
app.use('/file', fileRouter);
app.listen(port, () => console.log(`express istending on ${port}`));

mongoose.connect('mongodb://localhost/node-test', { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', () => console.error('connection error'));
db.once('open', () => console.log('connected to mongodb'));
