class FileSystemController {
  constructor(model) {
    this.queue = [];
    this.model = model;
    this.root = null;
    this.dequeue = this.dequeue.bind(this);
    this.enqueue = this.enqueue.bind(this);
    this.tree = this.tree.bind(this);
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

  async tree() {
    let rootNode;
    rootNode = await this.model.findOne({ name: 'root', parent: null });
    if (!rootNode) {
      rootNode = await this.model.create({
        id: null,
        name: 'root',
        type: 'directory',
        parent: null,
        children: [],
      });
    }
    this.root = rootNode;
    return this.root;
  }

  async get(req, res, next) {
    try {
      await this.tree();
      return res.send(this.root);
    } catch (error) {
      return next(error);
    }
  }

  async update() {
    this.root = await this.model.findOne({ name: 'root', parent: null });
    return true;
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
      if (!isValid) {
        throw new Error('Request must include `name`, `type`, `parent`, `id` and `children`');
      }
      if (!this.root) {
        this.root = await this.tree();
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
        id: body.id || null,
        name: body.name,
        type: body.type,
        parent: body.parent,
        children: body.children || [],
      });

      const { _id } = this.root;
      const { nModified } = await this.model.updateOne({ _id }, { children: this.root.children });
      return nModified ? await this.update() && res.sendStatus(200) : res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }

  // req.body = { name, parent }
  async remove(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasParent = body.parent;
      const isValid = hasName && hasParent;
      if (!isValid) {
        throw new Error('Request must include `name` and `parent`');
      }
      if (!this.root) {
        this.root = await this.tree();
      }

      const current = await this.traverse(body.parent);

      if (body.name === 'root') {
        throw new Error('Cannot delete root node');
      }
      if (!current) {
        throw new Error('Cannot find parent node');
      }

      const { children } = current;
      const index = children.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        throw new Error('Cannot find node to delete');
      }

      children.splice(index, 1);

      const { _id } = this.root;
      const { nModified } = await this.model.updateOne({ _id }, { children: this.root.children });
      return nModified ? await this.update() && res.sendStatus(200) : res.sendStatus(500);
    } catch (error) {
      return next(error);
    }
  }

  // req.body = { name, parent, update: { name } }
  async rename(req, res, next) {
    try {
      const { body } = req;
      const hasName = body.name;
      const hasParent = body.parent;
      const hasUpdate = body.update;
      const isValid = hasName && hasParent && hasUpdate;

      if (!isValid) {
        throw new Error('Request must include `name`, `parent`, `update`');
      }

      const current = await this.traverse(body.parent);

      if (!this.root) {
        this.root = await this.tree();
      }
      if (body.name === 'root') {
        throw new Error('Cannot rename root node');
      }
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

      const { _id } = this.root;
      const { nModified } = await this.model.updateOne({ _id }, { children: this.root.children });
      return nModified ? await this.update() && res.sendStatus(200) : res.sendStatus(500);
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
