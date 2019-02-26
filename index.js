const express = require('express');
const mongoose = require('mongoose');

const config = require('./config.json');
const fileRouter = require('./route/file');
const fileSystem = require('./route/fileSystem');

const { port } = config.express;
const { collection, host } = config.mongo;

const app = express();

app.use(express.json());
app.use('/file', fileRouter);
app.use('/filesystem', fileSystem);
app.listen(port, () => console.log(`express is listening on ${port}`));

mongoose.connect(`mongodb://${host}/${collection}`, { useNewUrlParser: true });
const db = mongoose.connection;

db.on('error', () => console.error('connection error'));
db.once('open', () => console.log('connected to mongodb'));
