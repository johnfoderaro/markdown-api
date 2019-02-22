class FileController {
  constructor(model) {
    this.model = model;
    this.get = this.get.bind(this);
    this.insert = this.insert.bind(this);
    this.remove = this.remove.bind(this);
    this.update = this.update.bind(this);
  }

  async get(req, res, next) {
    try {
      const { params } = req;
      const hasId = params.id;
      if (!hasId) {
        return res.sendStatus(400);
      }
      const doc = await this.model.findById(params.id);
      return doc ? res.send({ name: doc.name, data: doc.data }) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }

  async insert(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasData = body.data;
      const isValid = hasName && hasData;
      if (!isValid) {
        return res.sendStatus(400);
      }
      const { _id } = await this.model.create({
        name: body.name,
        data: body.data,
      });
      return res.send({ id: _id });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { params } = req;
      const isValid = params.id;
      if (!isValid) {
        return res.sendStatus(400);
      }
      const { id } = params;
      const { n } = await this.model.deleteOne({ _id: id });
      return n ? res.sendStatus(200) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { body } = req;
      const hasId = body.id;
      const hasUpdate = body.update;
      const isValid = hasId && hasUpdate;
      if (!isValid) {
        return res.sendStatus(400);
      }
      const { id, update: { name, data } } = body;
      const { n, nModified } = await this.model.updateOne({ _id: id }, { name, data });
      const success = n === 1 && nModified === 1;
      const notFound = n === 0 && nModified === 0;
      const badRequest = n === 1 && nModified === 0;
      if (success) {
        return res.sendStatus(200);
      }
      if (notFound) {
        return res.sendStatus(404);
      }
      if (badRequest) {
        return res.sendStatus(400);
      }
      return res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = FileController;
