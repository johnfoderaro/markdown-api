class FileSystemController {
  constructor(model) {
    this.queue = [];
    this.model = model;
    this.tree = null;
    this.dequeue = this.dequeue.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.currentTree = this.currentTree.bind(this);
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

  async currentTree() {
    const find = {
      name: 'root',
      parent: null,
    };
    const create = {
      id: null,
      name: 'root',
      type: 'dir',
      parent: null,
      children: [],
    };
    this.tree = await this.model.findOne(find) || await this.model.create(create);
    return true;
  }

  async get(req, res, next) {
    try {
      await this.currentTree();
      const {
        id,
        name,
        type,
        parent,
        children,
      } = this.tree;
      return res.send({
        id,
        name,
        type,
        parent,
        children,
      });
    } catch (error) {
      return next(error);
    }
  }

  async insert(req, res, next) {
    try {
      const { body } = req;
      const hasId = body.id || body.id === null;
      const hasName = body.name;
      const hasType = body.type;
      const hasParent = body.parent;
      const hasChildren = body.children;
      const isValid = hasName && hasType && hasParent && hasId && hasChildren;

      if (!this.tree) {
        await this.currentTree();
      }
      if (!isValid) {
        throw new Error('Request must include `name`, `type`, `parent`, `id` and `children`');
      }
      if (body.type === 'file' && !body.id) {
        throw new Error('File type must include an `id` value of Mongo ObjectID string');
      }

      const current = await this.traverse(body.parent);
      if (!current) {
        throw new Error('Cannot find parent node');
      }

      const { children, type } = current;
      const duplicate = children.find(child => child.name === body.name) || false;

      if (duplicate) {
        throw new Error('Cannot add duplicate children');
      }
      if (type === 'file') {
        throw new Error('Cannot add child to node type of `file`');
      }

      children.push({
        id: body.id,
        name: body.name,
        type: body.type,
        parent: body.parent,
        children: body.children,
      });

      const { _id } = this.tree;
      return this.update(_id, res);
    } catch (error) {
      return next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasParent = body.parent;
      const isValid = hasName && hasParent;

      if (!this.tree) {
        await this.currentTree();
      }
      if (!isValid) {
        throw new Error('Request must include `name` and `parent`');
      }
      if (body.name === 'root') {
        throw new Error('Cannot remove root node');
      }

      const current = await this.traverse(body.parent);
      if (!current) {
        throw new Error('Cannot find parent node');
      }

      const { children } = current;
      const index = children.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        throw new Error('Cannot find node to delete');
      }

      children.splice(index, 1);

      const { _id } = this.tree;
      return this.update(_id, res);
    } catch (error) {
      return next(error);
    }
  }

  async rename(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasParent = body.parent;
      const hasUpdate = body.update;
      const isValid = hasName && hasParent && hasUpdate;

      if (!this.tree) {
        await this.currentTree();
      }
      if (!isValid) {
        throw new Error('Request must include `name`, `parent`, `update`');
      }
      if (body.name === 'root') {
        throw new Error('Cannot rename root node');
      }

      const current = await this.traverse(body.parent);
      if (!current) {
        throw new Error('Cannot find parent node');
      }

      const { children } = current;
      const duplicate = children.find(child => child.name === body.update.name) || false;
      if (duplicate) {
        throw new Error('Cannot add duplicate children');
      }

      const index = children.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        throw new Error('Cannot find node to rename');
      }
      children[index].name = body.update.name;
      children[index].children.forEach((child) => {
        const before = child;
        before.parent = body.update.name;
      });
      const { _id } = this.tree;
      return this.update(_id, res);
    } catch (error) {
      return next(error);
    }
  }

  traverse(destination) {
    let current;
    this.enqueue(this.tree);
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

  async update(_id, res) {
    const { nModified } = await this.model.updateOne({ _id }, { children: this.tree.children });
    return nModified ? await this.currentTree() && res.send(this.tree) : res.sendStatus(400);
  }
}

module.exports = FileSystemController;
