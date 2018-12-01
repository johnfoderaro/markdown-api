class FileController {
  constructor(model) {
    this.model = model;
    this.get = this.get.bind(this);
    this.insert = this.insert.bind(this);
    this.remove = this.remove.bind(this);
    this.rename = this.rename.bind(this);
    this.update = this.update.bind(this);
  }

  async get(req, res, next) {
    try {
      const { params } = req;
      const hasId = params.id;
      if (!hasId) {
        throw new Error('Request must include `id` parameter');
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
        throw new Error('Request must include `name` and `data`');
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
      const { body } = req;
      const isValid = body.id;
      if (!isValid) {
        throw new Error('Request must include `id`');
      }
      const { _id } = body;
      const { n } = await this.model.deleteOne({ _id });
      return n ? res.sendStatus(200) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }

  async rename(req, res, next) {
    try {
      const { body } = req;
      const hasId = body.id;
      const hasUpdate = body.update;
      const isValid = hasId && hasUpdate;

      if (!isValid) {
        throw new Error('Request must include `id` and `update`');
      }
      const { id, update: { name } } = body;
      const { nModified } = await this.model.updateOne({ _id: id }, { name });
      return nModified ? res.sendStatus(200) : res.sendStatus(404);
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
        throw new Error('Request must include `id` and `update`');
      }
      const { id, update: { data } } = body;
      const { nModified } = await this.model.updateOne({ _id: id }, { data });
      return nModified ? res.sendStatus(200) : res.sendStatus(404);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = FileController;
