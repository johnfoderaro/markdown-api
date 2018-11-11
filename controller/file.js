const FileModel = require('../model/file');

// TODO santize data
async function addFile(req, res, next) {
  try {
    const { body: { name, data } } = req;
    const id = await FileModel.create({ name, data });
    return res.send(id);
  } catch (error) {
    return next(error);
  }
}

async function deleteFile(req, res, next) {
  try {
    const { body: { id } } = req;
    const action = await FileModel.deleteOne({ _id: id });
    return res.send(action);
  } catch (error) {
    return next(error);
  }
}

async function getFile(req, res, next) {
  
}

async function renameFile(req, res, next) {
  try {
    const { body: { id, name, data } } = req;
    const action = await FileModel.updateOne({ _id: id }, { name, data });
    return res.send(action);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addFile,
  deleteFile,
  renameFile,
};
