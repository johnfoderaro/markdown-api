class FileController {
  constructor(model) {
    this.model = model;
    this.addFile = this.addFile.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.getFile = this.getFile.bind(this);
    this.renameFile = this.renameFile.bind(this);
  }

  async addFile(req, res, next) {
    try {
      const { body: { name, data } } = req;
      await this.model.create({ name, data });
      return res.sendStatus(200);
    } catch (error) {
      return next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { body: { id } } = req;
      const { n } = await this.model.deleteOne({ _id: id });
      return n ? res.sendStatus(200) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const { params: { id } } = req;
      const file = await this.model.findById(id);
      return file ? res.send(file) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }

  async renameFile(req, res, next) {
    try {
      const { body: { id, name, data } } = req;
      const { nModified } = await this.model.updateOne({ _id: id }, { name, data });
      return nModified ? res.sendStatus(200) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = FileController;
