const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/node-test', { useNewUrlParser: true });

const db = mongoose.connection;
const { ObjectId } = mongoose.Schema.Types;

db.on('error', () => console.error('connection error'));
db.once('open', () => console.log('connected'));

const nodeSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
  },
  type: {
    type: String,
    lowercase: true,
  },
  parent: {
    type: String,
    lowercase: true,
  },
  chidren: {
    type: [Object],
    lowercase: true,
  },
  id: {
    type: ObjectId,
  },
});

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    lowercase: true,
  },
  data: {
    type: String,
  },
});


const Node = mongoose.model('Node', nodeSchema);
const File = mongoose.model('File', fileSchema);

// const root = new Node({
//   name: 'root',
//   type: 'directory',
//   parent: null,
//   children: [],
// });

// Node.deleteMany({ name: 'root' }, (err, res) => {
//   if (err) return console.error(err);
//   console.log(res);
// })

// root.save((err, data) => {
//   if (err) return console.error(err);
//   console.log(data)
// });

// Node.find((err, nodes) => {
//   if (err) return console.error(err);
//   return console.log(nodes[0]);
// });


Node.findById('5bdf5b884fd6dc619a5f7aa0', (err, treeRoot) => {
  if (err) return console.error(err);
  return console.log(treeRoot);
});
