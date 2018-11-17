class NodeController {
  constructor(model) {
    this.queue = [];
    this.root = null;
    this.model = model;
  }

  dequeue() {
    return this.queue.shift();
  }

  enqueue(item) {
    this.queue.push(item);
  }

  async insertNode(req, res, next) {
    let current;
    try {
      const { body } = req;
      if (!body.parent) {
        return Promise.reject(new Error('Cannot have orphan nodes'));
      }
      if (!this.root) {
        const existingRoot = await this.model.findOne({ name: 'root', parent: null });
        const createRoot = async () => this.model.create({
          name: 'root',
          type: 'directory',
          parent: null,
          children: [],
          id: null,
        });
        this.root = (existingRoot && existingRoot.toObject()) || await createRoot();
      }
      current = this.traverse(body.parent);
      const { _id, children } = current;
      const duplicateChild = children.find(child => child.name === body.name);
      if (duplicateChild) {
        return Promise.reject(new Error('Cannot add duplicate children'));
      }
      if (current.type === 'file') {
        return Promise.reject(new Error('Cannot add child to node type of `file`'));
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

  // async deleteNode(req, res, next) {

  // }

  // async getNode(req, res, next) {

  // }

  // async getTree(req, res, next) {

  // }

  // async renameNode(req, res, next) {

  // }

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

module.exports = NodeController;
