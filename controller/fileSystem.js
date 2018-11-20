class FileSystemController {
  constructor(model) {
    this.queue = [];
    this.root = null;
    this.model = model;
    this.dequeue = this.dequeue.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.createRootNode = this.createRootNode.bind(this);
    this.getTree = this.getTree.bind(this);
    this.insertNode = this.insertNode.bind(this);
    this.deleteNode = this.deleteNode.bind(this);
    this.renameNode = this.renameNode.bind(this);
    this.traverse = this.traverse.bind(this);
  }

  dequeue() {
    return this.queue.shift();
  }

  enqueue(item) {
    this.queue.push(item);
  }

  async createRootNode() {
    const existingRoot = await this.model.findOne({ name: 'root', parent: null });
    if (!existingRoot) {
      const createdNode = await this.model.create({
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
        id: null,
      });
      return createdNode.toObject();
    }
    return existingRoot.toObject();
  }

  async getTree(req, res, next) {
    try {
      if (!this.root) {
        this.root = await this.createRootNode();
      }
      // TODO send JSON
      return res.send(await this.model.findOne({ name: 'root', parent: null }));
    } catch (error) {
      return next(error);
    }
  }

  async insertNode(req, res, next) {
    let current;
    try {
      const { body } = req;
      if (!body.parent) {
        throw new Error('Cannot have orphan nodes');
      }
      if (!this.root) {
        this.root = await this.createRootNode();
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

  async deleteNode(req, res, next) {
    try {
      const { body } = req;
      if (!this.root) {
        this.root = await this.createRootNode();
      }
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

  async renameNode(req, res, next) {
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
