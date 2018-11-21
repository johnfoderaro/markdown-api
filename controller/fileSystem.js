class FileSystemController {
  constructor(model) {
    this.queue = [];
    this.model = model;
    this.root = this.init();
    this.dequeue = this.dequeue.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.init = this.init.bind(this);
    this.get = this.get.bind(this);
    this.insert = this.insert.bind(this);
    this.remove = this.remove.bind(this);
    this.rename = this.rename.bind(this);
    this.traverse = this.traverse.bind(this);
  }

  dequeue() {
    return this.queue.shift();
  }

  enqueue(item) {
    this.queue.push(item);
  }

  async init() {
    this.root = await this.model.create({
      name: 'root',
      type: 'directory',
      parent: null,
      children: [],
      id: null,
    });
  }

  async get(req, res, next) {
    try {
      return res.send(await this.model.findOne({ name: 'root', parent: null }));
    } catch (error) {
      return next(error);
    }
  }

  async insert(req, res, next) {
    let current;
    try {
      const { body } = req;
      if (!body.parent) {
        throw new Error('Cannot have orphan nodes');
      }
      current = this.traverse(body.parent);
      const { _id, children } = current;
      const duplicateChild = children.find(child => child.name === body.name);
      if (duplicateChild) {
        throw new Error('Cannot add duplicate children');
      }
      if (current.type === 'file') {
        throw new Error('Cannot add child to node type of `file`');
      }
      const { nModified } = await this.model.updateOne({ _id }, {
        name: current.name,
        parent: current.parent,
        type: current.type,
        id: current.id,
        children: [{
          name: body.name,
          type: body.type,
          parent: body.parent,
          id: body.id,
        }, ...children],
      });
      return nModified ? res.sendStatus(200) : res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { body } = req;
      if (body.name === 'root') {
        throw new Error('Cannot delete root node');
      }
      const current = this.traverse(body.parent);
      const { children, _id, id } = current;
      const index = children.map(child => child.name).indexOf(body.name);
      if (index < 0) {
        throw new Error('Cannot find node to delete');
      }
      children.splice(index, 1);
      const { nModified } = await this.model.updateOne({ _id: current.name === 'root' ? _id : id }, { children });
      return nModified ? res.sendStatus(200) : res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }

  async rename(req, res, next) {
    try {
      const { body } = req;
      if (body.name === 'root') {
        throw new Error('Cannot rename root node');
      }
      const current = this.traverse(body.parent);
      const { children, _id, id } = current;
      const index = children.map(child => child.name).indexOf(body.name);
      if (index < 0) {
        throw new Error('Cannot find node to rename');
      }
      children[index] = body.update;
      const { nModified } = await this.model.updateOne({
        _id: current.name === 'root' ? _id : id,
      }, {
        children: [...children],
      });
      return nModified ? res.sendStatus(200) : res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }

  traverse(destination) {
    let current;
    this.enqueue(this.root);
    current = this.dequeue();
    while (current) {
      for (let n = 0; n < current.children.length; n += 1) {
        this.enqueue(current.children[n]);
      }
      if (current.name === destination) {
        break;
      }
      current = this.dequeue();
    }
    return current;
  }
}

module.exports = FileSystemController;
