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
        return res.sendStatus(400);
      }
      if (body.type === 'file' && !body.id) {
        return res.sendStatus(400);
      }

      const current = await this.traverse(body.parent);

      if (!current) {
        return res.sendStatus(400);
      }

      const { children, type } = current;
      const duplicate = children.find(child => child.name === body.name) || false;

      if (duplicate) {
        return res.sendStatus(400);
      }
      if (type === 'file') {
        return res.sendStatus(400);
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
      const { params } = req;
      const hasName = params.name;
      const hasParent = params.parent;
      const isValid = hasName && hasParent;

      if (!this.tree) {
        await this.currentTree();
      }
      if (!isValid) {
        return res.sendStatus(400);
      }
      if (params.name === 'root') {
        return res.sendStatus(400);
      }

      const current = await this.traverse(params.parent);

      if (!current) {
        return res.sendStatus(400);
      }

      const { children } = current;
      const index = children.map(child => child.name).indexOf(params.name);

      if (index < 0) {
        return res.sendStatus(404);
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
        return res.sendStatus(400);
      }
      if (body.name === 'root') {
        return res.sendStatus(400);
      }

      const current = await this.traverse(body.parent);

      if (!current) {
        return res.sendStatus(400);
      }

      const { children } = current;
      const duplicate = children.find(child => child.name === body.update.name) || false;

      if (duplicate) {
        return res.sendStatus(400);
      }

      const index = children.map(child => child.name).indexOf(body.name);

      if (index < 0) {
        return res.sendStatus(404);
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
