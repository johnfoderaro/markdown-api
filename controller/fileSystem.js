class FileSystemController {
  constructor(model) {
    this.queue = [];
    this.model = model;
    this.root = null;
    this.db = this.db.bind(this);
    this.dequeue = this.dequeue.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.currentTree = this.currentTree.bind(this);
    this.get = this.get.bind(this);
    this.insert = this.insert.bind(this);
    this.move = this.move.bind(this);
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

  async db(res) {
    const { _id, children } = this.root;
    const { nModified } = await this.model.updateOne({ _id }, { children });
    return nModified ? await this.currentTree() && res.sendStatus(200) : res.sendStatus(500);
  }

  async currentTree() {
    const find = {
      name: 'root',
      parent: null,
    };
    const create = {
      name: 'root',
      type: 'dir',
      parent: null,
      children: [],
    };
    this.root = await this.model.findOne(find) || await this.model.create(create);
    return true;
  }

  async get(req, res, next) {
    try {
      await this.currentTree();
      return res.send(this.root);
    } catch (error) {
      return next(error);
    }
  }

  async insert(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasType = body.type;
      const hasParent = body.parent;
      const hasId = body.id || body.id === null;
      const hasChildren = body.children;
      const isValid = hasName && hasType && hasParent && hasId && hasChildren;

      if (!this.root) {
        await this.currentTree();
      }
      if (!isValid) {
        throw new Error('Request must include `name`, `type`, `parent`, `id` and `children`');
      }

      const current = await this.traverse(body.parent);
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

      return this.db(res);
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

      if (!this.root) {
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

      return this.db(res);
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

      if (!this.root) {
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
      const index = children.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        throw new Error('Cannot find node to rename');
      }

      children[index].name = body.update.name;
      children[index].children.forEach((child) => {
        const before = child;
        before.parent = body.update.name;
      });
      return this.db(res);
    } catch (error) {
      return next(error);
    }
  }

  async move(req, res, next) {
    try {
      const { body } = req;
      const hasId = body.id || body.id === null;
      const hasName = body.name;
      const hasParent = body.parent;
      const hasUpdate = body.update;
      const isValid = hasId && hasName && hasParent && hasUpdate;

      if (!this.root) {
        await this.currentTree();
      }
      if (!isValid) {
        throw new Error('Request must include `id`, `name`, `type`, and `parent`');
      }
      if (body.name === 'root') {
        throw new Error('Cannot move root node');
      }

      const currentParent = await this.traverse(body.parent);
      if (!currentParent) {
        throw new Error('Cannot find parent node');
      }

      const currentChildren = currentParent.children;
      const index = currentChildren.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        throw new Error('Cannot find node to move');
      }

      const toUpdate = currentChildren[index];
      const newParent = await this.traverse(body.update.parent);
      const newChildren = newParent.children;
      const newType = newParent.type;
      const newDuplicate = newChildren.find(child => child.name === body.name) || false;

      if (newDuplicate) {
        throw new Error('Cannot add duplicate children');
      }
      if (newType === 'file') {
        throw new Error('Cannot add child to node type of `file`');
      }

      toUpdate.parent = body.update.parent;
      currentChildren.splice(index, 1);
      newChildren.push({
        id: toUpdate.id,
        name: toUpdate.name,
        type: toUpdate.type,
        parent: toUpdate.parent,
        children: toUpdate.children,
      });

      return this.db(res);
    } catch (error) {
      return next(error);
    }
  }

  async traverse(destination) {
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
